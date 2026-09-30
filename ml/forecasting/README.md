# Forecasting data and evaluation — CG-AI-02/03

CG-AI-02 produced a small **`SIMULATED_COMPOSITE`** sample for validating ingestion and target derivation. CG-AI-03 keeps that sample unchanged and builds a separate longer series for temporal forecasting evaluation. Neither dataset is Aurora telemetry or operational input.

## Sources selected

- **Building load — EULP / ComStock AMY2018 Release 1, 5B SmallOffice.** The 2018 profile is calibrated/modelled, not a meter reading from Aurora. The file reports interval energy in kWh aggregated across `models_used`; the pipeline divides by model count and by 0.25 h to produce representative average kW. Licensed CC BY 4.0; cite NREL/LBNL and indicate this transformation.
- **EV sessions — NREL Workplace Charging Data, October 2021.** ACN-Data was preferred, but its API returned HTTP 401 and the repository has no ACN token; registration is required. The selected NREL source is real measured session data, public through the NLR Data Catalog, and permits use/copy under its notice. It provides session energy and start/end fields, not quarter-hour measured power. The pipeline estimates flat power as `energy_charged / session_duration` and allocates it across overlapping intervals. Include [NOTICE.md](NOTICE.md) with copies/derivatives.
- **PV generation — NREL PVDAQ system 10, NREL CIS-1, Golden, Colorado.** The AI-02 sample uses four daily CSVs; AI-03 uses the 253 available daily files in its date window. Files contain local timestamps and the `ac_power__423` channel; PVDAQ's data dictionary requires joining each channel to `pvdaq_metrics` for its units. The selected AC-power channel is interpreted in W, sanity-checked against system metadata (1.12 kW DC nameplate) and observed output; the approximately 1-minute cadence is measured from files, not assumed from the catalog's typical 15-minute cadence. Negative values are clipped to zero. Per-unit output is scaled linearly to a hypothetical 75 kWp array, an explicit scenario assumption. The dataset catalog declares CC BY 4.0. The quality report preserves observed above-nameplate samples instead of silently capping them.

Official source pages: [EULP](https://data.openei.org/submissions/4520), [NREL Workplace Charging Data](https://data.nlr.gov/submissions/182), [PVDAQ](https://data.openei.org/submissions/4568), [PVDAQ data dictionary](https://github.com/openEDI/documentation/blob/main/pvdaq.md), [ACN-Data access](https://ev.caltech.edu/dataset.html). PVDAQ's CC BY 4.0 declaration is also listed by the [U.S. Data.gov catalog](https://catalog.data.gov/dataset/photovoltaic-data-acquisition-pvdaq-public-datasets).

BDG2 was considered for building demand but not included: it offers measured hourly building-meter profiles, while this benchmark needs a 15-minute profile and no upsampling should imply finer measurements. EULP directly supplies modeled 15-minute interval energy and is a better resolution match for this transform test. Its modeled provenance remains explicit.

## Reproduce

Python 3.10+ standard library only; no package installation is needed. Download inputs into the ignored `.local/ai-02/` directory. Each input URL and its SHA-256 are recorded in `data/simulated_composite.manifest.json`.

```powershell
New-Item -ItemType Directory -Force .local/ai-02 | Out-Null
curl.exe -L -o .local/ai-02/eulp-small-office.csv "https://oedi-data-lake.s3.amazonaws.com/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2021/comstock_amy2018_release_1/timeseries_aggregates/by_ashrae_iecc_climate_zone_2004/5b-smalloffice.csv"
curl.exe -L -o .local/ai-02/nrel-workplace.csv "https://data.nlr.gov/system/files/182/dataSet_Oct2021.csv"
curl.exe -L -o .local/ai-02/pvdaq-system10-metadata.json "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/system_metadata/10_system_metadata.json"
curl.exe -L -o .local/ai-02/pvdaq-system10-2019-04-04.csv "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/pvdata/system_id=10/year=2019/month=4/day=4/system_10__date_2019_04_04.csv"
curl.exe -L -o .local/ai-02/pvdaq-system10-2019-07-08.csv "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/pvdata/system_id=10/year=2019/month=7/day=8/system_10__date_2019_07_08.csv"
curl.exe -L -o .local/ai-02/pvdaq-system10-2019-10-31.csv "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/pvdata/system_id=10/year=2019/month=10/day=31/system_10__date_2019_10_31.csv"
curl.exe -L -o .local/ai-02/pvdaq-system10-2020-01-23.csv "https://oedi-data-lake.s3.amazonaws.com/pvdaq/csv/pvdata/system_id=10/year=2020/month=1/day=23/system_10__date_2020_01_23.csv"
```

ACN-Data was not used: the API required registration and returned HTTP 401 without an access token. No credentials or ACN records were added. The workplace dataset includes its full reuse notice in [NOTICE.md](NOTICE.md).

```powershell
py ml/forecasting/src/prepare.py
py -m unittest discover -s ml/forecasting/tests -v
```

For CG-AI-03, generate a separate temporal series from the same EULP/EV/metadata inputs and public PVDAQ system-10 daily records, then evaluate it:

```powershell
py ml/forecasting/src/fetch_pvdaq.py
py ml/forecasting/src/prepare_forecasting.py
py ml/forecasting/src/evaluate_forecast.py
py -m unittest discover -s ml/forecasting/tests -v
```

The PVDAQ downloader refuses truncated listings and writes downloads atomically. The forecasting manifest includes source URLs, versions/DOIs where supplied, license notes, hashes and per-file PVDAQ hashes. Metadata is validated against system 10 and the 1.12 kW source nameplate before scaling.

The committed AI-02 `data/simulated_composite.csv` remains only 4 sparse seasonal dates and is **not statistically adequate** for forecasting evaluation. CG-AI-03 uses the separate `data/forecasting_series.csv`: 253 local dates (2019-04-01 through 2019-12-16), 24,090 observed 15-minute rows. PVDAQ is partial on three dates; missing intervals are omitted, and forecast windows crossing gaps or split boundaries are excluded. Whole source dates are chronologically divided 60/20/20 (151/51/51 dates). The 75 kWp PV array is a scenario scale assumption, not an Aurora specification.

Output columns: `timestamp_local` (naive local right-edge label), `scenario`, `temporal_split`, `buildingLoadKw`, `evChargingKw`, `pvGenerationKw`, `gridImportKw` (all four power values in kW), `datasetClass`, and `buildingOrigin`, `evOrigin`, `pvOrigin`, `targetOrigin` (provenance strings). All rows are `SIMULATED_COMPOSITE`; there are 339 composite rows in the checked-in sample.

### Alignment and target

All three chosen files contain naive timestamps without UTC offsets. They are retained as local wall-clock labels; no UTC conversion or claim of contemporaneous measurement is made. The 2018 EULP month/day and clock profile is overlaid on the NREL/PVDAQ sample dates. This deliberately combines different source samples and therefore remains simulated.

```text
buildingLoadKw = EULP interval kWh / models_used / 0.25 h
evChargingKw = sum of uniform session-power estimates over each 15-minute overlap
pvGenerationKw = max(0, PVDAQ ac_power_W) / (1.12 kW × 1000 W/kW) × 75 kWp
gridImportKw = max(0, buildingLoadKw + evChargingKw - pvGenerationKw)
```

No battery, grid export settlement, distribution loss, curtailment, or tariff logic is represented. Missing PV intervals are omitted, not filled with zero. `quality-report.json` records source hashes, missing values, coverage, sample cadence, ranges, clipping and scaling limitations.

## Provenance and attribution

Every row declares `datasetClass=SIMULATED_COMPOSITE` and the origin of each component/target. The manifest records exact URLs, source version, license, hashes and file sizes. Do not describe any row or metric as real Aurora telemetry. Attribution and NREL data notice are included in this directory.

### CG-AI-03 forecast

The benchmark target is the maximum `gridImportKw` in the **next 60 minutes** (four 15-minute steps), using only values available at each forecast origin. The persistence baseline was selected on chronological validation; the trained AR(1) candidate did not pass the promotion rule. See [evaluation protocol](../../docs/ai/evaluation-protocol.md) and [model card](../../docs/ai/model-card.md) for splits, metrics, risk threshold, structured signal and limits. No model is integrated into runtime.
