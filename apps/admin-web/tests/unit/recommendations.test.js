import { describe, expect, it } from 'vitest';
import { generateRecommendations } from '../../src/core/recommendations.js';

describe('generateRecommendations', () => {
  it('gera recomendação de estado crítico', () => {
    const recs = generateRecommendations({ demandState: 'Crítico', queueLength: 0, peakHour: false, highSolar: false, idleSessionsCount: 0, pendingPayments: 0 });
    expect(recs.some((rec) => rec.type === 'demand_control')).toBe(true);
  });

  it('gera recomendação de fila crescente', () => {
    const recs = generateRecommendations({ demandState: 'Favorável', queueLength: 3, peakHour: false, highSolar: false, idleSessionsCount: 0, pendingPayments: 0 });
    expect(recs.some((rec) => rec.type === 'queue')).toBe(true);
  });

  it('gera recomendação de desconto sustentável em alta geração solar', () => {
    const recs = generateRecommendations({ demandState: 'Favorável', queueLength: 0, peakHour: false, highSolar: true, idleSessionsCount: 0, pendingPayments: 0 });
    expect(recs.some((rec) => rec.type === 'sustainability')).toBe(true);
  });
});
