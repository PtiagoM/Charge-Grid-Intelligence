import { describe, expect, it } from 'vitest';
import { calculateTariff } from '../../src/core/tariff.js';

describe('calculateTariff', () => {
  it('calcula tarifa base e valor de energia', () => {
    const result = calculateTariff({ energyKwh: 2, baseRate: 2 });
    expect(result.ratePerKwh).toBe(2);
    expect(result.energyCost).toBe(4);
    expect(result.totalCost).toBe(4);
  });

  it('aplica multiplicador de horário de pico', () => {
    const result = calculateTariff({ energyKwh: 10, baseRate: 2, isPeak: true });
    expect(result.ratePerKwh).toBe(2.6);
    expect(result.totalCost).toBe(26);
    expect(result.appliedRules).toContain('peak');
  });

  it('aplica multiplicador de estado crítico', () => {
    const result = calculateTariff({ energyKwh: 10, baseRate: 2, isCritical: true });
    expect(result.ratePerKwh).toBe(2.4);
    expect(result.totalCost).toBe(24);
    expect(result.appliedRules).toContain('critical_state');
  });

  it('aplica desconto de alta geração solar', () => {
    const result = calculateTariff({ energyKwh: 10, baseRate: 2, hasHighSolar: true });
    expect(result.ratePerKwh).toBe(1.7);
    expect(result.totalCost).toBe(17);
    expect(result.appliedRules).toContain('high_solar_discount');
  });

  it('cobra ociosidade após tolerância', () => {
    const result = calculateTariff({
      energyKwh: 5,
      baseRate: 2,
      idleMinutesAfterEnd: 22,
      idleToleranceMinutes: 15,
      idleRatePerMinute: 0.5
    });
    expect(result.idleBillableMinutes).toBe(7);
    expect(result.idleCost).toBe(3.5);
    expect(result.totalCost).toBe(13.5);
  });
});
