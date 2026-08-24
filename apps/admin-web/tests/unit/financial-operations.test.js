import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { activateTariffPolicy, activeTariffFor, calculateFinancialBreakdown, calculateSessionCharge, refundPayment, settlePayment } from '../../src/domain/financialOperations.js';

const NOW = '2026-08-22T12:00:00-03:00';

function account(state, id = 'acc-est-fiap') {
  return state.accounts.find((item) => item.id === id);
}

describe('financial operations', () => {
  it('calcula energia e ociosidade em centavos inteiros', () => {
    const state = createInitialState();
    const session = { ...state.sessions.find((item) => item.id === 'CG-2026-0998'), energyKwh: 18.7, idleMinutes: 14 };
    const tariff = activeTariffFor(state, 'est-fiap', NOW);
    expect(calculateSessionCharge(session, tariff)).toEqual({ energyCents: 5517, idleCents: 200, totalCents: 5717, billableIdleMinutes: 4 });
  });

  it('publica nova versao e aposenta a politica anterior', () => {
    const state = createInitialState();
    const result = activateTariffPolicy(state, account(state), {
      establishmentId: 'est-fiap', energyPriceCentsPerKwh: 325, idlePriceCentsPerMinute: 70, idleGraceMinutes: 8, platformShareBps: 650, effectiveFrom: '2026-09-01T00:00:00-03:00', changeReason: 'Reajuste contratual anual'
    }, NOW);

    expect(result.tariffPolicy).toMatchObject({ id: 'tariff-est-fiap-v2', version: 2, status: 'ACTIVE', platformShareBps: 650 });
    expect(result.state.tariffPolicies.find((item) => item.id === 'tariff-est-fiap-v1')).toMatchObject({ status: 'RETIRED', effectiveTo: '2026-09-01T00:00:00-03:00' });
    expect(result.state.establishments.find((item) => item.id === 'est-fiap')?.pricePerKwh).toBe(3.25);
  });

  it('impede operador sem responsabilidade financeira de publicar tarifa ou reembolsar', () => {
    const state = createInitialState();
    const operator = account(state, 'acc-operator-fiap');
    const tariff = activateTariffPolicy(state, operator, { establishmentId: 'est-fiap', energyPriceCentsPerKwh: 300, idlePriceCentsPerMinute: 50, idleGraceMinutes: 10, platformShareBps: 600, effectiveFrom: NOW, changeReason: 'Tentativa sem permissao' }, NOW);
    const refund = refundPayment(state, operator, 'pay-CG-2026-0998', 100, 'Ajuste solicitado', 'denied', NOW);
    expect(tariff.issues).toContain('Perfil sem permissao para publicar tarifas.');
    expect(refund.issues).toContain('Perfil sem permissao para reembolsar esta transacao.');
  });

  it('reembolsa parcialmente com idempotencia e bloqueia excesso', () => {
    const state = createInitialState();
    const partial = refundPayment(state, account(state), 'pay-CG-2026-0998', 1000, 'Compensacao comercial aprovada', 'refund-001', NOW);
    const repeated = refundPayment(partial.state, account(partial.state), 'pay-CG-2026-0998', 1000, 'Compensacao comercial aprovada', 'refund-001', NOW);
    const excessive = refundPayment(partial.state, account(partial.state), 'pay-CG-2026-0998', 5000, 'Compensacao comercial aprovada', 'refund-002', NOW);
    expect(partial.transaction).toMatchObject({ status: 'PARTIALLY_REFUNDED', refundedCents: 1000 });
    expect(repeated.state.financialEvents).toHaveLength(partial.state.financialEvents.length);
    expect(excessive.issues).toContain('Valor de reembolso excede o saldo capturado disponivel.');
  });

  it('calcula participacao parametrizada e liquida somente valor disponivel', () => {
    const state = createInitialState();
    const transaction = state.paymentTransactions.find((item) => item.id === 'pay-CG-2026-0998');
    expect(calculateFinancialBreakdown(transaction)).toMatchObject({ totalCents: 5517, providerFeeCents: 180, platformShareCents: 331, establishmentNetCents: 5006 });
    const settled = settlePayment(state, account(state), transaction.id, NOW);
    const pending = settlePayment(state, account(state), 'pay-CG-2026-1001', NOW);
    expect(settled.transaction).toMatchObject({ settlementStatus: 'PAID', settledAt: NOW });
    expect(pending.issues).toContain('Liquidacao ainda nao esta disponivel.');
  });
});
