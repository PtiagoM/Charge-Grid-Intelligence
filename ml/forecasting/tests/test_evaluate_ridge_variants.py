import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.evaluate_ridge_variants import fit_boosted_stumps, predict_boosted_stumps, temporal_features


class RidgeVariantTests(unittest.TestCase):
    def test_feature_builder_ignores_values_after_forecast_origin(self):
        now = datetime(2019, 8, 1, 12)
        by_time = {}
        for offset in range(-100, 5):
            stamp = now + timedelta(minutes=15 * offset)
            by_time[stamp] = {
                "gridImportKw": str(50 + offset),
                "buildingLoadKw": "40",
                "evChargingKw": "7",
                "pvGenerationKw": "3",
            }
        row = {"timestamp": now, "currentKw": 50.0, "lag15mKw": 49.0, "lag60mKw": 46.0, "seasonalNaiveKw": 55.0}
        before = temporal_features(row, by_time)
        by_time[now + timedelta(minutes=15)]["gridImportKw"] = "999999"
        self.assertEqual(before, temporal_features(row, by_time))

    def test_fixed_gradient_boosting_stumps_is_deterministic(self):
        x_rows = [[float(value)] for value in range(8)]
        targets = [0.0, 0.0, 0.0, 0.0, 10.0, 10.0, 10.0, 10.0]
        first = fit_boosted_stumps(x_rows, targets)
        second = fit_boosted_stumps(x_rows, targets)
        self.assertEqual(first, second)
        self.assertGreater(predict_boosted_stumps(first, [7.0]), predict_boosted_stumps(first, [0.0]))


if __name__ == "__main__":
    unittest.main()
