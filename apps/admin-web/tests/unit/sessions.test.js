import { describe, expect, it } from 'vitest';
import { calculateEstimatedRange, enrichCommercialSession } from '../../src/core/sessions.js';

describe('sessions', () => {
  it('calcula autonomia estimada como energia × 5 km/kWh', () => {
    expect(calculateEstimatedRange(7.11)).toBe(35.55);
    expect(calculateEstimatedRange(14.38)).toBe(71.9);
  });

  it('enriquece sessão técnica com dados comerciais', () => {
    const session = {
      id: 'CG-1001',
      energyKwh: 7.11,
      paymentScenario: 'approved',
      idleMinutesAfterEnd: 0,
      isPeak: true,
      isCritical: false,
      hasHighSolar: false
    };
    const result = enrichCommercialSession(session);
    expect(result.estimatedRangeKm).toBe(35.55);
    expect(result.tariff.ratePerKwh).toBe(2.6);
    expect(result.payment.status).toBe('Aprovado');
    expect(result.commercialValue).toBe(18.49);
  });
});
