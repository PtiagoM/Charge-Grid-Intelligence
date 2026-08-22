import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { acknowledgeIncident, correlateOperationalSignals, decideRecommendation, ingestIncidentSignal, resolveIncident } from '../../src/domain/incidentOperations.js';

const NOW = '2026-08-22T12:00:00-03:00';

function account(state, id = 'acc-goodwe') {
  return state.accounts.find((item) => item.id === id);
}

function signal(sourceEventId = 'goodwe-fault-001') {
  return {
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    chargerId: 'CG-FIAP-01',
    source: 'GOODWE',
    sourceEventId,
    correlationKey: 'charger-CG-FIAP-01-fault',
    category: 'CHARGER_FAULT',
    severity: 'CRITICAL',
    title: 'Falha no conector',
    summary: 'GoodWe reportou falha critica no conector.'
  };
}

describe('incident and recommendation operations', () => {
  it('ingere o mesmo sinal uma unica vez', () => {
    const first = ingestIncidentSignal(createInitialState(), signal(), NOW);
    const repeated = ingestIncidentSignal(first.state, signal(), '2026-08-22T12:01:00-03:00');

    expect(repeated.state.incidents).toHaveLength(first.state.incidents.length);
    expect(repeated.state.incidentEvents).toHaveLength(first.state.incidentEvents.length);
    expect(repeated.incident?.occurrences).toBe(1);
  });

  it('correlaciona sinais diferentes em um incidente ativo sem perder idempotencia', () => {
    const first = ingestIncidentSignal(createInitialState(), signal('goodwe-fault-001'), NOW);
    const correlated = ingestIncidentSignal(first.state, signal('goodwe-fault-002'), '2026-08-22T12:01:00-03:00');
    const replay = ingestIncidentSignal(correlated.state, signal('goodwe-fault-002'), '2026-08-22T12:02:00-03:00');

    expect(correlated.incident?.occurrences).toBe(2);
    expect(correlated.state.incidentEvents.at(-1)).toMatchObject({ type: 'CORRELATED', sourceEventId: 'goodwe-fault-002' });
    expect(replay.incident?.occurrences).toBe(2);
    expect(replay.state.incidentEvents).toHaveLength(correlated.state.incidentEvents.length);
  });

  it('transforma falha de comando em incidente e recomendacao sem duplicar o comando', () => {
    const state = createInitialState();
    state.chargerCommands.push({
      id: 'command-failed-001', idempotencyKey: 'failed-001', correlationId: 'corr-failed-001', chargerId: 'CG-FIAP-01', sessionId: 'CG-2026-1001', type: 'START', status: 'FAILED', reason: 'Liberacao remota assistida', requestedBy: 'Painel Executivo GoodWe', requestedByProfile: 'GOODWE', requestedAt: NOW, completedAt: NOW, failureCode: 'START_FAILED', failureReason: 'Veiculo nao confirmou energia.'
    });

    const result = correlateOperationalSignals(state, NOW);
    expect(result.incidents).toContainEqual(expect.objectContaining({ sourceEventId: 'command-failed-001', category: 'SESSION_START' }));
    expect(result.recommendations).toContainEqual(expect.objectContaining({ incidentId: 'incident-chargegrid-command-failed-001', status: 'OPEN' }));
    expect(result.chargerCommands).toHaveLength(1);
  });

  it('aplica escopo na atribuicao e exige resolucao descritiva', () => {
    const state = createInitialState();
    const incidentId = 'incident-goodwe-CG-MX-01-offline';
    const denied = acknowledgeIncident(state, account(state, 'acc-est-fiap'), incidentId, 'Equipe FIAP', NOW);
    const assigned = acknowledgeIncident(state, account(state), incidentId, 'NOC GoodWe', NOW);
    const short = resolveIncident(assigned.state, account(assigned.state), incidentId, 'feito', NOW);
    const resolved = resolveIncident(assigned.state, account(assigned.state), incidentId, 'Comunicacao do equipamento restabelecida.', NOW);

    expect(denied.issues).toContain('Perfil sem permissao para gerenciar este incidente.');
    expect(assigned.incident).toMatchObject({ status: 'IN_PROGRESS', assignee: 'NOC GoodWe' });
    expect(short.issues).toContain('Descreva a resolucao com pelo menos 8 caracteres.');
    expect(resolved.incident).toMatchObject({ status: 'RESOLVED', resolution: 'Comunicacao do equipamento restabelecida.' });
    expect(resolved.state.audit.at(-1)?.summary).toContain('resolvido por');
  });

  it('registra decisao humana sem executar a acao proposta', () => {
    const state = createInitialState();
    const commandCount = state.chargerCommands.length;
    const chargerSnapshot = structuredClone(state.chargers);
    const accepted = decideRecommendation(state, account(state), 'rec-energy-est-fiap', 'ACCEPTED', '', NOW);
    const repeated = decideRecommendation(accepted.state, account(accepted.state), 'rec-energy-est-fiap', 'REJECTED', 'Mudanca de decisao indevida', NOW);

    expect(accepted.recommendation).toMatchObject({ status: 'ACCEPTED', decisionReason: 'Acao aceita para revisao humana.' });
    expect(accepted.state.chargerCommands).toHaveLength(commandCount);
    expect(accepted.state.chargers).toEqual(chargerSnapshot);
    expect(repeated.issues).toContain('Recomendacao ja possui uma decisao registrada.');
  });

  it('exige justificativa para adiar ou rejeitar', () => {
    const state = createInitialState();
    const deferred = decideRecommendation(state, account(state), 'rec-energy-est-fiap', 'DEFERRED', 'curto', NOW);
    const rejected = decideRecommendation(state, account(state), 'rec-energy-est-fiap', 'REJECTED', 'Evidencia insuficiente para agir.', NOW);

    expect(deferred.issues).toContain('Informe o motivo da decisao com pelo menos 8 caracteres.');
    expect(rejected.recommendation).toMatchObject({ status: 'REJECTED', decisionReason: 'Evidencia insuficiente para agir.' });
  });
});
