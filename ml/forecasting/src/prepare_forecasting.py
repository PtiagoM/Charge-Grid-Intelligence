"""Build a longer SIMULATED_COMPOSITE sequence for a one-hour-ahead benchmark."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src.prepare import (  # noqa: E402
    INTERVAL,
    INTERVAL_SECONDS,
    PV_SOURCE_NAMEPLATE_KW,
    REFERENCE_PV_KW,
    grid_import_kw,
    interval_end,
    number,
    parse_local,
    read_rows,
    sha256,
)


START_DAY = date(2019, 4, 1)
END_DAY = date(2019, 12, 16)
PV_SYSTEM_ID = "10"
OUTPUT_FIELDS = [
    "timestamp_local", "temporal_split", "buildingLoadKw", "evChargingKw",
    "pvGenerationKw", "gridImportKw", "datasetClass", "buildingOrigin",
    "evOrigin", "pvOrigin", "targetOrigin",
]


def _interval_average_power(rows: list[dict[str, str]], energy_field: str) -> dict[tuple[int, int, int, int], float]:
    profiles = {}
    for row in rows:
        stamp = parse_local(row["timestamp"])
        energy, models = number(row.get(energy_field)), number(row.get("models_used"))
        if energy is None or models is None or models <= 0:
            continue
        key = (stamp.month, stamp.day, stamp.hour, stamp.minute)
        if key in profiles:
            raise ValueError(f"Duplicate EULP profile interval: {key}")
        profiles[key] = energy / models / (INTERVAL_SECONDS / 3600)
    return profiles


def _add_ev_interval(buckets: dict[datetime, float], start: datetime, end: datetime, energy_kwh: float) -> None:
    duration = (end - start).total_seconds()
    if duration <= 0 or energy_kwh <= 0:
        return
    avg_kw = energy_kwh / (duration / 3600)
    cursor = start
    while cursor < end:
        bin_end = interval_end(cursor)
        overlap = max(0.0, (min(end, bin_end) - max(cursor, bin_end - INTERVAL)).total_seconds())
        buckets[bin_end] += avg_kw * overlap / INTERVAL_SECONDS
        cursor = min(end, bin_end)


def _split_dates(days: list[date]) -> dict[date, str]:
    train_end = int(len(days) * 0.6)
    validation_end = int(len(days) * 0.8)
    return {
        day: "train" if index < train_end else "validation" if index < validation_end else "test"
        for index, day in enumerate(days)
    }


def build(input_dir: Path, pv_dir: Path, output_dir: Path) -> tuple[Path, Path]:
    building_path, ev_path = input_dir / "eulp-small-office.csv", input_dir / "nrel-workplace.csv"
    pv_metadata_path = input_dir / "pvdaq-system10-metadata.json"
    pv_files = sorted(pv_dir.glob("pvdaq-system10-2019-*.csv"))
    if not building_path.is_file() or not ev_path.is_file() or not pv_metadata_path.is_file() or not pv_files:
        raise FileNotFoundError("Need AI-02 EULP/EV/PVDAQ metadata inputs and downloaded PVDAQ system-10 files")
    pv_metadata = json.loads(pv_metadata_path.read_text(encoding="utf-8"))
    pv_system = pv_metadata.get("System", {})
    if str(pv_system.get("system_id")) != PV_SYSTEM_ID or number(pv_system.get("power")) != PV_SOURCE_NAMEPLATE_KW:
        raise ValueError("PVDAQ metadata does not match system 10 / 1.12 kW nameplate used by this benchmark")

    days_by_file: dict[date, Path] = {}
    for path in pv_files:
        match = re.fullmatch(r"pvdaq-system10-(\d{4}-\d{2}-\d{2})\.csv", path.name)
        if not match:
            continue
        day = date.fromisoformat(match.group(1))
        if START_DAY <= day <= END_DAY:
            days_by_file[day] = path
    days = sorted(days_by_file)
    if len(days) < 30:
        raise ValueError(f"Only {len(days)} PVDAQ dates available; need a multi-month chronology")
    split_by_date = _split_dates(days)

    building_rows = read_rows(building_path)
    energy_field = "out.electricity.total.energy_consumption"
    if not building_rows or not {"timestamp", "models_used", energy_field} <= building_rows[0].keys():
        raise ValueError("EULP schema mismatch")
    building = _interval_average_power(building_rows, energy_field)
    selected_days = set(days)

    ev_rows = read_rows(ev_path)
    required_ev = {"start_date_time", "end_date_time", "energy_charged"}
    if not ev_rows or not required_ev <= ev_rows[0].keys():
        raise ValueError("NREL EV schema mismatch")
    ev_buckets: dict[datetime, float] = defaultdict(float)
    ev_missing = {field: 0 for field in required_ev}
    ev_invalid = 0
    ev_used: set[int] = set()
    first_datetime = datetime.combine(days[0], time.min)
    end_datetime = datetime.combine(days[-1] + timedelta(days=1), time.min)
    for index, row in enumerate(ev_rows):
        missing = [field for field in required_ev if row.get(field, "").strip().upper() in {"", "NULL", "NA", "N/A"}]
        if missing:
            for field in missing:
                ev_missing[field] += 1
            continue
        try:
            start, end = parse_local(row["start_date_time"]), parse_local(row["end_date_time"])
            energy = number(row["energy_charged"])
        except (ValueError, OverflowError):
            ev_invalid += 1
            continue
        if energy is None or energy <= 0 or end <= start:
            ev_invalid += 1
            continue
        clip_start, clip_end = max(start, first_datetime), min(end, end_datetime)
        cursor = clip_start
        used = False
        duration = (end - start).total_seconds()
        while cursor < clip_end:
            day = cursor.date()
            next_day = datetime.combine(day + timedelta(days=1), time.min)
            segment_end = min(clip_end, next_day)
            if day in selected_days:
                segment_energy = energy * (segment_end - cursor).total_seconds() / duration
                _add_ev_interval(ev_buckets, cursor, segment_end, segment_energy)
                used = True
            cursor = segment_end
        if used:
            ev_used.add(index)

    pv_buckets: dict[datetime, list[float]] = defaultdict(list)
    pv_quality = {}
    pv_source_manifest = []
    for day, path in days_by_file.items():
        rows = read_rows(path)
        if not rows:
            raise ValueError(f"Empty PVDAQ file: {path.name}")
        metric = next((field for field in rows[0] if field.startswith("ac_power__")), None)
        if metric is None or not {"measured_on", "system_id"} <= rows[0].keys():
            raise ValueError(f"PVDAQ schema mismatch: {path.name}")
        values, timestamps = [], []
        missing = negative = over_nameplate = 0
        for row in rows:
            if row["system_id"] != PV_SYSTEM_ID:
                raise ValueError(f"Unexpected PVDAQ system in {path.name}")
            watts = number(row.get(metric))
            if watts is None:
                missing += 1
                continue
            stamp = parse_local(row["measured_on"])
            if stamp.date() != day:
                raise ValueError(f"Timestamp date mismatch in {path.name}")
            timestamps.append(stamp)
            values.append(watts)
            negative += watts < 0
            over_nameplate += watts > PV_SOURCE_NAMEPLATE_KW * 1000
            pv_buckets[interval_end(stamp)].append(max(0.0, watts) / (PV_SOURCE_NAMEPLATE_KW * 1000) * REFERENCE_PV_KW)
        if len(timestamps) != len(set(timestamps)):
            raise ValueError(f"Duplicate PVDAQ timestamps in {path.name}")
        pv_quality[day.isoformat()] = {
            "rows": len(rows), "columns": len(rows[0]), "metric": metric, "unit": "W",
            "missingMetricRows": missing, "negativeRowsClipped": negative,
            "aboveDcNameplateRows": over_nameplate, "resolutionMedianMinutes": _median_gap(timestamps),
            "observedIntervals15m": len({interval_end(stamp) for stamp in timestamps}),
            "expectedIntervals15m": 96,
        }
        file_name = f"system_10__date_{day.year}_{day.month}_{day.day}.csv"
        pv_source_manifest.append({
            "dataset": "NREL PVDAQ Public Data Lake, NREL CIS-1 system 10",
            "doi": "10.25984/1846021",
            "file": path.name,
            "license": "CC BY 4.0",
            "version": "public data lake snapshot indexed 2025-07-29",
            "url": "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/pvdata/"
            f"system_id=10/year={day.year}/month={day.month}/day={day.day}/{file_name}",
            "sha256": sha256(path), "bytes": path.stat().st_size,
        })

    output_rows = []
    coverage = {}
    for day in days:
        bins = sorted(stamp for stamp in pv_buckets if (stamp - INTERVAL).date() == day)
        coverage[day.isoformat()] = {"observed": len(bins), "expected": 96, "split": split_by_date[day]}
        for stamp in bins:
            key = (stamp.month, stamp.day, stamp.hour, stamp.minute)
            if key not in building:
                raise ValueError(f"Missing EULP profile for {key}")
            load_kw = building[key]
            pv_kw = sum(pv_buckets[stamp]) / len(pv_buckets[stamp])
            ev_kw = ev_buckets.get(stamp, 0.0)
            output_rows.append({
                "timestamp_local": stamp.isoformat(sep=" "), "temporal_split": split_by_date[day],
                "buildingLoadKw": f"{load_kw:.6f}", "evChargingKw": f"{ev_kw:.6f}",
                "pvGenerationKw": f"{pv_kw:.6f}", "gridImportKw": f"{grid_import_kw(load_kw, ev_kw, pv_kw):.6f}",
                "datasetClass": "SIMULATED_COMPOSITE",
                "buildingOrigin": "EULP_MODELED_COMSTOCK_5B_SMALLOFFICE_2018_PROFILE_OVERLAID_ON_2019",
                "evOrigin": "NREL_MEASURED_SESSION_ENERGY_UNIFORMLY_ALLOCATED_2019_LOCAL_TIME",
                "pvOrigin": "PVDAQ_MEASURED_AC_POWER_SCALED_TO_HYPOTHETICAL_75KWP",
                "targetOrigin": "DERIVED_PHYSICAL_BALANCE_NOT_AURORA_TELEMETRY",
            })
    output_rows.sort(key=lambda row: row["timestamp_local"])
    output_dir.mkdir(parents=True, exist_ok=True)
    dataset_path = output_dir / "forecasting_series.csv"
    with dataset_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(output_rows)

    source_manifest = [
        {"file": building_path.name, "dataset": "EULP/ComStock AMY2018 5B SmallOffice", "version": "ComStock AMY2018 Release 1", "url": "https://oedi-data-lake.s3.amazonaws.com/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2021/comstock_amy2018_release_1/timeseries_aggregates/by_ashrae_iecc_climate_zone_2004/5b-smalloffice.csv", "sha256": sha256(building_path), "license": "CC BY 4.0"},
        {"file": ev_path.name, "dataset": "NREL Workplace Charging Data", "version": "October 2021; DOI 10.7799/1838140", "url": "https://data.nlr.gov/system/files/182/dataSet_Oct2021.csv", "sha256": sha256(ev_path), "license": "NLR Data Catalog notice; see NOTICE.md"},
        {"file": pv_metadata_path.name, "dataset": "NREL PVDAQ system metadata; system 10", "doi": "10.25984/1846021", "version": "public data lake snapshot indexed 2025-07-29", "url": "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/system_metadata/10_system_metadata.json", "sha256": sha256(pv_metadata_path), "license": "CC BY 4.0", "systemId": PV_SYSTEM_ID, "dcNameplateKw": PV_SOURCE_NAMEPLATE_KW},
        *pv_source_manifest,
    ]
    manifest = {
        "classification": "SIMULATED_COMPOSITE", "operationalUse": False,
        "period": [days[0].isoformat(), days[-1].isoformat()], "sourceDays": len(days),
        "target": "gridImportKw", "interval": "15 minutes, right-edge local wall-clock labels",
        "alignment": "EULP 2018 month/day profile + NREL EV and PVDAQ 2019 local dates; independent site sources, no UTC/co-location claim",
        "gridImportRule": "max(0, buildingLoadKw + evChargingKw - pvGenerationKw)",
        "hypotheses": {"pvSourceNameplateDcKw": PV_SOURCE_NAMEPLATE_KW, "scenarioPvArrayNameplateKw": REFERENCE_PV_KW},
        "temporalSplit": {day.isoformat(): split for day, split in split_by_date.items()},
        "sourceRows": {"eulp": len(building_rows), "nrelEv": len(ev_rows), "evSessionsUsed": len(ev_used), "pvdaqFiles": len(pv_source_manifest), "compositeRows": len(output_rows)},
        "sources": source_manifest,
    }
    manifest_path = output_dir / "forecasting_series.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    targets = [float(row["gridImportKw"]) for row in output_rows]
    report = {
        "classification": "SIMULATED_COMPOSITE", "operationalUse": False,
        "rows": len(output_rows), "schema": OUTPUT_FIELDS,
        "sourceDays": len(days), "splitDays": {name: sum(v == name for v in split_by_date.values()) for name in ("train", "validation", "test")},
        "coverage": coverage,
        "missingness": {"outputNullCells": 0, "evRowsMissingRequiredFields": ev_missing, "evRowsInvalidOrNonpositive": ev_invalid},
        "eulp": {"rows": len(building_rows), "validIntervals": len(building), "medianResolutionMinutes": 15, "timezone": "unspecified naive wall-clock"},
        "ev": {"rows": len(ev_rows), "sessionsUsed": len(ev_used), "timezone": "naive local source timestamps", "allocation": "uniform average session power over measured start/end"},
        "pvdaq": {"timezone": "measured_on local time", "files": len(pv_source_manifest), "filesByDay": pv_quality},
        "duplicates": {"outputTimestamps": len(output_rows) - len({row["timestamp_local"] for row in output_rows})},
        "gridImportKwRange": [min(targets), max(targets)],
        "limitations": [
            "Composite is not a co-located or contemporaneous site measurement and is never Aurora telemetry.",
            "EULP is modeled, NREL EV power is estimated from session energy, and PVDAQ is scaled to a hypothetical 75 kWp array.",
            "Intervals without observed PVDAQ values are omitted and become time-series gaps; forecast windows crossing gaps are excluded.",
            "Forecast evaluation on this composite cannot establish performance on an operating Aurora plant.",
        ],
        "sourceManifest": manifest_path.name,
    }
    report_path = output_dir / "forecasting_series.quality.json"
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return dataset_path, report_path


def _median_gap(timestamps: list[datetime]) -> float | None:
    ordered = sorted(set(timestamps))
    gaps = sorted((b - a).total_seconds() / 60 for a, b in zip(ordered, ordered[1:]))
    if not gaps:
        return None
    middle = len(gaps) // 2
    return gaps[middle] if len(gaps) % 2 else (gaps[middle - 1] + gaps[middle]) / 2


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, default=Path(".local/ai-02"))
    parser.add_argument("--pv-dir", type=Path, default=Path(".local/ai-03/pvdaq"))
    parser.add_argument("--output-dir", type=Path, default=Path("ml/forecasting/data"))
    args = parser.parse_args()
    dataset, report = build(args.input_dir, args.pv_dir, args.output_dir)
    print(f"Built {dataset}")
    print(f"Quality report: {report}")


if __name__ == "__main__":
    main()
