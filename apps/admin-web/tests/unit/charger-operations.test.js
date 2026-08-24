import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { acceptChargerCommand, requestChargerCommand, resolveChargerCommand, updateChargerCommercialStatus } from '../../src/domain/chargerOperations.js';

const NOW = '2026-08-22T12:00:00-03:00';

function account(state, id = 'acc-est-fiap') {
  return state.accounts.find((item) => item.id === id);
}

describe('charger operations', () => {
  it('confirma inicio somente depois de telemetria compativel', () => {
    const initial = createInitialState();
    const requested = requestChargerCommand(initial, account(initial), {
      chargerId: 'CG-FIAP-03', type: 'START_CHARGE', reason: 'Motorista confirmou conexao', idempotencyKey: 'start-fiap-03'
    }, NOW);
    expect(requested.command?.status).toBe('REQUESTED');
    expect(requested.state.sessions.find((item) => item.id === 'CG-2026-1002')?.status).toBe('starting');

    const accepted = acceptChargerCommand(requested.state, requested.command.id, 'provider-001', NOW);
    expect(accepted.command?.status).toBe('ACCEPTED');
    expect(accepted.state.chargers.find((item) => item.id === 'CG-FIAP-03')?.status).toBe('available');

    const incompatible = resolveChargerCommand(accepted.state, requested.command.id, {
      status: 'CONFIRMED',
      telemetry: { chargerId: 'CG-FIAP-03', connectorState: 'AVAILABLE', currentPowerKw: 0, vehicleConnected: true, observedAt: NOW }
    }, NOW);
    expect(incompatible.ok).toBe(false);
    expect(incompatible.state.chargers.find((item) => item.id === 'CG-FIAP-03')?.status).toBe('available');

    const confirmed = resolveChargerCommand(accepted.state, requested.command.id, {
      status: 'CONFIRMED',
      telemetry: { chargerId: 'CG-FIAP-03', connectorState: 'CHARGING', currentPowerKw: 18.6, vehicleConnected: true, observedAt: NOW }
    }, NOW);
    expect(confirmed.command?.status).toBe('CONFIRMED');
    expect(confirmed.state.chargers.find((item) => item.id === 'CG-FIAP-03')?.status).toBe('charging');
    expect(confirmed.state.sessions.find((item) => item.id === 'CG-2026-1002')?.status).toBe('active');
    expect(confirmed.state.sessionEvents.some((item) => item.sessionId === 'CG-2026-1002' && item.type === 'ENERGY_CONFIRMED')).toBe(true);
  });

  it('encerra sessao ativa e preserva autoria e motivo', () => {
    const initial = createInitialState();
    const requested = requestChargerCommand(initial, account(initial), {
      chargerId: 'CG-FIAP-01', type: 'STOP_CHARGE', reason: 'Solicitacao presencial do motorista', idempotencyKey: 'stop-fiap-01'
    }, NOW);
    const accepted = acceptChargerCommand(requested.state, requested.command.id, 'provider-002', NOW);
    const confirmed = resolveChargerCommand(accepted.state, requested.command.id, {
      status: 'CONFIRMED',
      telemetry: { chargerId: 'CG-FIAP-01', connectorState: 'AVAILABLE', currentPowerKw: 0, vehicleConnected: false, observedAt: NOW }
    }, NOW);

    expect(confirmed.command).toMatchObject({ status: 'CONFIRMED', requestedBy: 'Gestora FIAP', reason: 'Solicitacao presencial do motorista' });
    expect(confirmed.state.sessions.find((item) => item.id === 'CG-2026-1001')).toMatchObject({ status: 'finished', finalAmount: 39.53 });
  });

  it('reutiliza chave idempotente e bloqueia escopo, motivo curto e sessao ausente', () => {
    const initial = createInitialState();
    const input = { chargerId: 'CG-FIAP-03', type: 'START_CHARGE', reason: 'Motorista confirmou conexao', idempotencyKey: 'same-key' };
    const first = requestChargerCommand(initial, account(initial), input, NOW);
    const repeated = requestChargerCommand(first.state, account(first.state), input, NOW);
    expect(repeated.command?.id).toBe(first.command?.id);
    expect(repeated.state.chargerCommands).toHaveLength(1);

    const outsideScope = requestChargerCommand(initial, account(initial), { ...input, chargerId: 'CG-US-01', idempotencyKey: 'outside' }, NOW);
    expect(outsideScope.issues).toContain('Carregador fora do escopo do estabelecimento.');
    const shortReason = requestChargerCommand(initial, account(initial), { ...input, reason: 'teste', idempotencyKey: 'short' }, NOW);
    expect(shortReason.issues).toContain('Informe um motivo com pelo menos 8 caracteres.');
  });

  it('registra falha de partida sem declarar energia ativa', () => {
    const initial = createInitialState();
    const requested = requestChargerCommand(initial, account(initial), {
      chargerId: 'CG-FIAP-05', type: 'START_CHARGE', reason: 'Motorista solicitou inicio assistido', idempotencyKey: 'start-fail'
    }, NOW);
    const accepted = acceptChargerCommand(requested.state, requested.command.id, 'provider-003', NOW);
    const failed = resolveChargerCommand(accepted.state, requested.command.id, {
      status: 'FAILED', failureCode: 'START_FAILED', failureReason: 'Handshake nao confirmado.'
    }, NOW);

    expect(failed.ok).toBe(false);
    expect(failed.state.chargers.find((item) => item.id === 'CG-FIAP-05')?.status).toBe('available');
    expect(failed.state.sessions.find((item) => item.id === 'CG-2026-1003')?.status).toBe('start_failed');
  });

  it('rejeita telemetria antiga e libera nova tentativa quando o comando expira', () => {
    const initial = createInitialState();
    const requested = requestChargerCommand(initial, account(initial), {
      chargerId: 'CG-FIAP-03', type: 'START_CHARGE', reason: 'Motorista confirmou conexao', idempotencyKey: 'stale-or-timeout'
    }, '2026-08-22T12:00:00-03:00');
    const accepted = acceptChargerCommand(requested.state, requested.command.id, 'provider-004', '2026-08-22T12:01:00-03:00');
    const stale = resolveChargerCommand(accepted.state, requested.command.id, {
      status: 'CONFIRMED',
      telemetry: { chargerId: 'CG-FIAP-03', connectorState: 'CHARGING', currentPowerKw: 18.6, vehicleConnected: true, observedAt: '2026-08-22T12:00:30-03:00' }
    }, '2026-08-22T12:02:00-03:00');
    expect(stale.issues).toContain('Telemetria anterior ao aceite do comando.');

    const expired = resolveChargerCommand(accepted.state, requested.command.id, {
      status: 'EXPIRED', failureCode: 'TELEMETRY_TIMEOUT', failureReason: 'Nenhuma telemetria compativel no prazo operacional.'
    }, '2026-08-22T12:06:00-03:00');
    expect(expired.command?.status).toBe('EXPIRED');
    expect(expired.state.sessions.find((item) => item.id === 'CG-2026-1002')?.status).toBe('authorized');
    expect(expired.state.sessionEvents.some((item) => item.type === 'COMMAND_EXPIRED')).toBe(true);
  });

  it('publica cada carregador individualmente e apenas pelo administrador do estabelecimento', () => {
    const initial = createInitialState();
    const eligibleState = {
      ...initial,
      chargers: initial.chargers.map((item) => item.id === 'CG-FIAP-03' ? { ...item, commercialStatus: 'ELIGIBLE' } : item)
    };
    const denied = updateChargerCommercialStatus(eligibleState, account(eligibleState, 'acc-goodwe-consultant'), 'CG-FIAP-03', 'CONFIGURED', NOW);
    const configured = updateChargerCommercialStatus(eligibleState, account(eligibleState), 'CG-FIAP-03', 'CONFIGURED', NOW);
    const published = updateChargerCommercialStatus(configured.state, account(configured.state), 'CG-FIAP-03', 'PUBLISHED', NOW);
    const invalid = updateChargerCommercialStatus(published.state, account(published.state), 'CG-FIAP-03', 'CONFIGURED', NOW);

    expect(denied.issues).toContain('Somente o administrador comercial do estabelecimento pode alterar a publicacao.');
    expect(configured.charger?.commercialStatus).toBe('CONFIGURED');
    expect(published.charger?.commercialStatus).toBe('PUBLISHED');
    expect(invalid.issues).toContain('Transicao comercial invalida para o estado atual.');
  });

  it('bloqueia comandos ChargeGrid enquanto o carregador não estiver publicado', () => {
    const initial = createInitialState();
    const eligibleState = {
      ...initial,
      chargers: initial.chargers.map((item) => item.id === 'CG-FIAP-03' ? { ...item, commercialStatus: 'ELIGIBLE' } : item)
    };
    const result = requestChargerCommand(eligibleState, account(eligibleState), {
      chargerId: 'CG-FIAP-03', type: 'START_CHARGE', reason: 'Motorista confirmou conexao', idempotencyKey: 'eligible-not-published'
    }, NOW);

    expect(result.issues).toContain('Carregador ainda nao esta publicado na operacao ChargeGrid.');
  });
});
