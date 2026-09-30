import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { expirePlantForecast, forecastFeatures, generatePlantForecast, loadForecastModel, predictDeltaPeak, type QuarterHour } from "./forecast.js";

const goldenUrl = new URL("./forecast.golden.json", import.meta.url);
const quarterHourMs = 15 * 60_000;

async function golden() {
  return JSON.parse(await readFile(goldenUrl, "utf8")) as {
    originAt: string; currentKw: number; historyGridImportKw: number[]; features: number[];
    expectedDeltaKw: number; expectedPredictedGridImportKw: number; benchmarkRiskThresholdKw: number;
  };
}

function minuteHistory(origin: Date) {
  return Array.from({ length: 96 * 15 * 2 }, (_, index) => ({
    observedAt: new Date(origin.getTime() - (96 * 15 * 2 - index - 1) * 30_000).toISOString(),
    gridImportKw: 80 + Math.sin(index / 30), quality: "FRESH" as const, source: "SIMULATED" as const
  }));
}

describe("CG-AI-03C Node inference parity", () => {
  it("matches the Python feature vector and Ridge Delta golden prediction", async () => {
    const vector = await golden();
    const origin = new Date(vector.originAt);
    const series: QuarterHour[] = vector.historyGridImportKw.map((gridImportKw, index) => ({
      at: new Date(origin.getTime() - (vector.historyGridImportKw.length - index - 1) * quarterHourMs), gridImportKw, fresh: true
    }));
    const model = await loadForecastModel();
    expect(model).not.toBeNull();
    const features = forecastFeatures(series);
    features.forEach((value, index) => expect(value).toBeCloseTo(vector.features[index]!, 10));
    const prediction = predictDeltaPeak(model!, vector.currentKw, features);
    expect(prediction.deltaKw).toBeCloseTo(vector.expectedDeltaKw, 10);
    expect(prediction.predictedGridImportKw).toBeCloseTo(vector.expectedPredictedGridImportKw, 10);
  });

  it("returns a fresh structured forecast from 96 complete quarter-hours", async () => {
    const origin = new Date("2025-01-02T12:00:00.000Z");
    const record = await generatePlantForecast("plant_aurora_001", minuteHistory(origin), origin);
    expect(record).toMatchObject({
      contractVersion: "S4-C2", plantId: "plant_aurora_001", horizonMinutes: 60, stepMinutes: 15,
      modelVersion: "cg-ai-03c-ridge_delta-1h-v1", provenance: "SIMULATED", fallback: null,
      quality: { availability: "AVAILABLE", inputQuality: "FRESH", unavailableReason: null }
    });
    expect(record.generatedAt).toBe(origin.toISOString());
    expect(record.expiresAt).toBe(new Date(origin.getTime() + 30 * 60_000).toISOString());
    expect(record.points).toHaveLength(1);
    expect(record.points![0]!.at).toBe(new Date(origin.getTime() + 60 * 60_000).toISOString());
    expect(record.points![0]!.riskThresholdKw).toBe(117.524661);
    expect(record.metrics).toMatchObject({ maeKw: 4.615088231729316, baselineMaeKw: 5.322525316213276 });

    const duplicated = await generatePlantForecast("plant_aurora_001", minuteHistory(origin).flatMap((sample) => [sample, sample]), origin);
    expect(duplicated.points![0]!.predictedGridImportKw).toBeCloseTo(record.points![0]!.predictedGridImportKw, 10);
  });

  it("does not forecast from the still-open current quarter-hour", async () => {
    const now = new Date("2025-01-02T12:14:00.000Z");
    const record = await generatePlantForecast("plant_aurora_001", minuteHistory(now), now);
    expect(record.quality.availability).toBe("UNAVAILABLE");
    expect(record.quality.unavailableReason).toBe("INSUFFICIENT_15M_HISTORY");
  });

  it("uses deterministic persistence fallback when model/history is unavailable and after expiry", async () => {
    const now = new Date("2025-01-02T12:00:00.000Z");
    const sample = { observedAt: now.toISOString(), gridImportKw: 42, quality: "FRESH" as const, source: "SIMULATED" as const };
    const missing = await generatePlantForecast("plant_aurora_001", [sample], now, "missing-cg-ai-03c-model.json");
    expect(missing.quality).toMatchObject({ availability: "UNAVAILABLE", inputQuality: "FRESH", unavailableReason: "MODEL_UNAVAILABLE" });
    expect(missing.points).toBeNull();
    expect(missing.fallback).toMatchObject({ method: "PERSISTENCE", predictedGridImportKw: 42, riskThresholdKw: null, riskState: "UNAVAILABLE" });

    const insufficient = await generatePlantForecast("plant_aurora_001", [sample], now);
    expect(insufficient.quality.unavailableReason).toBe("INSUFFICIENT_15M_HISTORY");
    expect(insufficient.fallback).toMatchObject({ method: "PERSISTENCE", predictedGridImportKw: 42, riskThresholdKw: 117.524661 });

    const available = await generatePlantForecast("plant_aurora_001", minuteHistory(now), now);
    const later = new Date(now.getTime() + 31 * 60_000);
    const expired = expirePlantForecast(available, { ...sample, observedAt: later.toISOString(), gridImportKw: 55 }, later);
    expect(expired.quality).toMatchObject({ availability: "UNAVAILABLE", inputQuality: "STALE", unavailableReason: "FORECAST_EXPIRED" });
    expect(expired.points).toBeNull();
    expect(expired.fallback).toMatchObject({ method: "PERSISTENCE", predictedGridImportKw: 55, riskThresholdKw: 117.524661, riskState: "NORMAL" });
  });
});
