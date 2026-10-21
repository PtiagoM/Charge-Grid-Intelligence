import { describe, expect, it } from 'vitest';
import { forecastPanelState, mapPlantForecastResponse } from '../../src/services/energyForecastMapper.js';

const NOW = '2026-10-05T12:00:00.000Z';
const metrics = { maeKw: 1.2, rmseKw: 1.7, baselineMaeKw: 2, baselineRmseKw: 2.5, testFrom: '2026-09-01T00:00:00.000Z', testTo: '2026-09-08T00:00:00.000Z' };

function availableForecast(overrides = {}) {
  return {
    forecast: {
      contractVersion: 'S4-C2', id: 'forecast-1', plantId: 'plant-aurora', generatedAt: NOW,
      expiresAt: '2026-10-05T12:15:00.000Z', inputFrom: '2026-10-04T10:00:00.000Z', inputTo: '2026-10-05T11:00:00.000Z',
      horizonMinutes: 60, stepMinutes: 60, modelVersion: 'cg-ai-03c-ridge-delta-1h-v1', provenance: 'SIMULATED', fallback: null,
      quality: { availability: 'AVAILABLE', inputQuality: 'FRESH', unavailableReason: null }, metrics,
      points: [{ at: '2026-10-05T13:00:00.000Z', predictedGridImportKw: 18.4, riskThresholdKw: 18, riskState: 'PREDICTED_PEAK' }],
      ...overrides
    }, availability: 'AVAILABLE', unavailableReason: null
  };
}

describe('energy forecast presentation mapper', () => {
  it('maps the API scalar peak and historical metrics without creating a time series', () => {
    expect(mapPlantForecastResponse(availableForecast(), NOW)).toMatchObject({
      status: 'AVAILABLE', provenance: 'SIMULATED', horizonMinutes: 60,
      predictedGridImportKw: 18.4, predictedAt: '2026-10-05T13:00:00.000Z',
      riskThresholdKw: 18, riskState: 'PREDICTED_PEAK', testMetrics: metrics
    });
  });

  it('keeps an absent forecast unavailable instead of rendering a numeric zero', () => {
    expect(mapPlantForecastResponse({ forecast: null, availability: 'UNAVAILABLE', unavailableReason: 'FORECAST_NOT_GENERATED' }, NOW)).toMatchObject({
      status: 'UNAVAILABLE', predictedGridImportKw: null, testMetrics: null, unavailableReason: 'FORECAST_NOT_GENERATED'
    });
  });

  it('marks input-stale and expired model outputs as stale', () => {
    const staleQuality = availableForecast({
      quality: { availability: 'UNAVAILABLE', inputQuality: 'STALE', unavailableReason: 'INPUT_WINDOW_STALE' }, metrics: null, points: null
    });
    expect(mapPlantForecastResponse(staleQuality, NOW)).toMatchObject({ status: 'STALE', predictedGridImportKw: null, unavailableReason: 'INPUT_WINDOW_STALE' });
    expect(mapPlantForecastResponse(availableForecast({ expiresAt: '2026-10-05T11:59:59.000Z' }), NOW)).toMatchObject({
      status: 'STALE', predictedGridImportKw: null, unavailableReason: 'FORECAST_EXPIRED'
    });
  });

  it('keeps endpoint errors separate from an unavailable model result', () => {
    expect(mapPlantForecastResponse(undefined, NOW, 'Falha de rede')).toMatchObject({ status: 'ERROR', predictedGridImportKw: null, unavailableReason: 'Falha de rede' });
  });
});

describe('energy forecast panel state', () => {
  const sync = { status: 'SYNCED', error: null };

  it('covers loading, unavailable, api error and stale cached-data states', () => {
    const available = mapPlantForecastResponse(availableForecast(), NOW);
    expect(forecastPanelState(available, { status: 'LOADING', error: null }, NOW)).toEqual({ status: 'LOADING' });
    expect(forecastPanelState(undefined, sync, NOW)).toMatchObject({ status: 'UNAVAILABLE' });
    expect(forecastPanelState(undefined, { status: 'UNAVAILABLE', error: 'API offline' }, NOW)).toEqual({ status: 'ERROR', message: 'API offline' });
    expect(forecastPanelState(mapPlantForecastResponse(undefined, NOW, 'Falha de rede'), sync, NOW)).toEqual({ status: 'ERROR', message: 'Falha de rede' });
    expect(forecastPanelState(available, { status: 'STALE', error: 'Timeout' }, NOW)).toMatchObject({ status: 'STALE', forecast: available, reason: 'Timeout' });
  });

  it('does not expose an expired scalar as a current forecast', () => {
    const expired = mapPlantForecastResponse(availableForecast({ expiresAt: '2026-10-05T11:59:59.000Z' }), NOW);
    expect(forecastPanelState(expired, sync, NOW)).toMatchObject({ status: 'STALE' });
  });
});
