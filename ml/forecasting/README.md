# Forecasting dataset preparation — CG-AI-02

This unit produces a small, reproducible **`SIMULATED_COMPOSITE`** benchmark for validating data ingestion and physical target derivation. It is not Aurora telemetry, is not operational input, and has not been used to train a model.

## Sources selected

- **Building load — EULP / ComStock AMY2018 Release 1, 5B SmallOffice.** The 2018 profile is calibrated/modelled, not a meter reading from Aurora. The file reports interval energy in kWh aggregated across `models_used`; the pipeline divides by model count and by 0.25 h to produce representative average kW. Licensed CC BY 4.0; cite NREL/LBNL and indicate this transformation.
- **EV sessions — NREL Workplace Charging Data, October 2021.** ACN-Data was preferred, but its API returned HTTP 401 and the repository has no ACN token; registration is required. The selected NREL source is real measured session data, public through the NLR Data Catalog, and permits use/copy under its notice. It provides session energy and start/end fields, not quarter-hour measured power. The pipeline estimates flat power as `energy_charged / session_duration` and allocates it across overlapping intervals. Include [NOTICE.md](NOTICE.md) with copies/derivatives.
- **PV generation — NREL PVDAQ system 10, NREL CIS-1, Golden, Colorado.** The four selected daily CSVs contain local timestamps and the `ac_power__423` channel; PVDAQ's data dictionary requires joining each channel to `pvdaq_metrics` for its units. The selected AC-power channel is interpreted in W, sanity-checked against the system metadata (1.12 kW DC nameplate) and the observed output; the 1-minute cadence is measured from these files, not assumed from the catalog's typical 15-minute cadence. Negative values are clipped to zero. Per-unit output is scaled linearly to a hypothetical 75 kWp array, an explicit scenario assumption. The dataset catalog declares CC BY 4.0. The quality report preserves the observed above-nameplate sample instead of silently capping it.

Official source pages: [EULP](https://data.openei.org/submissions/4520), [NREL Workplace Charging Data](https://data.nlr.gov/submissions/182), [PVDAQ](https://data.openei.org/submissions/4568), [PVDAQ data dictionary](https://github.com/openEDI/documentation/blob/main/pvdaq.md), [ACN-Data access](https://ev.caltech.edu/dataset.html). PVDAQ's CC BY 4.0 declaration is also listed by the [U.S. Data.gov catalog](https://catalog.data.gov/dataset/photovoltaic-data-acquisition-pvdaq-public-datasets).

BDG2 was considered for building demand but not included: it offers measured hourly building-meter profiles, while this benchmark needs a 15-minute profile and no upsampling should imply finer measurements. EULP directly supplies modeled 15-minute interval energy and is a better resolution match for this transform test. Its modeled provenance remains explicit.

## Reproduce

Python 3.10+ standard library only; no package installation or model training is needed. Download inputs into the ignored `.local/ai-02/` directory. Each input URL and its SHA-256 are recorded in `data/simulated_composite.manifest.json`.

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

The committed `data/simulated_composite.csv` is only 4 sparse seasonal sample days (spring, summer, autumn, winter). Rows have a 15-minute, right-edge local timestamp; only bins with at least one valid PVDAQ reading are emitted. Three dates have full 96-bin coverage and the winter date has 51/96 bins because its source file is partial. `temporal_split` groups whole dates in chronological train/validation/test order solely to prevent row-level mixing; the tiny sample is **not statistically adequate** for training or evaluation. The 75 kWp PV array is a scenario scale assumption, not an Aurora specification.

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
