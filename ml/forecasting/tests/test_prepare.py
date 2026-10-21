import csv
import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.prepare import accumulate_uniform_session, build, grid_import_kw


class PreparationTests(unittest.TestCase):
    def test_physical_grid_import_rule(self):
        self.assertEqual(grid_import_kw(10, 3, 4), 9)
        self.assertEqual(grid_import_kw(10, 0, 20), 0)

    def test_uniform_session_allocation_conserves_energy(self):
        buckets = {}
        start = datetime(2024, 1, 1, 0, 10)
        end = datetime(2024, 1, 1, 0, 40)
        accumulate_uniform_session(buckets, start, end, 1.5)
        self.assertEqual(len(buckets), 3)
        self.assertAlmostEqual(sum(power_kw * 0.25 for power_kw in buckets.values()), 1.5)

    def test_composite_is_reproducible_and_labeled(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            inputs = root / "inputs"
            inputs.mkdir()
            with (inputs / "eulp-small-office.csv").open("w", newline="", encoding="utf-8") as handle:
                writer = csv.writer(handle)
                writer.writerow(["timestamp", "models_used", "out.electricity.total.energy_consumption"])
                for day in ("2018-04-04", "2018-07-08", "2018-10-31", "2018-01-23"):
                    writer.writerow([day + " 00:15:00", "1", "1"])
            with (inputs / "nrel-workplace.csv").open("w", newline="", encoding="utf-8") as handle:
                writer = csv.writer(handle)
                writer.writerow(["start_date_time", "end_date_time", "energy_charged"])
                writer.writerow(["2019-04-04 00:00:00", "2019-04-04 00:15:00", "0.5"])
            (inputs / "pvdaq-system10-metadata.json").write_text(
                '{"System":{"system_id":10,"power":"1.12"},"Site":{"public_name":"[10] NREL CIS -1"}}\n',
                encoding="utf-8",
            )
            days = ("2019-04-04", "2019-07-08", "2019-10-31", "2020-01-23")
            for day in days:
                date = datetime.fromisoformat(day)
                file_name = f"pvdaq-system10-{day}.csv"
                with (inputs / file_name).open("w", newline="", encoding="utf-8") as handle:
                    writer = csv.writer(handle)
                    writer.writerow(["measured_on", "ac_power__423", "system_id"])
                    writer.writerow([date.strftime("%Y-%m-%d 00:00:00"), "0", "10"])

            dataset_a, report_a = build(inputs, root / "out-a")
            dataset_b, _ = build(inputs, root / "out-b")
            self.assertEqual(dataset_a.read_bytes(), dataset_b.read_bytes())
            with dataset_a.open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(len(rows), 4)
            self.assertTrue(all(row["datasetClass"] == "SIMULATED_COMPOSITE" for row in rows))
            self.assertEqual(rows[0]["buildingLoadKw"], "4.000000")
            self.assertEqual(rows[0]["evChargingKw"], "2.000000")
            self.assertEqual(rows[0]["gridImportKw"], "6.000000")
            self.assertEqual({row["temporal_split"] for row in rows}, {"train", "validation", "test"})
            report = json.loads(report_a.read_text(encoding="utf-8"))
            self.assertEqual(report["classification"], "SIMULATED_COMPOSITE")
            self.assertEqual(report["sourceQuality"]["eulp"]["timezone"], "not provided; naive wall-clock timestamps retained")
            self.assertEqual(report["sourceQuality"]["nrelEv"]["missingRequiredValues"], {"end_date_time": 0, "energy_charged": 0, "start_date_time": 0})
            self.assertEqual(report["pvdaqQuality"]["2019-04-04"]["selectedMetricUnit"], "W, per PVDAQ metric metadata")


if __name__ == "__main__":
    unittest.main()
