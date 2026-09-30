"""One controlled CG-AI-03C round against the frozen Ridge benchmark."""

from __future__ import annotations

import argparse
import csv
import json
import math
import platform
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src.evaluate_forecast import (  # noqa: E402
    HORIZON_MINUTES,
    TRAINING_PEAK_QUANTILE,
    examples,
    load_rows,
    percentile,
    regression_metrics,
)
from src.evaluate_lag_calendar import FEATURE_NAMES as INCUMBENT_FEATURE_NAMES  # noqa: E402
from src.evaluate_lag_calendar import feature_values as incumbent_features  # noqa: E402


STEP = timedelta(minutes=15)
RIDGE_ALPHA = 1.0
GB_ROUNDS = 24
GB_LEARNING_RATE = 0.1


def _history(by_time: dict, row: dict, column: str, steps_back: int) -> float:
    source = by_time.get(row["timestamp"] - STEP * steps_back)
    if source is None:
        raise ValueError(f"Missing {column} history at {row['timestamp']} (-{steps_back} steps)")
    return float(source[column])


def temporal_features(row: dict, by_time: dict) -> list[float]:
    values = incumbent_features(row)
    values.extend(_history(by_time, row, "gridImportKw", steps) for steps in (2, 8, 16))
    last_hour = [_history(by_time, row, "gridImportKw", steps) for steps in range(4)]
    values.extend((sum(last_hour) / 4, min(last_hour), max(last_hour)))
    values.append(last_hour[0] - last_hour[-1])
    return values


TEMPORAL_FEATURE_NAMES = INCUMBENT_FEATURE_NAMES + (
    "gridImportKw_lag_30m", "gridImportKw_lag_2h", "gridImportKw_lag_4h",
    "gridImportKw_mean_trailing_1h", "gridImportKw_min_trailing_1h", "gridImportKw_max_trailing_1h",
    "gridImportKw_change_trailing_1h",
)
COMPONENTS = ("buildingLoadKw", "evChargingKw", "pvGenerationKw")
COMPONENT_FEATURE_NAMES = INCUMBENT_FEATURE_NAMES + tuple(
    f"{component}_{lag}" for component in COMPONENTS for lag in ("origin", "lag_15m", "lag_60m")
)
GB_FEATURE_NAMES = INCUMBENT_FEATURE_NAMES + tuple(
    f"{component}_{lag}" for component in COMPONENTS for lag in ("origin", "lag_60m")
)


def component_features(row: dict, by_time: dict, lags: tuple[int, ...] = (0, 1, 4)) -> list[float]:
    return [
        float(by_time[row["timestamp"] - STEP * lag][component])
        for component in COMPONENTS
        for lag in lags
    ]


def ridge_features(row: dict, by_time: dict, variant: str) -> list[float]:
    if variant == "temporal":
        return temporal_features(row, by_time)
    if variant == "components":
        return incumbent_features(row) + component_features(row, by_time)
    if variant == "boosting":
        return incumbent_features(row) + component_features(row, by_time, (0, 4))
    raise ValueError(f"Unknown feature variant: {variant}")


def fit_ridge(x_rows: list[list[float]], targets: list[float], alpha: float = RIDGE_ALPHA) -> dict:
    count, width = len(x_rows), len(x_rows[0])
    means = [sum(row[i] for row in x_rows) / count for i in range(width)]
    scales = [math.sqrt(sum((row[i] - means[i]) ** 2 for row in x_rows) / count) or 1.0 for i in range(width)]
    normalized = [[(value - means[i]) / scales[i] for i, value in enumerate(row)] for row in x_rows]
    target_mean = sum(targets) / count
    gram = [[sum(row[i] * row[j] for row in normalized) for j in range(width)] for i in range(width)]
    for i in range(width):
        gram[i][i] += alpha
    vector = [sum(row[i] * (target - target_mean) for row, target in zip(normalized, targets)) for i in range(width)]
    coefficients = _solve(gram, vector)
    return {"featureMeans": means, "featureScales": scales, "coefficients": coefficients, "interceptKw": target_mean, "ridgeAlpha": alpha}


def _solve(matrix: list[list[float]], vector: list[float]) -> list[float]:
    size = len(vector)
    augmented = [row[:] + [value] for row, value in zip(matrix, vector)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) < 1e-12:
            raise ValueError("Ridge design matrix is singular")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        scale = augmented[column][column]
        augmented[column] = [value / scale for value in augmented[column]]
        for row in range(size):
            if row != column:
                factor = augmented[row][column]
                augmented[row] = [value - factor * pivot_value for value, pivot_value in zip(augmented[row], augmented[column])]
    return [augmented[row][-1] for row in range(size)]


def predict_ridge(model: dict, features: list[float]) -> float:
    value = model["interceptKw"] + sum(
        coefficient * (feature - model["featureMeans"][i]) / model["featureScales"][i]
        for i, (coefficient, feature) in enumerate(zip(model["coefficients"], features))
    )
    return max(0.0, value)


def fit_boosted_stumps(x_rows: list[list[float]], targets: list[float], rounds: int = GB_ROUNDS) -> dict:
    """Fixed additive gradient boosting with depth-1 squared-error trees; no randomness or tuning."""
    initial = sum(targets) / len(targets)
    fitted = [initial] * len(targets)
    stumps = []
    for _ in range(rounds):
        residuals = [target - estimate for target, estimate in zip(targets, fitted)]
        best_gain, best = 0.0, None
        for feature_index in range(len(x_rows[0])):
            ordered = sorted((row[feature_index], residual) for row, residual in zip(x_rows, residuals))
            total = sum(residuals)
            left_sum = 0.0
            for split in range(1, len(ordered)):
                left_sum += ordered[split - 1][1]
                if ordered[split - 1][0] == ordered[split][0]:
                    continue
                right_sum = total - left_sum
                gain = left_sum * left_sum / split + right_sum * right_sum / (len(ordered) - split)
                if gain > best_gain:
                    best_gain = gain
                    best = (feature_index, (ordered[split - 1][0] + ordered[split][0]) / 2,
                            left_sum / split, right_sum / (len(ordered) - split))
        if best is None:
            break
        feature_index, threshold, left_value, right_value = best
        stumps.append({"featureIndex": feature_index, "threshold": threshold, "leftValue": left_value, "rightValue": right_value})
        fitted = [estimate + GB_LEARNING_RATE * (left_value if row[feature_index] <= threshold else right_value)
                  for row, estimate in zip(x_rows, fitted)]
    return {"initialKw": initial, "learningRate": GB_LEARNING_RATE, "stumps": stumps}


def predict_boosted_stumps(model: dict, features: list[float]) -> float:
    value = model["initialKw"]
    for stump in model["stumps"]:
        leaf = stump["leftValue"] if features[stump["featureIndex"]] <= stump["threshold"] else stump["rightValue"]
        value += model["learningRate"] * leaf
    return max(0.0, value)


def _delta_predictions(model: dict, rows: list[dict], features: list[list[float]]) -> list[float]:
    return [max(0.0, float(row["currentKw"]) + predict_ridge(model, values)) for row, values in zip(rows, features)]


def _percent_change(value: float, incumbent: float) -> float:
    return (value - incumbent) / incumbent * 100 if incumbent else 0.0


def _metrics(validation: list[dict], predictions: dict[str, list[float]], threshold: float) -> dict:
    return {name: regression_metrics(validation, values, threshold) for name, values in predictions.items()}


def evaluate(dataset_path: Path, output_dir: Path) -> Path:
    by_time = load_rows(dataset_path)
    samples = examples(by_time, {"train", "validation"})
    by_split = {name: [row for row in samples if row["split"] == name] for name in ("train", "validation")}
    train, validation = by_split["train"], by_split["validation"]
    if not train or not validation:
        raise ValueError("Training and validation windows must both be non-empty")

    train_times = {row["timestamp"] for row in train}
    validation_times = {row["timestamp"] for row in validation}
    train_features = {name: [ridge_features(row, by_time, name) for row in train] for name in ("temporal", "components", "boosting")}
    validation_features = {name: [ridge_features(row, by_time, name) for row in validation] for name in ("temporal", "components", "boosting")}
    if len(train_times) != len(train_features["temporal"]) or len(validation_times) != len(validation_features["temporal"]):
        raise ValueError("Feature history must preserve the frozen rolling-origin sample set")

    incumbent = json.loads((output_dir / "lag_calendar_ridge_model.json").read_text(encoding="utf-8"))
    threshold = percentile([float(row["actualPeakKw"]) for row in train], TRAINING_PEAK_QUANTILE)
    actual_targets = [float(row["actualPeakKw"]) for row in train]
    candidates = {
        "RIDGE_INCUMBENT": [max(0.0, incumbent["interceptKw"] + sum(
            coefficient * (value - incumbent["featureMeans"][i]) / incumbent["featureScales"][i]
            for i, (coefficient, value) in enumerate(zip(incumbent["coefficients"], incumbent_features(row)))
        )) for row in validation],
    }

    fitted = {}
    for name, variant in (("RIDGE_TEMPORAL", "temporal"), ("RIDGE_COMPONENTS", "components")):
        model = fit_ridge(train_features[variant], actual_targets)
        fitted[name] = ("ridge", model)
        candidates[name] = [predict_ridge(model, values) for values in validation_features[variant]]

    delta_model = fit_ridge(train_features["temporal"][:], [target - float(row["currentKw"]) for target, row in zip(actual_targets, train)])
    fitted["RIDGE_DELTA"] = ("ridge_delta", delta_model)
    candidates["RIDGE_DELTA"] = _delta_predictions(delta_model, validation, validation_features["temporal"])

    boosting_targets = actual_targets
    boosting_model = fit_boosted_stumps(train_features["boosting"], boosting_targets)
    fitted["GRADIENT_BOOSTING_STUMPS"] = ("gradient_boosting_stumps", boosting_model)
    candidates["GRADIENT_BOOSTING_STUMPS"] = [predict_boosted_stumps(boosting_model, values) for values in validation_features["boosting"]]
    candidates["PERSISTENCE"] = [float(row["persistenceKw"]) for row in validation]
    candidates["SEASONAL_NAIVE_24H"] = [float(row["seasonalNaiveKw"]) for row in validation]
    validation_metrics = _metrics(validation, candidates, threshold)

    # Apply CG-AI-03's MAE/RMSE/F1 gate against the incumbent and avoid promoting a marginal rounded tie.
    incumbent_metrics = validation_metrics["RIDGE_INCUMBENT"]
    promotable = [name for name in fitted if (
        validation_metrics[name]["maeKw"] < incumbent_metrics["maeKw"]
        and validation_metrics[name]["rmseKw"] < incumbent_metrics["rmseKw"]
        and validation_metrics[name]["peakDetection"]["f1"] >= incumbent_metrics["peakDetection"]["f1"] - 0.02
    )]
    selected = min(promotable, key=lambda name: (
        validation_metrics[name]["maeKw"], validation_metrics[name]["rmseKw"], -validation_metrics[name]["peakDetection"]["f1"]
    )) if promotable else "RIDGE_INCUMBENT"
    promoted = selected != "RIDGE_INCUMBENT"

    result = {
        "round": "CG-AI-03C",
        "datasetClass": "SIMULATED_COMPOSITE",
        "environment": {"pythonVersion": platform.python_version(), "dependencies": "Python standard library only", "randomness": "none"},
        "target": "maximum gridImportKw in the next four 15-minute intervals",
        "horizonMinutes": HORIZON_MINUTES,
        "riskThreshold": {"valueKw": threshold, "method": "training-only 90th percentile of future-hour peaks", "operationalUse": False},
        "split": {name: {"n": len(rows), "first": rows[0]["timestamp"].isoformat(sep=" "), "last": rows[-1]["timestamp"].isoformat(sep=" ")} for name, rows in by_split.items()},
        "candidates": {
            "RIDGE_INCUMBENT": {"type": "frozen CG-AI-03B standardized Ridge", "features": list(INCUMBENT_FEATURE_NAMES), "evaluation": "reuse existing artifact; not refit"},
            "RIDGE_TEMPORAL": {"type": "standardized Ridge alpha=1.0", "features": list(TEMPORAL_FEATURE_NAMES)},
            "RIDGE_COMPONENTS": {"type": "standardized Ridge alpha=1.0", "features": list(COMPONENT_FEATURE_NAMES)},
            "RIDGE_DELTA": {"type": "standardized Ridge alpha=1.0 on future-hour-peak minus origin grid import", "features": list(TEMPORAL_FEATURE_NAMES), "reconstruction": "max(0, current gridImportKw + predicted delta)"},
            "GRADIENT_BOOSTING_STUMPS": {"type": "deterministic additive gradient boosting regression with depth-1 squared-error trees", "features": list(GB_FEATURE_NAMES), "rounds": GB_ROUNDS, "learningRate": GB_LEARNING_RATE, "tuning": "none"},
            "PERSISTENCE": {"type": "repeat current grid import"},
            "SEASONAL_NAIVE_24H": {"type": "prior-day corresponding next-hour peak"},
        },
        "validationMetrics": validation_metrics,
        "selection": {
            "selectedOnValidation": selected,
            "promoted": promoted,
            "rule": "new candidate must strictly improve both MAE and RMSE over frozen incumbent; F1 may not fall by more than 0.02; among passing candidates rank by MAE, RMSE, then F1",
            "selectedCandidateDeltaPercentVsIncumbent": {
                metric: _percent_change(validation_metrics[selected][metric], incumbent_metrics[metric])
                for metric in ("maeKw", "rmseKw")
            },
            "riskF1DifferenceVsIncumbent": validation_metrics[selected]["peakDetection"]["f1"] - incumbent_metrics["peakDetection"]["f1"],
        },
        "testEvaluatedThisRound": False,
        "status": "NEW_MODEL_PROMOTED" if promoted else "INCUMBENT_RETAINED_SEARCH_CLOSED",
        "limitations": [
            "All benchmark rows are SIMULATED_COMPOSITE and do not represent Aurora telemetry.",
            "No candidate predicts the exact quarter-hour of the next-hour maximum.",
            "Component lags inherit the composite construction and do not establish causal generalization to a real site.",
            "The boosted stump model is an additive, low-capacity nonlinear candidate; no package was installed and no tuning was performed.",
        ],
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    if promoted:
        test = [row for row in examples(by_time, {"test"}) if row["split"] == "test"]
        if not test:
            raise ValueError("Frozen promoted candidate requires a non-empty test block")
        variant = {"RIDGE_TEMPORAL": "temporal", "RIDGE_COMPONENTS": "components", "RIDGE_DELTA": "temporal", "GRADIENT_BOOSTING_STUMPS": "boosting"}[selected]
        test_features = [ridge_features(row, by_time, variant) for row in test]
        test_predictions = {
            "PERSISTENCE": [float(row["persistenceKw"]) for row in test],
            "RIDGE_INCUMBENT": [max(0.0, incumbent["interceptKw"] + sum(
                coefficient * (value - incumbent["featureMeans"][i]) / incumbent["featureScales"][i]
                for i, (coefficient, value) in enumerate(zip(incumbent["coefficients"], incumbent_features(row)))
            )) for row in test],
        }
        kind, model = fitted[selected]
        if kind == "ridge_delta":
            test_predictions[selected] = _delta_predictions(model, test, test_features)
        elif kind == "ridge":
            test_predictions[selected] = [predict_ridge(model, values) for values in test_features]
        else:
            test_predictions[selected] = [predict_boosted_stumps(model, values) for values in test_features]
        result["testEvaluatedThisRound"] = True
        result["testMetrics"] = _metrics(test, test_predictions, threshold)
        result["testSplit"] = {"n": len(test), "first": test[0]["timestamp"].isoformat(sep=" "), "last": test[-1]["timestamp"].isoformat(sep=" ")}
        model_payload = {
            "modelVersion": f"cg-ai-03c-{selected.lower()}-1h-v1", "candidate": selected,
            "featureNames": list(TEMPORAL_FEATURE_NAMES if variant == "temporal" else COMPONENT_FEATURE_NAMES if variant == "components" else GB_FEATURE_NAMES),
            "horizonMinutes": HORIZON_MINUTES, "datasetClass": "SIMULATED_COMPOSITE", "operationalUse": False,
            "benchmarkRiskThresholdKw": threshold,
            "testMetrics": {
                "maeKw": result["testMetrics"][selected]["maeKw"],
                "rmseKw": result["testMetrics"][selected]["rmseKw"],
                "baselineMaeKw": result["testMetrics"]["PERSISTENCE"]["maeKw"],
                "baselineRmseKw": result["testMetrics"]["PERSISTENCE"]["rmseKw"],
                "testFrom": result["testSplit"]["first"],
                "testTo": result["testSplit"]["last"],
            },
            "model": model, "targetTransform": "DELTA_FROM_ORIGIN" if kind == "ridge_delta" else "DIRECT",
        }
        (output_dir / "forecast_cg_ai_03c_model.json").write_text(json.dumps(model_payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        with (output_dir / "forecast_cg_ai_03c_test.csv").open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["timestamp_local", "horizonMinutes", "predictedPeakGridImportKw", "actualPeakGridImportKw", "riskThresholdKw", "riskState", "datasetClass", "forecastMethod"], lineterminator="\n")
            writer.writeheader()
            for row, prediction in zip(test, test_predictions[selected]):
                writer.writerow({"timestamp_local": row["timestamp"].isoformat(sep=" "), "horizonMinutes": HORIZON_MINUTES,
                    "predictedPeakGridImportKw": f"{prediction:.6f}", "actualPeakGridImportKw": f"{float(row['actualPeakKw']):.6f}",
                    "riskThresholdKw": f"{threshold:.6f}", "riskState": "PREDICTED_PEAK" if prediction >= threshold else "NORMAL",
                    "datasetClass": "SIMULATED_COMPOSITE", "forecastMethod": selected})

    result_path = output_dir / "forecast_third_candidate_evaluation.json"
    result_path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return result_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=Path("ml/forecasting/data/forecasting_series.csv"))
    parser.add_argument("--output-dir", type=Path, default=Path("ml/forecasting/data"))
    args = parser.parse_args()
    print(f"CG-AI-03C evaluation: {evaluate(args.dataset, args.output_dir)}")


if __name__ == "__main__":
    main()
