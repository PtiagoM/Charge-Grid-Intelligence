import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { assessEnergySnapshot, calculateRenewableAttribution, energyPolicyFor, recommendEnergyAction } from '../../src/domain/energyDemand.js';
import { requestChargerCommand } from '../../src/domain/chargerOperations.js';

const NOW = '2026-08-22T12:10:00-03:00';

function snapshot(demandKw, overrides = {}) {
  return {
    establishmentId: 'est-test', demandState: 'Favorável', observedAt: '2026-08-22T12:05:00-03:00', providerStatus: 'ONLINE', demandKw, contractedLimitKw: 100, powerMarginPercent: 100 - demandKw, batterySocPercent: 70, solarPowerKw: 10, gridPowerKw: 20, ...overrides
  };
}

const policy = { establishmentId: 'est-test', alertUtilizationPercent: 80, criticalUtilizationPercent: 90, freshnessMinutes: 15, blockStartOnCritical: true, blockStartWithoutFreshTelemetry: true };

describe('energy demand', () => {
  it('deriva normal, alerta e critico pelos limiares configurados', () => {
    expect(assessEnergySnapshot(snapshot(70), policy, NOW).state).toBe('NORMAL');
    expect(assessEnergySnapshot(snapshot(85), policy, NOW).state).toBe('ALERT');
    expect(assessEnergySnapshot(snapshot(92), policy, NOW)).toMatchObject({ state: 'CRITICAL', canStartCharge: false, marginKw: 8 });
  });

  it('falha fechado com telemetria antiga ou provider offline', () => {
    const stale = assessEnergySnapshot(snapshot(70, { observedAt: '2026-08-22T11:00:00-03:00' }), policy, NOW);
    const offline = assessEnergySnapshot(snapshot(70, { providerStatus: 'OFFLINE' }), policy, NOW);
    expect(stale).toMatchObject({ state: 'STALE', isFresh: false, canStartCharge: false });
    expect(offline).toMatchObject({ state: 'UNAVAILABLE', canStartCharge: false });
  });

  it('atribui origem renovavel apenas com energia acumulada por fonte', () => {
    expect(calculateRenewableAttribution(snapshot(70)).calculable).toBe(false);
    expect(calculateRenewableAttribution(snapshot(70, { periodSolarKwh: 30, periodBatteryKwh: 10, periodGridKwh: 60 }))).toMatchObject({ calculable: true, renewableKwh: 40, gridKwh: 60, renewableSharePercent: 40 });
  });

  it('explica a sessao candidata sem autoexecutar parada', () => {
    const initial = createInitialState();
    const state = {
      ...initial,
      energy: initial.energy.map((item) => item.establishmentId === 'est-fiap' ? { ...item, demandKw: 94, observedAt: NOW } : item)
    };
    const recommendation = recommendEnergyAction(state, 'est-fiap', NOW);
    expect(recommendation).toMatchObject({ action: 'REVIEW_STOP', candidateSession: { id: 'CG-2026-1001' } });
    expect(state.chargerCommands).toHaveLength(0);
  });

  it('bloqueia START_CHARGE critico no mesmo dominio que envia o comando', () => {
    const initial = createInitialState();
    const state = {
      ...initial,
      energy: initial.energy.map((item) => item.establishmentId === 'est-fiap' ? { ...item, demandKw: 94, observedAt: NOW } : item)
    };
    const account = state.accounts.find((item) => item.id === 'acc-est-fiap');
    const result = requestChargerCommand(state, account, { chargerId: 'CG-FIAP-03', type: 'START_CHARGE', reason: 'Motorista confirmou conexao', idempotencyKey: 'blocked-energy' }, NOW);
    expect(result.ok).toBe(false);
    expect(result.issues.some((item) => item.startsWith('Inicio bloqueado pela politica de energia'))).toBe(true);
    expect(result.state.chargerCommands).toHaveLength(0);
  });

  it('usa politica default quando o estabelecimento ainda nao foi configurado', () => {
    const state = createInitialState();
    expect(energyPolicyFor(state, 'est-new')).toMatchObject({ establishmentId: 'est-new', alertUtilizationPercent: 80, criticalUtilizationPercent: 90 });
  });
});
