import { describe, expect, it } from 'vitest';
import { generateCommercialReport } from '../../src/core/reports.js';

describe('generateCommercialReport', () => {
  it('calcula totais comerciais', () => {
    const sessions = [
      { id: 'CG-1', energyKwh: 10, commercialValue: 20, status: 'finished', payment: { status: 'Aprovado' }, origin: { origin: 'Híbrida' }, idleBillableMinutes: 0, tariff: { ratePerKwh: 2 } },
      { id: 'CG-2', energyKwh: 5, commercialValue: 13, status: 'active', payment: { status: 'Pendente' }, origin: { origin: 'Rede' }, idleBillableMinutes: 4, tariff: { ratePerKwh: 2.6 } }
    ];
    const report = generateCommercialReport(sessions, []);
    expect(report.totalSessions).toBe(2);
    expect(report.activeSessions).toBe(1);
    expect(report.totalEnergyKwh).toBe(15);
    expect(report.estimatedRevenue).toBe(33);
    expect(report.averageTariff).toBe(2.2);
    expect(report.totalIdleMinutes).toBe(4);
    expect(report.pendingPayments).toBe(1);
  });
});
