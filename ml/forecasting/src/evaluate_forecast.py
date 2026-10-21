"""Train/evaluate a one-hour-ahead peak forecast without using same-time components."""

from __future__ import annotations

import argparse
import csv
import json
import math
import platform
from datetime import datetime, timedelta
from pathlib import Path


STEP = timedelta(minutes=15)
HORIZON_STEPS = 4
HORIZON_MINUTES = 60
TRAINING_PEAK_QUANTILE = 0.90
MAX_VALIDATION_F1_DEGRADATION = 0.02


def load_rows(path: Path) -> dict[datetime, dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    by_time = {datetime.fromisoformat(row["timestamp_local"]): row for row in rows}
    if len(by_time) != len(rows):
        raise ValueError("Composite has duplicate timestamps")
    if any(row["datasetClass"] != "SIMULATED_COMPOSITE" for row in rows):
        raise ValueError("Forecast evaluator accepts only SIMULATED_COMPOSITE rows")
    return by_time


def examples(by_time: dict[datetime, dict[str, str]], splits: set[str] | None = None) -> list[dict[str, float | str | datetime]]:
    result = []
    for now, row in sorted(by_time.items()):
        split = row["temporal_split"]
        if splits is not None and split not in splits:
            continue
        previous = [by_time.get(now - STEP), by_time.get(now - timedelta(hours=1))]
        future = [by_time.get(now + STEP * offset) for offset in range(1, HORIZON_STEPS + 1)]
        prior_day_future = [by_time.get(now - timedelta(days=1) + STEP * offset) for offset in range(1, HORIZON_STEPS + 1)]
        if not all(previous) or not all(future) or not all(prior_day_future):
            continue
        if any(item["temporal_split"] != split for item in future if item):
            continue  # purge forecast windows that cross a temporal split boundary
        actual_future_peak = max(float(item["gridImportKw"]) for item in future if item)
        peak_index = max(range(HORIZON_STEPS), key=lambda index: float(future[index]["gridImportKw"]))
        seasonal_values = [float(item["gridImportKw"]) for item in prior_day_future if item]
        seasonal_peak_index = max(range(HORIZON_STEPS), key=lambda index: seasonal_values[index])
        result.append({
            "timestamp": now,
            "split": split,
            "currentKw": float(row["gridImportKw"]),
            "lag15mKw": float(previous[0]["gridImportKw"]),
            "lag60mKw": float(previous[1]["gridImportKw"]),
            "nextKw": float(future[0]["gridImportKw"]),
            "actualPeakKw": actual_future_peak,
            "actualPeakAt": now + STEP * (peak_index + 1),
            "persistenceKw": float(row["gridImportKw"]),
            "seasonalNaiveKw": max(seasonal_values),
            "seasonalNaivePeakOffsetSteps": seasonal_peak_index + 1,
        })
    return result


def fit_ar1(rows: list[dict[str, float | str | datetime]]) -> dict[str, float]:
    xs = [float(row["currentKw"]) for row in rows]
    ys = [float(row["nextKw"]) for row in rows]
    x_mean, y_mean = sum(xs) / len(xs), sum(ys) / len(ys)
    variance = sum((x - x_mean) ** 2 for x in xs)
    slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)) / variance if variance else 0.0
    intercept = y_mean - slope * x_mean
    return {"intercept": intercept, "currentGridImportCoefficient": slope}


def predict_ar1(model: dict[str, float], current_kw: float) -> float:
    return max(0.0, model["intercept"] + model["currentGridImportCoefficient"] * current_kw)


def forecast_ar1_peak(model: dict[str, float], current_kw: float) -> tuple[float, int]:
    values = []
    for _ in range(HORIZON_STEPS):
        current_kw = predict_ar1(model, current_kw)
        values.append(current_kw)
    peak_index = max(range(len(values)), key=values.__getitem__)
    return values[peak_index], peak_index + 1


def percentile(values: list[float], quantile: float) -> float:
    if not values:
        raise ValueError("Cannot derive a threshold from an empty training split")
    ordered = sorted(values)
    return ordered[max(0, math.ceil(quantile * len(ordered)) - 1)]


def _classification(rows: list[dict[str, float | str | datetime]], predictions: list[float], threshold: float) -> dict[str, float | int]:
    tp = fp = fn = 0
    for row, prediction in zip(rows, predictions):
        actual_risk = float(row["actualPeakKw"]) >= threshold
        predicted_risk = prediction >= threshold
        tp += actual_risk and predicted_risk
        fp += not actual_risk and predicted_risk
        fn += actual_risk and not predicted_risk
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"thresholdKw": threshold, "truePositives": tp, "falsePositives": fp, "falseNegatives": fn, "precision": precision, "recall": recall, "f1": f1}


def regression_metrics(rows: list[dict[str, float | str | datetime]], predictions: list[float], threshold: float) -> dict[str, float | int | dict]:
    errors = [prediction - float(row["actualPeakKw"]) for row, prediction in zip(rows, predictions)]
    return {
        "n": len(rows),
        "maeKw": sum(abs(error) for error in errors) / len(errors),
        "rmseKw": math.sqrt(sum(error * error for error in errors) / len(errors)),
        "peakDetection": _classification(rows, predictions, threshold),
    }


def select_forecast(validation_metrics: dict[str, dict], candidate_name: str = "AR1") -> tuple[str, bool]:
    """Select on validation only; require regression gain and bounded risk loss."""
    baseline_names = ("PERSISTENCE", "SEASONAL_NAIVE_24H")
    baseline_name = min(baseline_names, key=lambda name: (validation_metrics[name]["maeKw"], name != "PERSISTENCE"))
    candidate = validation_metrics[candidate_name]
    baseline = validation_metrics[baseline_name]
    promoted = (
        candidate["maeKw"] < baseline["maeKw"]
        and candidate["rmseKw"] < baseline["rmseKw"]
        and candidate["peakDetection"]["f1"] >= baseline["peakDetection"]["f1"] - MAX_VALIDATION_F1_DEGRADATION
    )
    return (candidate_name, True) if promoted else (baseline_name, False)


def evaluate(dataset_path: Path, output_dir: Path) -> Path:
    samples = examples(load_rows(dataset_path))
    by_split = {name: [row for row in samples if row["split"] == name] for name in ("train", "validation", "test")}
    if not all(by_split.values()):
        raise ValueError(f"Incomplete chronological split: { {key: len(value) for key, value in by_split.items()} }")

    train, validation, test = by_split["train"], by_split["validation"], by_split["test"]
    threshold = percentile([float(row["actualPeakKw"]) for row in train], TRAINING_PEAK_QUANTILE)
    model = fit_ar1(train)
    val_predictions = {
        "AR1": [forecast_ar1_peak(model, float(row["currentKw"]))[0] for row in validation],
        "PERSISTENCE": [float(row["persistenceKw"]) for row in validation],
        "SEASONAL_NAIVE_24H": [float(row["seasonalNaiveKw"]) for row in validation],
    }
    val_metrics = {name: regression_metrics(validation, predictions, threshold) for name, predictions in val_predictions.items()}
    selected_name, promoted = select_forecast(val_metrics)
    selected_predictions = {
        "AR1": [forecast_ar1_peak(model, float(row["currentKw"]))[0] for row in test],
        "PERSISTENCE": [float(row["persistenceKw"]) for row in test],
        "SEASONAL_NAIVE_24H": [float(row["seasonalNaiveKw"]) for row in test],
    }
    test_metrics = {name: regression_metrics(test, predictions, threshold) for name, predictions in selected_predictions.items()}
    output_dir.mkdir(parents=True, exist_ok=True)
    chosen_predictions = selected_predictions[selected_name]
    prediction_path = output_dir / "forecast_test_predictions.csv"
    with prediction_path.open("w", encoding="utf-8", newline="") as handle:
        fields = ["timestamp_local", "horizonMinutes", "predictedPeakAtLocal", "predictedPeakGridImportKw", "actualPeakAtLocal", "actualPeakGridImportKw", "riskThresholdKw", "riskState", "datasetClass", "forecastMethod"]
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        for row, prediction in zip(test, chosen_predictions):
            writer.writerow({
                "timestamp_local": row["timestamp"].isoformat(sep=" "),
                "horizonMinutes": HORIZON_MINUTES,
                "predictedPeakAtLocal": (
                    (row["timestamp"] + STEP * forecast_ar1_peak(model, float(row["currentKw"]))[1]).isoformat(sep=" ")
                    if selected_name == "AR1"
                    else (row["timestamp"] + STEP * (row["seasonalNaivePeakOffsetSteps"] if selected_name == "SEASONAL_NAIVE_24H" else 1)).isoformat(sep=" ")
                ),
                "predictedPeakGridImportKw": f"{prediction:.6f}",
                "actualPeakAtLocal": row["actualPeakAt"].isoformat(sep=" "),
                "actualPeakGridImportKw": f"{float(row['actualPeakKw']):.6f}",
                "riskThresholdKw": f"{threshold:.6f}",
                "riskState": "PREDICTED_PEAK" if prediction >= threshold else "NORMAL",
                "datasetClass": "SIMULATED_COMPOSITE",
                "forecastMethod": selected_name,
            })

    result = {
        "status": "MODEL_PROMOTED" if promoted else "BASELINE_RETAINED",
        "datasetClass": "SIMULATED_COMPOSITE",
        "environment": {"pythonVersion": platform.python_version(), "dependencies": "Python standard library only", "randomness": "none; closed-form deterministic ordinary least squares"},
        "target": "gridImportKw at each next 15-minute step; report maximum and offset over the next 60 minutes",
        "horizonMinutes": HORIZON_MINUTES,
        "features": ["gridImportKw at forecast origin; recursively predicted values are fed forward"],
        "modelCandidate": {"type": "AR(1) linear regression", "fitOn": "one-step pairs within train only", **model},
        "baselines": ["PERSISTENCE: current gridImportKw", "SEASONAL_NAIVE_24H: prior day's next-hour peak"],
        "selection": {"rule": "promote AR1 only if validation MAE and RMSE beat the lowest-MAE baseline and validation peak F1 is no more than 0.02 lower; otherwise retain the lowest-MAE baseline (persistence wins ties)", "riskF1MaxDegradation": MAX_VALIDATION_F1_DEGRADATION, "selectedOnValidation": selected_name, "forecastMethodUsedForTest": selected_name, "modelPromoted": promoted},
        "riskThreshold": {"valueKw": threshold, "method": "90th percentile of training future-hour peaks only", "scope": "benchmark anomaly threshold; not Aurora contract policy or operational threshold"},
        "split": {name: {"n": len(rows), "first": rows[0]["timestamp"].isoformat(sep=" "), "last": rows[-1]["timestamp"].isoformat(sep=" ")} for name, rows in by_split.items()},
        "validationMetrics": val_metrics,
        "testMetrics": test_metrics,
        "testMetricsOpenedOnceAfterSelection": True,
        "structuredSignal": {"target": "gridImportKw", "statistic": "maximum over forecast horizon", "horizonMinutes": HORIZON_MINUTES, "fields": ["predictedPeakAtLocal", "predictedPeakGridImportKw", "riskThresholdKw", "riskState", "datasetClass", "forecastMethod"], "riskRule": "predictedPeakGridImportKw >= supplied riskThresholdKw", "riskStateValues": ["NORMAL", "PREDICTED_PEAK"], "operationalUse": False},
        "limitations": [
            "Prediction estimates a future one-hour maximum from lagged composite grid import; component values at the target timestamp are never features.",
            "Training series is simulated composite: modeled EULP load, uniform-power EV session estimates, independent PVDAQ generation scaled to hypothetical 75 kWp.",
            "The benchmark threshold is a train-derived tail threshold, not the API's persisted site demand limit; future Decision Engine must apply its current policy.",
            "Temporal holdout tests generalization only within this source-composite construction; it does not validate Aurora operations.",
        ],
    }
    result_path = output_dir / "forecast_evaluation.json"
    result_path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    model_path = output_dir / "ar1_model.json"
    if promoted:
        model_path.write_text(json.dumps({"modelVersion": "cg-ar1-1h-v1", **result["modelCandidate"], "horizonMinutes": HORIZON_MINUTES, "datasetClass": "SIMULATED_COMPOSITE", "operationalUse": False}, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    elif model_path.exists():
        model_path.unlink()
    return result_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=Path("ml/forecasting/data/forecasting_series.csv"))
    parser.add_argument("--output-dir", type=Path, default=Path("ml/forecasting/data"))
    args = parser.parse_args()
    path = evaluate(args.dataset, args.output_dir)
    print(f"Forecast evaluation: {path}")


if __name__ == "__main__":
    main()
