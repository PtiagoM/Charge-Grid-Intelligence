import { describe, expect, it } from 'vitest';
import { getDemandState } from '../../src/core/demand-state.js';

describe('getDemandState', () => {
  it('retorna Favorável quando margem e SOC são bons', () => {
    const result = getDemandState({ powerMarginPercent: 45, socPercent: 75 });
    expect(result.state).toBe('Favorável');
  });

  it('retorna Alerta quando margem está entre 10% e 30%', () => {
    const result = getDemandState({ powerMarginPercent: 24, socPercent: 80 });
    expect(result.state).toBe('Alerta');
  });

  it('retorna Alerta quando SOC está entre 40% e 60%', () => {
    const result = getDemandState({ powerMarginPercent: 45, socPercent: 55 });
    expect(result.state).toBe('Alerta');
  });

  it('retorna Crítico quando margem é menor que 10%', () => {
    const result = getDemandState({ powerMarginPercent: 8, socPercent: 90 });
    expect(result.state).toBe('Crítico');
  });

  it('retorna Crítico quando SOC é menor que 40%', () => {
    const result = getDemandState({ powerMarginPercent: 40, socPercent: 35 });
    expect(result.state).toBe('Crítico');
  });

  it('prioriza Crítico sobre Alerta', () => {
    const result = getDemandState({ powerMarginPercent: 25, socPercent: 35 });
    expect(result.state).toBe('Crítico');
  });
});
