import { describe, expect, it } from 'vitest';
import { buildOperationalMetrics } from '../../src/core/operations.js';

describe('buildOperationalMetrics', () => {
  it('consolida métricas comerciais e pressão operacional', () => {
    const sessions = [
      { commercialValue: 20, status: 'finished', payment: { status: 'Aprovado' }, tariff: { idleCost: 0 } },
      { commercialValue: 10, status: 'blocked', payment: { status: 'Recusado' }, tariff: { idleCost: 3 } }
    ];
    const chargers = [
      { id: 'CG-EV-01', estimatedRevenue: 30, occupancyPercent: 80 },
      { id: 'CG-EV-02', estimatedRevenue: 10, occupancyPercent: 20 }
    ];
    const queue = [{ estimatedWaitMinutes: 35 }, { estimatedWaitMinutes: 70 }];
    const energy = { snapshot: { powerMarginPercent: 24 } };

    const result = buildOperationalMetrics({ sessions, chargers, queue, energy });
    expect(result.revenueToday).toBe(30);
    expect(result.mostProfitableCharger).toBe('CG-EV-01');
    expect(result.blockedLoss).toBe(24);
    expect(result.energyDecision).toContain('limitar');
  });
});
