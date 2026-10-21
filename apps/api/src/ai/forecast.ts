import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { ForecastRecord, PlantEnergySnapshot } from "@chargegrid/shared";

const MODEL_URL = new URL("../../../../ml/forecasting/data/forecast_cg_ai_03c_model.json", import.meta.url);
const MODEL_PATH = fileURLToPath(MODEL_URL);
export const FORECAST_MODEL_VERSION = "cg-ai-03c-ridge_delta-1h-v1";
const MODEL_VERSION = FORECAST_MODEL_VERSION;
const SHA256 = "22279934cab7f4ca9cd245123d782e1ad7c73982e857c80773a0fc5f3354faca";
const STEP_MS = 15 * 60_000;
const MAX_AGE_MS = 2 * STEP_MS;
const HORIZON_MINUTES = 60;
const STEP_MINUTES = 15;
const HISTORY_STEPS = 96;
const FEATURE_NAMES = [
  "gridImportKw_lag_0", "gridImportKw_lag_15m", "gridImportKw_lag_60m", "previous_day_next_hour_peak_kw",
  "hour_sin", "hour_cos", "weekday_sin", "weekday_cos", "year_day_sin", "year_day_cos",
  "gridImportKw_lag_30m", "gridImportKw_lag_2h", "gridImportKw_lag_4h", "gridImportKw_mean_trailing_1h",
  "gridImportKw_min_trailing_1h", "gridImportKw_max_trailing_1h", "gridImportKw_change_trailing_1h"
] as const;

export type ForecastModel = {
  modelVersion: string;
  featureNames: string[];
  horizonMinutes: number;
  benchmarkRiskThresholdKw: number;
  testMetrics: NonNullable<ForecastRecord["metrics"]>;
  model: { coefficients: number[]; featureMeans: number[]; featureScales: number[]; interceptKw: number; ridgeAlpha: number };
};

type InputSample = Pick<PlantEnergySnapshot, "observedAt" | "gridImportKw" | "quality" | "source">;
export type QuarterHour = { at: Date; gridImportKw: number; fresh: boolean };
let modelPromise: Promise<ForecastModel | null> | undefined;

function finiteArray(values: unknown, length: number): values is number[] {
  return Array.isArray(values) && values.length === length && values.every((value) => typeof value === "number" && Number.isFinite(value));
}

function validateModel(value: unknown, bytes: Buffer): ForecastModel | null {
  // Git checkouts may convert LF to CRLF; pin the artifact with canonical LF bytes.
  const canonical = bytes.toString("utf8").replace(/\r\n/g, "\n");
  if (createHash("sha256").update(canonical).digest("hex") !== SHA256 || !value || typeof value !== "object") return null;
  const artifact = value as Record<string, unknown>;
  if (!artifact.model || typeof artifact.model !== "object" || !artifact.testMetrics || typeof artifact.testMetrics !== "object") return null;
  const model = artifact.model as Record<string, unknown>;
  const metrics = artifact.testMetrics as Record<string, unknown>;
  const coefficients = model.coefficients;
  const featureMeans = model.featureMeans;
  const featureScales = model.featureScales;
  const metricValues = [metrics.maeKw, metrics.rmseKw, metrics.baselineMaeKw, metrics.baselineRmseKw];
  if (artifact.modelVersion !== MODEL_VERSION || artifact.datasetClass !== "SIMULATED_COMPOSITE" || artifact.operationalUse !== false
    || artifact.candidate !== "RIDGE_DELTA" || artifact.targetTransform !== "DELTA_FROM_ORIGIN"
    || artifact.horizonMinutes !== HORIZON_MINUTES || !Array.isArray(artifact.featureNames)
    || artifact.featureNames.some((name) => typeof name !== "string") || artifact.featureNames.join("\0") !== FEATURE_NAMES.join("\0")
    || typeof artifact.benchmarkRiskThresholdKw !== "number" || !Number.isFinite(artifact.benchmarkRiskThresholdKw)
    || model.ridgeAlpha !== 1 || !finiteArray(coefficients, FEATURE_NAMES.length) || !finiteArray(featureMeans, FEATURE_NAMES.length)
    || !finiteArray(featureScales, FEATURE_NAMES.length) || featureScales.some((scale) => scale <= 0)
    || typeof model.interceptKw !== "number" || !Number.isFinite(model.interceptKw)
    || !metricValues.every((metric) => typeof metric === "number" && Number.isFinite(metric))
    || typeof metrics.testFrom !== "string" || typeof metrics.testTo !== "string") return null;
  return artifact as unknown as ForecastModel;
}

export async function loadForecastModel(path = MODEL_PATH): Promise<ForecastModel | null> {
  try {
    const bytes = await readFile(path);
    return validateModel(JSON.parse(bytes.toString("utf8")), bytes);
  } catch {
    return null;
  }
}

function loadRuntimeModel() {
  modelPromise ??= loadForecastModel();
  return modelPromise;
}

function resample(samples: InputSample[], now: Date): QuarterHour[] {
  const buckets = new Map<number, InputSample[]>();
  for (const sample of samples) {
    const time = Date.parse(sample.observedAt);
    if (!Number.isFinite(time) || time > now.getTime() || !Number.isFinite(sample.gridImportKw) || sample.gridImportKw < 0) continue;
    const end = Math.ceil(time / STEP_MS) * STEP_MS;
    const bucket = buckets.get(end) ?? [];
    bucket.push(sample);
    buckets.set(end, bucket);
  }
  return [...buckets.entries()].flatMap(([end, bucket]) => {
    if (end > Math.floor(now.getTime() / STEP_MS) * STEP_MS) return [];
    bucket.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
    const firstAt = Date.parse(bucket[0]!.observedAt);
    const lastAt = Date.parse(bucket.at(-1)!.observedAt);
    if (bucket.length < 15 || firstAt <= end - STEP_MS || firstAt > end - STEP_MS + 60_000 || end - lastAt > 60_000
      || bucket.some((sample, index) => index > 0 && Date.parse(sample.observedAt) - Date.parse(bucket[index - 1]!.observedAt) > 60_000)) return [];
    return [{ at: new Date(end), gridImportKw: bucket.reduce((sum, sample) => sum + sample.gridImportKw, 0) / bucket.length, fresh: bucket.every((sample) => sample.quality === "FRESH") }];
  }).sort((a, b) => a.at.getTime() - b.at.getTime());
}

function latestInputQuality(samples: InputSample[], now: Date): "FRESH" | "STALE" | "UNAVAILABLE" {
  const latest = samples.filter((sample) => Number.isFinite(Date.parse(sample.observedAt)) && Date.parse(sample.observedAt) <= now.getTime())
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt)).at(-1);
  if (!latest) return "UNAVAILABLE";
  return latest.quality === "FRESH" && now.getTime() - Date.parse(latest.observedAt) <= MAX_AGE_MS ? "FRESH" : "STALE";
}

function calendarFeatures(at: Date): number[] {
  const hour = (at.getUTCHours() * 60 + at.getUTCMinutes()) / 1440;
  const weekday = (at.getUTCDay() + 6) % 7;
  const yearDays = new Date(Date.UTC(at.getUTCFullYear(), 1, 29)).getUTCDate() === 29 ? 366 : 365;
  const yearDay = (Math.floor((Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()) - Date.UTC(at.getUTCFullYear(), 0, 1)) / 86_400_000)) / yearDays;
  const weekdayFraction = (weekday + hour) / 7;
  return [
    Math.sin(2 * Math.PI * hour), Math.cos(2 * Math.PI * hour),
    Math.sin(2 * Math.PI * weekdayFraction), Math.cos(2 * Math.PI * weekdayFraction),
    Math.sin(2 * Math.PI * yearDay), Math.cos(2 * Math.PI * yearDay)
  ];
}

export function forecastFeatures(series: QuarterHour[]): number[] {
  if (series.length < HISTORY_STEPS) throw new Error("Insufficient 15-minute history");
  const values = series.slice(-HISTORY_STEPS).map((sample) => sample.gridImportKw);
  const current = values.at(-1)!;
  const lag = (steps: number) => values[values.length - 1 - steps]!;
  const trailingHour = [lag(0), lag(1), lag(2), lag(3)];
  const previousDayHour = [lag(95), lag(94), lag(93), lag(92)];
  return [
    current, lag(1), lag(4), Math.max(...previousDayHour), ...calendarFeatures(series.at(-1)!.at),
    lag(2), lag(8), lag(16), trailingHour.reduce((sum, value) => sum + value, 0) / 4,
    Math.min(...trailingHour), Math.max(...trailingHour), current - lag(3)
  ];
}

export function predictDeltaPeak(model: ForecastModel, currentKw: number, features: number[]) {
  if (features.length !== FEATURE_NAMES.length || features.some((value) => !Number.isFinite(value)) || !Number.isFinite(currentKw)) {
    throw new Error("Invalid forecast feature vector");
  }
  const deltaKw = model.model.interceptKw + model.model.coefficients.reduce((sum, coefficient, index) =>
    sum + coefficient * (features[index]! - model.model.featureMeans[index]!) / model.model.featureScales[index]!, 0);
  return { deltaKw, predictedGridImportKw: Math.max(0, currentKw + deltaKw) };
}

function unavailable(
  plantId: string,
  samples: InputSample[],
  now: Date,
  reason: string,
  inputQuality: "FRESH" | "STALE" | "UNAVAILABLE",
  model: ForecastModel | null
): ForecastRecord {
  const valid = samples.filter((sample) => Number.isFinite(Date.parse(sample.observedAt)) && Date.parse(sample.observedAt) <= now.getTime() && Number.isFinite(sample.gridImportKw)).sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  const latest = valid.at(-1);
  const current = latest && latest.gridImportKw >= 0 ? latest.gridImportKw : null;
  const threshold = model?.benchmarkRiskThresholdKw ?? null;
  const fallback = current === null ? null : {
    method: "PERSISTENCE" as const,
    at: new Date(Date.parse(latest!.observedAt) + HORIZON_MINUTES * 60_000).toISOString(),
    predictedGridImportKw: current,
    riskThresholdKw: threshold,
    riskState: threshold === null ? "UNAVAILABLE" as const : current >= threshold ? "PREDICTED_PEAK" as const : "NORMAL" as const
  };
  const latestAt = latest ? new Date(latest.observedAt).toISOString() : now.toISOString();
  const provenance = valid.length && valid.every((sample) => sample.source === "SIMULATED") ? "SIMULATED" : "DERIVED";
  return {
    contractVersion: "S4-C2", id: `${plantId}:${now.toISOString()}`, plantId,
    generatedAt: now.toISOString(), expiresAt: new Date((latest ? Date.parse(latestAt) : now.getTime()) + MAX_AGE_MS).toISOString(),
    inputFrom: valid[0] ? new Date(valid[0].observedAt).toISOString() : now.toISOString(), inputTo: latestAt,
    horizonMinutes: HORIZON_MINUTES, stepMinutes: STEP_MINUTES, modelVersion: model?.modelVersion ?? "PERSISTENCE_FALLBACK",
    provenance, fallback, quality: { availability: "UNAVAILABLE", inputQuality, unavailableReason: reason }, metrics: null, points: null
  };
}

export async function generatePlantForecast(
  plantId: string,
  samples: InputSample[],
  now = new Date(),
  modelPath?: string
): Promise<ForecastRecord> {
  const model = modelPath ? await loadForecastModel(modelPath) : await loadRuntimeModel();
  if (!model) return unavailable(plantId, samples, now, "MODEL_UNAVAILABLE", latestInputQuality(samples, now), null);
  const series = resample(samples, now);
  if (series.length < HISTORY_STEPS) return unavailable(plantId, samples, now, "INSUFFICIENT_15M_HISTORY", latestInputQuality(samples, now), model);
  const history = series.slice(-HISTORY_STEPS);
  if (history.some((sample, index) => index > 0 && sample.at.getTime() - history[index - 1]!.at.getTime() !== STEP_MS)) {
    return unavailable(plantId, samples, now, "GAPPED_15M_HISTORY", latestInputQuality(samples, now), model);
  }
  const inputTo = history.at(-1)!.at;
  if (now.getTime() - inputTo.getTime() > MAX_AGE_MS) return unavailable(plantId, samples, now, "STALE_INPUT", "STALE", model);
  if (history.some((sample) => !sample.fresh)) return unavailable(plantId, samples, now, "STALE_TELEMETRY", "STALE", model);

  const features = forecastFeatures(history);
  const { predictedGridImportKw } = predictDeltaPeak(model, history.at(-1)!.gridImportKw, features);
  const riskThresholdKw = model.benchmarkRiskThresholdKw;
  const generatedAt = now.toISOString();
  const expiresAt = new Date(inputTo.getTime() + MAX_AGE_MS).toISOString();
  const provenance = samples.every((sample) => sample.source === "SIMULATED") ? "SIMULATED" : "DERIVED";
  return {
    contractVersion: "S4-C2", id: `${plantId}:${generatedAt}`, plantId, generatedAt, expiresAt,
    inputFrom: history[0]!.at.toISOString(), inputTo: inputTo.toISOString(), horizonMinutes: HORIZON_MINUTES, stepMinutes: STEP_MINUTES,
    modelVersion: model.modelVersion, provenance, fallback: null,
    quality: { availability: "AVAILABLE", inputQuality: "FRESH", unavailableReason: null },
    metrics: model.testMetrics,
    points: [{ at: new Date(inputTo.getTime() + HORIZON_MINUTES * 60_000).toISOString(), predictedGridImportKw,
      riskThresholdKw, riskState: predictedGridImportKw >= riskThresholdKw ? "PREDICTED_PEAK" : "NORMAL" }]
  };
}

export function expirePlantForecast(record: ForecastRecord, current: InputSample | null, now = new Date()): ForecastRecord {
  if (record.quality.availability === "UNAVAILABLE" || Date.parse(record.expiresAt) > now.getTime()) return record;
  const expired = unavailable(record.plantId, current ? [current] : [], now, "FORECAST_EXPIRED", "STALE", null);
  const threshold = record.points?.[0]?.riskThresholdKw ?? null;
  return {
    ...expired,
    modelVersion: record.modelVersion,
    fallback: expired.fallback && threshold !== null ? {
      ...expired.fallback,
      riskThresholdKw: threshold,
      riskState: expired.fallback.predictedGridImportKw >= threshold ? "PREDICTED_PEAK" : "NORMAL"
    } : expired.fallback
  };
}
