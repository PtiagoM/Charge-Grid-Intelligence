#!/usr/bin/env python3
"""Build the small, non-operational SIMULATED_COMPOSITE benchmark."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path


INTERVAL = timedelta(minutes=15)
INTERVAL_SECONDS = INTERVAL.total_seconds()
REFERENCE_PV_KW = 75.0  # hypothetical commercial array; never Aurora telemetry
PV_SYSTEM_ID = "10"
PV_SOURCE_NAMEPLATE_KW = 1.12
SCENARIOS = {
    "spring": "2019-04-04",
    "summer": "2019-07-08",
    "autumn": "2019-10-31",
    "winter": "2020-01-23",
}
OUTPUT_FIELDS = [
    "timestamp_local",
    "scenario",
    "temporal_split",
    "buildingLoadKw",
    "evChargingKw",
    "pvGenerationKw",
    "gridImportKw",
    "datasetClass",
    "buildingOrigin",
    "evOrigin",
    "pvOrigin",
    "targetOrigin",
]


def parse_local(value: str) -> datetime:
    result = datetime.fromisoformat(value.strip())
    if result.tzinfo is not None:
        raise ValueError(f"Expected a source-local wall timestamp without UTC offset: {value}")
    return result


def interval_end(value: datetime) -> datetime:
    floor_minute = value.minute - value.minute % 15
    return value.replace(minute=floor_minute, second=0, microsecond=0) + INTERVAL


def grid_import_kw(building_kw: float, ev_kw: float, pv_kw: float) -> float:
    return max(0.0, building_kw + ev_kw - pv_kw)


def accumulate_uniform_session(
    buckets: dict[datetime, float], start: datetime, end: datetime, energy_kwh: float
) -> None:
    """Spread measured session energy uniformly over its local time span."""
    duration_seconds = (end - start).total_seconds()
    if duration_seconds <= 0 or energy_kwh <= 0:
        raise ValueError("Session must have positive duration and energy")
    average_power_kw = energy_kwh / (duration_seconds / 3600)
    cursor = start
    while cursor < end:
        end_of_bin = interval_end(cursor)
        start_of_bin = end_of_bin - INTERVAL
        overlap_start = max(cursor, start_of_bin)
        overlap_end = min(end, end_of_bin)
        overlap_seconds = max(0.0, (overlap_end - overlap_start).total_seconds())
        buckets[end_of_bin] = buckets.get(end_of_bin, 0.0) + average_power_kw * overlap_seconds / INTERVAL_SECONDS
        cursor = min(end, end_of_bin)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def number(value: str | None) -> float | None:
    if value is None or value.strip().upper() in {"", "NULL", "NA", "N/A"}:
        return None
    result = float(value)
    return result if math.isfinite(result) else None


def build(input_dir: Path, output_dir: Path) -> tuple[Path, Path]:
    building_path = input_dir / "eulp-small-office.csv"
    ev_path = input_dir / "nrel-workplace.csv"
    pv_metadata_path = input_dir / "pvdaq-system10-metadata.json"
    pv_paths = {
        day: input_dir / f"pvdaq-system10-{day}.csv" for day in SCENARIOS.values()
    }
    inputs = [building_path, ev_path, pv_metadata_path, *pv_paths.values()]
    missing_paths = [str(path) for path in inputs if not path.is_file()]
    if missing_paths:
        raise FileNotFoundError("Missing source sample(s): " + ", ".join(missing_paths))

    building_rows = read_rows(building_path)
    building_energy_key = "out.electricity.total.energy_consumption"
    if not building_rows or not {"timestamp", "models_used", building_energy_key} <= building_rows[0].keys():
        raise ValueError("EULP input does not have the expected timestamp/models/total-electricity schema")
    building: dict[tuple[int, int, int, int], float] = {}
    building_missing = 0
    building_timestamps = []
    for row in building_rows:
        stamp = parse_local(row["timestamp"])
        building_timestamps.append(stamp)
        energy_kwh = number(row[building_energy_key])
        model_count = number(row["models_used"])
        if energy_kwh is None or model_count is None or model_count <= 0:
            building_missing += 1
            continue
        key = (stamp.month, stamp.day, stamp.hour, stamp.minute)
        if key in building:
            raise ValueError(f"Duplicate EULP wall-clock interval: {key}")
        # EULP reports kWh per 15-minute interval aggregated across models.
        building[key] = energy_kwh / model_count / (INTERVAL_SECONDS / 3600)

    ev_rows = read_rows(ev_path)
    required_ev = {"start_date_time", "end_date_time", "energy_charged"}
    if not ev_rows or not required_ev <= ev_rows[0].keys():
        raise ValueError("NREL EV input does not have the expected session schema")
    ev_kw: dict[datetime, float] = defaultdict(float)
    ev_missing = {field: 0 for field in required_ev}
    ev_invalid = 0
    ev_sessions_used: set[str] = set()
    ev_energy_source_kwh = 0.0
    ev_power_estimates = []
    selected_days = {datetime.fromisoformat(day).date() for day in SCENARIOS.values()}
    for index, row in enumerate(ev_rows):
        if any(row.get(field, "").strip().upper() in {"", "NULL", "NA", "N/A"} for field in required_ev):
            for field in required_ev:
                if row.get(field, "").strip().upper() in {"", "NULL", "NA", "N/A"}:
                    ev_missing[field] += 1
            continue
        try:
            start = parse_local(row["start_date_time"])
            end = parse_local(row["end_date_time"])
            energy = number(row["energy_charged"])
            if energy is None or energy <= 0 or end <= start:
                ev_invalid += 1
                continue
        except (ValueError, OverflowError):
            ev_invalid += 1
            continue

        matched = False
        for scenario_day in selected_days:
            day_start = datetime.combine(scenario_day, datetime.min.time())
            day_end = day_start + timedelta(days=1)
            clipped_start, clipped_end = max(start, day_start), min(end, day_end)
            if clipped_end <= clipped_start:
                continue
            matched = True
            duration_seconds = (end - start).total_seconds()
            ev_power_estimates.append(energy / (duration_seconds / 3600))
            clipped_energy = energy * (clipped_end - clipped_start).total_seconds() / duration_seconds
            accumulate_uniform_session(ev_kw, clipped_start, clipped_end, clipped_energy)
            ev_energy_source_kwh += clipped_energy
        if matched:
            ev_sessions_used.add(str(index))

    pv_kw: dict[datetime, list[float]] = defaultdict(list)
    pv_input_quality: dict[str, dict[str, int | float | str]] = {}
    for scenario, day in SCENARIOS.items():
        path = pv_paths[day]
        rows = read_rows(path)
        if not rows:
            raise ValueError(f"Empty PVDAQ sample: {path.name}")
        pv_column = next((name for name in rows[0] if name.startswith("ac_power__")), None)
        if pv_column is None or "measured_on" not in rows[0] or "system_id" not in rows[0]:
            raise ValueError(f"PVDAQ sample lacks measured_on/ac_power/system_id: {path.name}")
        values = []
        timestamps = []
        missing = negative = over_nameplate = 0
        for row in rows:
            if row["system_id"] != PV_SYSTEM_ID:
                raise ValueError(f"Unexpected PVDAQ system id in {path.name}: {row['system_id']}")
            watts = number(row.get(pv_column))
            if watts is None:
                missing += 1
                continue
            stamp = parse_local(row["measured_on"])
            timestamps.append(stamp)
            if stamp.date().isoformat() != day:
                raise ValueError(f"PVDAQ date does not match sample key in {path.name}")
            negative += watts < 0
            over_nameplate += watts > PV_SOURCE_NAMEPLATE_KW * 1000
            # PVDAQ system 10 is a 1.12 kW reference system. Scale its
            # observed AC output linearly to the explicitly hypothetical 75 kW array.
            scaled_kw = max(0.0, watts) / (PV_SOURCE_NAMEPLATE_KW * 1000) * REFERENCE_PV_KW
            pv_kw[interval_end(stamp)].append(scaled_kw)
            values.append(watts)
        pv_input_quality[day] = {
            "file": path.name,
            "rows": len(rows),
            "inputColumnCount": len(rows[0]),
            "selectedMetric": pv_column,
            "selectedMetricUnit": "W, per PVDAQ metric metadata",
            "missingMetricRows": missing,
            "negativeMetricRowsClippedToZero": negative,
            "aboveDcNameplateRows": over_nameplate,
            "timestampDuplicateRows": len(timestamps) - len(set(timestamps)),
            "resolutionMinutesMedian": _median_interval_minutes(timestamps),
            "validMinW": min(values) if values else 0.0,
            "validMaxW": max(values) if values else 0.0,
            "quartersWithSamples": len({stamp for stamp in pv_kw if (stamp - INTERVAL).date().isoformat() == day}),
        }

    split_by_date: dict[str, str] = {}
    ordered_days = list(SCENARIOS.values())
    for index, day in enumerate(ordered_days):
        split_by_date[day] = "train" if index < 2 else ("validation" if index == 2 else "test")

    output_rows = []
    scenario_coverage = {}
    for scenario, day in SCENARIOS.items():
        selected_bins = sorted(stamp for stamp in pv_kw if (stamp - INTERVAL).date().isoformat() == day)
        if not selected_bins:
            raise ValueError(f"PVDAQ sample contains no usable intervals for {day}")
        scenario_coverage[day] = {"scenario": scenario, "observedPvIntervals": len(selected_bins), "expectedIntervals": 96}
        for stamp in selected_bins:
            # Source values are right-edge interval labels, so midnight closes
            # the previous source day and uses the following EULP profile date.
            profile_key = (stamp.month, stamp.day, stamp.hour, stamp.minute)
            if profile_key not in building:
                raise ValueError(f"EULP profile is missing wall-clock interval for {day} {stamp:%H:%M}")
            load_kw = building[profile_key]
            pv_value = sum(pv_kw[stamp]) / len(pv_kw[stamp])
            ev_value = ev_kw.get(stamp, 0.0)
            output_rows.append({
                "timestamp_local": stamp.isoformat(sep=" "),
                "scenario": scenario,
                "temporal_split": split_by_date[day],
                "buildingLoadKw": f"{load_kw:.6f}",
                "evChargingKw": f"{ev_value:.6f}",
                "pvGenerationKw": f"{pv_value:.6f}",
                "gridImportKw": f"{grid_import_kw(load_kw, ev_value, pv_value):.6f}",
                "datasetClass": "SIMULATED_COMPOSITE",
                "buildingOrigin": "EULP_MODELED_COMSTOCK_5B_SMALLOFFICE",
                "evOrigin": "NREL_MEASURED_SESSION_ENERGY_UNIFORMLY_ALLOCATED",
                "pvOrigin": "PVDAQ_MEASURED_AC_POWER_SCALED_TO_HYPOTHETICAL_75KWP",
                "targetOrigin": "DERIVED_PHYSICAL_BALANCE_NOT_AURORA_TELEMETRY",
            })

    output_rows.sort(key=lambda row: (row["timestamp_local"], row["scenario"]))
    output_dir.mkdir(parents=True, exist_ok=True)
    dataset_path = output_dir / "simulated_composite.csv"
    with dataset_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(output_rows)

    source_urls = {
        building_path.name: {
            "url": "https://oedi-data-lake.s3.amazonaws.com/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2021/comstock_amy2018_release_1/timeseries_aggregates/by_ashrae_iecc_climate_zone_2004/5b-smalloffice.csv",
            "version": "ComStock AMY2018 Release 1; climate zone 5B; SmallOffice; modeled year 2018",
            "license": "CC BY 4.0; NREL/OEDI attribution required",
        },
        ev_path.name: {
            "url": "https://data.nlr.gov/system/files/182/dataSet_Oct2021.csv",
            "version": "NREL Workplace Charging Data, Data Set Oct 2021, DOI 10.7799/1838140",
            "license": "NLR Data Catalog license; use/copy permitted with full notice and DOE/NREL/ALLIANCE attribution",
        },
    }
    pv_source = {
        "dataset": "NREL PVDAQ Public Data Lake, DOI 10.25984/1846021",
        "systemId": PV_SYSTEM_ID,
        "version": "PVDAQ CSV snapshot indexed 2025-07-29",
        "license": "CC BY 4.0; attribution and changes required",
    }
    source_manifest = []
    pv_metadata = json.loads(pv_metadata_path.read_text(encoding="utf-8"))
    pv_system = pv_metadata.get("System", {})
    if str(pv_system.get("system_id")) != PV_SYSTEM_ID or float(pv_system.get("power", 0)) != PV_SOURCE_NAMEPLATE_KW:
        raise ValueError("PVDAQ system metadata does not match the selected system/nameplate")
    for path in sorted(inputs, key=lambda item: item.name):
        metadata = source_urls.get(path.name)
        if path == pv_metadata_path:
            metadata = {
                **pv_source,
                "url": "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/system_metadata/10_system_metadata.json",
                "version": "PVDAQ system 10 metadata snapshot indexed 2025-07-29",
                "site": pv_metadata.get("Site", {}).get("public_name"),
                "systemName": pv_system.get("public_name"),
                "nameplateDcKw": PV_SOURCE_NAMEPLATE_KW,
            }
        if metadata is None:
            _, year, month, day = path.stem.rsplit("-", 3)
            file_name = f"system_10__date_{year}_{month}_{day}.csv"
            metadata = {
                **pv_source,
                "url": (
                    "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/pvdata/"
                    f"system_id=10/year={year}/month={int(month)}/day={int(day)}/{file_name}"
                ),
            }
        source_manifest.append({"file": path.name, **metadata, "sha256": sha256(path), "bytes": path.stat().st_size})
    manifest = {
        "classification": "SIMULATED_COMPOSITE",
        "operationalUse": False,
        "sampleOnly": True,
        "target": "gridImportKw",
        "interval": "15 minutes, right-edge local wall-clock labels",
        "sources": source_manifest,
        "sourceRowsUsed": {
            "eulpProfileIntervalsAvailable": len(building),
            "eulpProfileIntervalsUsed": len(output_rows),
            "nrelSessionsOverlappingSelectedDates": len(ev_sessions_used),
            "pvdaqRowsByDate": {day: item["rows"] for day, item in pv_input_quality.items()},
            "compositeRows": len(output_rows),
        },
        "alignment": "2018 EULP month/day and wall-clock profile is overlaid on NREL/PVDAQ local wall-clock sample dates; source timestamps are naive and are not converted to UTC.",
        "gridImportRule": "max(0, buildingLoadKw + evChargingKw - pvGenerationKw); no battery, export settlement, losses or curtailment model.",
        "hypotheses": {"pvdaqSystemId": PV_SYSTEM_ID, "pvSourceNameplateKw": PV_SOURCE_NAMEPLATE_KW, "hypotheticalCompositePvNameplateKw": REFERENCE_PV_KW},
        "temporalSplit": {day: split for day, split in split_by_date.items()},
    }
    manifest_path = output_dir / "simulated_composite.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    report = {
        "classification": "SIMULATED_COMPOSITE",
        "operationalUse": False,
        "rows": len(output_rows),
        "schema": {field: "string" if field in {"timestamp_local", "scenario", "temporal_split", "datasetClass", "buildingOrigin", "evOrigin", "pvOrigin", "targetOrigin"} else "kW" for field in OUTPUT_FIELDS},
        "missingness": {"compositeNullCells": 0, "evRowsMissingRequiredFields": ev_missing, "evRowsInvalidOrNonpositive": ev_invalid},
        "sourceQuality": {
            "eulp": {
                "requiredColumns": ["timestamp", "models_used", building_energy_key],
                "inputColumnCount": len(building_rows[0]),
                "rows": len(building_rows),
                "profileIntervalsUsable": len(building),
                "missingOrInvalidEnergyOrModelCountRows": building_missing,
                "timestampRange": [min(building_timestamps).isoformat(sep=" "), max(building_timestamps).isoformat(sep=" ")],
                "resolutionMinutesMedian": _median_interval_minutes(building_timestamps),
                "timezone": "not provided; naive wall-clock timestamps retained",
            },
            "nrelEv": {
                "requiredColumns": sorted(required_ev),
                "inputColumnCount": len(ev_rows[0]),
                "rows": len(ev_rows),
                "missingRequiredValues": ev_missing,
                "invalidOrNonpositiveRows": ev_invalid,
                "sessionsWithRequiredValuesOverSelectedDays": len(ev_sessions_used),
                "estimatedAveragePowerKwMax": round(max(ev_power_estimates, default=0.0), 6),
                "estimatedSessionsAbove22Kw": sum(power > 22 for power in ev_power_estimates),
                "timezone": "naive local timestamps; source is NREL workplace charging in Golden, Colorado; no UTC conversion",
            },
            "pvdaq": {
                "requiredColumns": ["measured_on", "system_id", "ac_power__423"],
                "timezone": "measured_on is naive local time; source system 10 is in Golden, Colorado; no UTC conversion",
            },
        },
        "duplicates": {"compositeTimestamps": len(output_rows) - len({row["timestamp_local"] for row in output_rows})},
        "coverage": scenario_coverage,
        "pvdaqQuality": pv_input_quality,
        "evSessionsOverlappingSelectedDays": len(ev_sessions_used),
        "evSessionEnergyOverlappingSelectedDaysKwh": round(ev_energy_source_kwh, 6),
        "evPowerEstimate": "energy_charged is distributed uniformly between session start and end; this is an estimate, not measured quarter-hour power.",
        "buildingLoadKwRange": [round(min(building.values()), 6), round(max(building.values()), 6)],
        "targetRangeKw": [min(float(row["gridImportKw"]) for row in output_rows), max(float(row["gridImportKw"]) for row in output_rows)],
        "datasetSha256": sha256(dataset_path),
        "sourceFiles": source_manifest,
        "limitations": [
            "Independent sources are overlaid by local calendar wall time, not contemporaneous UTC timestamps or a shared physical site.",
            "EULP is modeled stock data; NREL session energy is spread uniformly across each session; PVDAQ output is scaled to a hypothetical 75 kWp array.",
            "Only intervals with observed PVDAQ samples are included; absent PV rows are not treated as zero.",
            "Four sparse seasonal days are a transform/quality benchmark only and are insufficient evidence for predictive performance or Aurora operation.",
        ],
    }
    report_path = output_dir / "quality-report.json"
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return dataset_path, report_path


def _median_interval_minutes(timestamps: list[datetime]) -> float | None:
    ordered = sorted(set(timestamps))
    gaps = [(right - left).total_seconds() / 60 for left, right in zip(ordered, ordered[1:])]
    if not gaps:
        return None
    gaps.sort()
    middle = len(gaps) // 2
    return gaps[middle] if len(gaps) % 2 else (gaps[middle - 1] + gaps[middle]) / 2


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, default=Path(".local/ai-02"))
    parser.add_argument("--output-dir", type=Path, default=Path("ml/forecasting/data"))
    args = parser.parse_args()
    dataset, report = build(args.input_dir, args.output_dir)
    print(f"Built {dataset} ({sha256(dataset)})")
    print(f"Quality report: {report}")


if __name__ == "__main__":
    main()
