import { describe, expect, it } from 'vitest';
import { estimateEnergyOrigin } from '../../src/core/sustainability.js';

describe('estimateEnergyOrigin', () => {
  it('classifica como Solar/Bateria estimada quando solar+bateria cobrem a sessão', () => {
    const result = estimateEnergyOrigin({ solarKwh: 5, batteryKwh: 3, gridKwh: 1, sessionEnergyKwh: 7 });
    expect(result.origin).toBe('Solar/Bateria');
    expect(result.label).toContain('estimada');
  });

  it('classifica como Rede estimada quando rede é dominante', () => {
    const result = estimateEnergyOrigin({ solarKwh: 1, batteryKwh: 1, gridKwh: 8, sessionEnergyKwh: 7 });
    expect(result.origin).toBe('Rede');
    expect(result.label).toContain('estimada');
  });

  it('classifica como Híbrida estimada quando há mistura', () => {
    const result = estimateEnergyOrigin({ solarKwh: 3, batteryKwh: 1, gridKwh: 3, sessionEnergyKwh: 7 });
    expect(result.origin).toBe('Híbrida');
    expect(result.label).toContain('estimada');
  });
});
