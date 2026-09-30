import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.evaluate_forecast import examples, fit_ar1, forecast_ar1_peak, regression_metrics, select_forecast
from src.evaluate_lag_calendar import feature_values, fit_ridge, predict


class ForecastTests(unittest.TestCase):
    def test_ar1_fits_only_next_step_and_recursively_forecasts_horizon(self):
        model = fit_ar1([
            {"currentKw": 1.0, "nextKw": 2.0},
            {"currentKw": 2.0, "nextKw": 4.0},
            {"currentKw": 3.0, "nextKw": 6.0},
        ])
        self.assertAlmostEqual(model["intercept"], 0.0)
        self.assertAlmostEqual(model["currentGridImportCoefficient"], 2.0)
        self.assertEqual(forecast_ar1_peak(model, 1.0), (16.0, 4))

    def test_example_target_is_future_hour_peak_and_cross_split_window_is_purged(self):
        by_time = {}
        start = datetime(2019, 4, 1)
        for step in range(24 * 4 + 5):
            stamp = start + timedelta(minutes=15 * step)
            split = "train" if stamp.date() == start.date() else "validation"
            by_time[stamp] = {"timestamp_local": stamp.isoformat(sep=" "), "temporal_split": split, "gridImportKw": str(step), "datasetClass": "SIMULATED_COMPOSITE"}
        result = examples(by_time)
        crossing = next((row for row in result if row["timestamp"] == datetime(2019, 4, 1, 23, 0)), None)
        self.assertIsNone(crossing)
        future = next(row for row in result if row["timestamp"] == datetime(2019, 4, 2, 0, 0))
        self.assertEqual(future["currentKw"], 96.0)
        self.assertEqual(future["actualPeakKw"], 100.0)
        self.assertTrue(all(row["split"] != "test" for row in examples(by_time, {"train", "validation"})))

    def test_metrics_use_supplied_peak_threshold(self):
        metrics = regression_metrics([{"actualPeakKw": 20.0}, {"actualPeakKw": 5.0}], [21.0, 19.0], 18.0)
        self.assertAlmostEqual(metrics["maeKw"], 7.5)
        self.assertEqual(metrics["peakDetection"]["truePositives"], 1)
        self.assertEqual(metrics["peakDetection"]["falsePositives"], 1)

    def test_model_selection_uses_validation_gains_and_risk_guard(self):
        def metrics(mae, rmse, f1):
            return {"maeKw": mae, "rmseKw": rmse, "peakDetection": {"f1": f1}}

        validation = {
            "LINEAR_LAGS_CALENDAR": metrics(4.0, 8.0, 0.80),
            "PERSISTENCE": metrics(5.0, 9.0, 0.81),
            "SEASONAL_NAIVE_24H": metrics(9.0, 12.0, 0.50),
        }
        self.assertEqual(select_forecast(validation, "LINEAR_LAGS_CALENDAR"), ("LINEAR_LAGS_CALENDAR", True))
        validation["LINEAR_LAGS_CALENDAR"] = metrics(4.0, 8.0, 0.78)
        self.assertEqual(select_forecast(validation, "LINEAR_LAGS_CALENDAR"), ("PERSISTENCE", False))
        validation["LINEAR_LAGS_CALENDAR"] = metrics(5.0, 9.0, 0.81)
        self.assertEqual(select_forecast(validation, "LINEAR_LAGS_CALENDAR"), ("PERSISTENCE", False))

    def test_lag_calendar_ridge_is_deterministic_and_does_not_use_target_as_feature(self):
        rows = []
        start = datetime(2019, 4, 1)
        for index in range(160):
            row = {
                "timestamp": start + timedelta(minutes=15 * index),
                "currentKw": float((index * 17) % 83),
                "lag15mKw": float((index * 29) % 97),
                "lag60mKw": float((index * 31) % 101),
                "seasonalNaiveKw": float((index * 13) % 89),
                "actualPeakKw": 40.0 + (index % 7),
            }
            features = feature_values(row)
            row["actualPeakKw"] = 12.0 + sum((i + 1) * value for i, value in enumerate(features)) / 100
            rows.append(row)
        model = fit_ridge(rows)
        self.assertEqual(len(model["coefficients"]), 10)
        self.assertAlmostEqual(predict(model, rows[50]), rows[50]["actualPeakKw"], delta=0.1)
        before = feature_values(rows[50])
        rows[50]["actualPeakKw"] += 10000
        self.assertEqual(before, feature_values(rows[50]))


if __name__ == "__main__":
    unittest.main()
