"""Evaluate one fixed lag/calendar Ridge candidate under CG-AI-03B's frozen split."""

from __future__ import annotations

import argparse
import csv
import json
import math
import platform
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src.evaluate_forecast import (
    HORIZON_MINUTES,
    TRAINING_PEAK_QUANTILE,
    examples,
    load_rows,
    percentile,
    regression_metrics,
    select_forecast,
)


CANDIDATE = "LINEAR_LAGS_CALENDAR"
RIDGE_ALPHA = 1.0
FEATURE_NAMES = (
    "gridImportKw_lag_0",
    "gridImportKw_lag_15m",
    "gridImportKw_lag_60m",
    "previous_day_next_hour_peak_kw",
    "hour_sin",
    "hour_cos",
    "weekday_sin",
    "weekday_cos",
    "year_day_sin",
    "year_day_cos",
)


def feature_values(row: dict) -> list[float]:
    stamp: datetime = row["timestamp"]
    hour = (stamp.hour * 60 + stamp.minute) / 1440
    weekday = (stamp.weekday() + hour) / 7
    year_days = 366 if stamp.replace(month=12, day=31).timetuple().tm_yday == 366 else 365
    year_day = (stamp.timetuple().tm_yday - 1) / year_days
    return [
        float(row["currentKw"]),
        float(row["lag15mKw"]),
        float(row["lag60mKw"]),
        float(row["seasonalNaiveKw"]),
        math.sin(2 * math.pi * hour), math.cos(2 * math.pi * hour),
        math.sin(2 * math.pi * weekday), math.cos(2 * math.pi * weekday),
        math.sin(2 * math.pi * year_day), math.cos(2 * math.pi * year_day),
    ]


def _solve(matrix: list[list[float]], vector: list[float]) -> list[float]:
    size = len(vector)
    augmented = [row[:] + [value] for row, value in zip(matrix, vector)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) < 1e-12:
            raise ValueError("Lag/calendar OLS design matrix is singular")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        scale = augmented[column][column]
        augmented[column] = [value / scale for value in augmented[column]]
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [value - factor * pivot_value for value, pivot_value in zip(augmented[row], augmented[column])]
    return [augmented[row][-1] for row in range(size)]


def fit_ridge(rows: list[dict]) -> dict:
    x_rows = [feature_values(row) for row in rows]
    y_values = [float(row["actualPeakKw"]) for row in rows]
    count = len(rows)
    means = [sum(values) / count for values in zip(*x_rows)]
    scales = [math.sqrt(sum((row[index] - means[index]) ** 2 for row in x_rows) / count) or 1.0 for index in range(len(FEATURE_NAMES))]
    normalized = [[(value - means[index]) / scales[index] for index, value in enumerate(row)] for row in x_rows]
    y_mean = sum(y_values) / count
    gram = [[sum(row[i] * row[j] for row in normalized) for j in range(len(FEATURE_NAMES))] for i in range(len(FEATURE_NAMES))]
    for index in range(len(FEATURE_NAMES)):
        gram[index][index] += RIDGE_ALPHA
    target = [sum(row[i] * (value - y_mean) for row, value in zip(normalized, y_values)) for i in range(len(FEATURE_NAMES))]
    return {"featureMeans": means, "featureScales": scales, "coefficients": _solve(gram, target), "interceptKw": y_mean, "ridgeAlpha": RIDGE_ALPHA}


def predict(model: dict, row: dict) -> float:
    values = feature_values(row)
    estimate = model["interceptKw"] + sum(
        coefficient * (value - model["featureMeans"][index]) / model["featureScales"][index]
        for index, (coefficient, value) in enumerate(zip(model["coefficients"], values))
    )
    return max(0.0, estimate)


def evaluate(dataset_path: Path, output_dir: Path) -> Path:
    by_time = load_rows(dataset_path)
    # Do not derive test targets or metrics until (and unless) validation promotes the candidate.
    fit_and_validation = examples(by_time, {"train", "validation"})
    by_split = {name: [row for row in fit_and_validation if row["split"] == name] for name in ("train", "validation")}
    if not all(by_split.values()):
        raise ValueError("Training and validation windows must both be non-empty")
    train, validation = by_split["train"], by_split["validation"]
    threshold = percentile([float(row["actualPeakKw"]) for row in train], TRAINING_PEAK_QUANTILE)
    model = fit_ridge(train)
    val_predictions = {
        CANDIDATE: [predict(model, row) for row in validation],
        "PERSISTENCE": [float(row["persistenceKw"]) for row in validation],
        "SEASONAL_NAIVE_24H": [float(row["seasonalNaiveKw"]) for row in validation],
    }
    val_metrics = {name: regression_metrics(validation, values, threshold) for name, values in val_predictions.items()}
    selected_name, promoted = select_forecast(val_metrics, CANDIDATE)

    output_dir.mkdir(parents=True, exist_ok=True)
    result = {
        "candidate": CANDIDATE,
        "candidateType": "standardized multiple linear regression (ridge, fixed alpha=1.0)",
        "datasetClass": "SIMULATED_COMPOSITE",
        "environment": {"pythonVersion": platform.python_version(), "dependencies": "Python standard library only", "randomness": "none; deterministic closed-form ridge regression"},
        "features": list(FEATURE_NAMES),
        "horizonMinutes": HORIZON_MINUTES,
        "model": model,
        "promotionRule": "validation MAE and RMSE must both beat the lowest-MAE baseline, and validation peak F1 must be no more than 0.02 lower",
        "riskThreshold": {"valueKw": threshold, "method": "training-only 90th percentile of future-hour peaks", "operationalUse": False},
        "structuredSignal": {"target": "gridImportKw", "statistic": "maximum over next hour", "horizonMinutes": HORIZON_MINUTES, "fields": ["timestamp_local", "predictedPeakGridImportKw", "riskThresholdKw", "riskState", "datasetClass", "forecastMethod"], "peakQuarterHourTimestampPredicted": False, "operationalUse": False},
        "selectedOnValidation": selected_name,
        "promoted": promoted,
        "status": "MODEL_PROMOTED" if promoted else "BASELINE_RETAINED",
        "testEvaluated": False,
        "validationMetrics": val_metrics,
        "limitations": [
            "The model predicts the maximum import over the next hour and does not estimate which quarter-hour contains that maximum.",
            "All inputs and targets are SIMULATED_COMPOSITE, not co-located measurements or Aurora telemetry.",
            "Calendar features are naive local wall-clock encodings because source timezones are unavailable.",
        ],
    }

    if promoted:
        test = [row for row in examples(by_time, {"test"}) if row["split"] == "test"]
        if not test:
            raise ValueError("Promoted candidate requires a non-empty untouched test block")
        test_predictions = [predict(model, row) for row in test]
        persistence_predictions = [float(row["persistenceKw"]) for row in test]
        result["testEvaluated"] = True
        result["testMetrics"] = {
            CANDIDATE: regression_metrics(test, test_predictions, threshold),
            "PERSISTENCE": regression_metrics(test, persistence_predictions, threshold),
        }
        (output_dir / "lag_calendar_ridge_model.json").write_text(json.dumps({
            "modelVersion": "cg-lag-calendar-ridge-1h-v1",
            "featureNames": FEATURE_NAMES,
            "horizonMinutes": HORIZON_MINUTES,
            "datasetClass": "SIMULATED_COMPOSITE",
            "operationalUse": False,
            **model,
        }, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        with (output_dir / "forecast_second_candidate_test.csv").open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["timestamp_local", "horizonMinutes", "predictedPeakGridImportKw", "actualPeakGridImportKw", "riskThresholdKw", "riskState", "datasetClass", "forecastMethod"], lineterminator="\n")
            writer.writeheader()
            for row, prediction in zip(test, test_predictions):
                writer.writerow({
                    "timestamp_local": row["timestamp"].isoformat(sep=" "),
                    "horizonMinutes": HORIZON_MINUTES,
                    "predictedPeakGridImportKw": f"{prediction:.6f}",
                    "actualPeakGridImportKw": f"{float(row['actualPeakKw']):.6f}",
                    "riskThresholdKw": f"{threshold:.6f}",
                    "riskState": "PREDICTED_PEAK" if prediction >= threshold else "NORMAL",
                    "datasetClass": "SIMULATED_COMPOSITE",
                    "forecastMethod": CANDIDATE,
                })
    else:
        for name in ("lag_calendar_ridge_model.json", "forecast_second_candidate_test.csv"):
            artifact = output_dir / name
            if artifact.exists():
                artifact.unlink()

    result_path = output_dir / "forecast_second_candidate_evaluation.json"
    result_path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return result_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=Path("ml/forecasting/data/forecasting_series.csv"))
    parser.add_argument("--output-dir", type=Path, default=Path("ml/forecasting/data"))
    args = parser.parse_args()
    print(f"Second candidate evaluation: {evaluate(args.dataset, args.output_dir)}")


if __name__ == "__main__":
    main()
