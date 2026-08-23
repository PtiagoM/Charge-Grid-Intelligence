import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { completeReport, failReport, generateReportArtifact, markReportProcessing, requestReport, saveReportSubscription } from '../../src/domain/reportOperations.js';

const NOW = '2026-08-22T12:00:00-03:00';

function account(state, id) {
  return state.accounts.find((item) => item.id === id);
}

describe('report operations', () => {
  it('bloqueia escopo externo e operador sem capacidade', () => {
    const state = createInitialState();
    const outside = requestReport(state, account(state, 'acc-reports-fiap'), { type: 'SESSIONS', establishmentIds: ['est-mercadox'], periodFrom: '2026-08-01', periodTo: '2026-08-22' }, NOW);
    const operator = requestReport(state, account(state, 'acc-operator-fiap'), { type: 'SESSIONS', establishmentIds: ['est-fiap'], periodFrom: '2026-08-01', periodTo: '2026-08-22' }, NOW);
    expect(outside.issues).toContain('O relatorio solicita dados fora do escopo autorizado.');
    expect(operator.issues).toContain('Perfil sem permissao para gerar relatorios.');
  });

  it('gera CSV apenas do escopo e periodo autorizados em estados assincronos', () => {
    const state = createInitialState();
    state.sessions.push({ ...state.sessions[0], id: '=SUM(1,1)', startedAt: '2026-08-19T10:00:00-03:00' });
    const requested = requestReport(state, account(state, 'acc-reports-fiap'), { type: 'SESSIONS', establishmentIds: ['est-fiap'], periodFrom: '2026-08-18', periodTo: '2026-08-22' }, NOW);
    const processing = markReportProcessing(requested.state, requested.job.id);
    const artifact = generateReportArtifact(processing.state, processing.job);
    const completed = completeReport(processing.state, processing.job.id, artifact, NOW);

    expect(requested.job.status).toBe('QUEUED');
    expect(processing.job.status).toBe('PROCESSING');
    expect(completed.job).toMatchObject({ status: 'READY', rowCount: artifact.rowCount });
    expect(artifact.csvContent).toContain("'=SUM(1,1)");
    expect(artifact.csvContent).toContain('CG-FIAP-01');
    expect(artifact.csvContent).not.toContain('CG-MX-01');
    expect(artifact.fileName).toBe('chargegrid-sessions-2026-08-18-2026-08-22.csv');
  });

  it('exporta financeiro em centavos e sem dado pessoal do motorista', () => {
    const state = createInitialState();
    const requested = requestReport(state, account(state, 'acc-est-fiap'), { type: 'FINANCIAL', establishmentIds: ['est-fiap'], periodFrom: '2026-08-01', periodTo: '2026-08-22' }, NOW);
    const artifact = generateReportArtifact(state, requested.job);
    expect(artifact.csvContent).toContain('capturado_centavos');
    expect(artifact.csvContent).toContain('5517');
    expect(artifact.csvContent).not.toContain('Ana Souza');
  });

  it('preserva falha como estado terminal da tarefa', () => {
    const state = createInitialState();
    const requested = requestReport(state, account(state, 'acc-goodwe'), { type: 'INCIDENTS', establishmentIds: ['est-mercadox'], periodFrom: '2026-08-01', periodTo: '2026-08-22' }, NOW);
    const failed = failReport(requested.state, requested.job.id, 'Armazenamento indisponivel.', NOW);
    expect(failed.job).toMatchObject({ status: 'FAILED', failureReason: 'Armazenamento indisponivel.' });
    expect(requested.state.reportJobs.find((item) => item.id === requested.job.id)?.status).toBe('QUEUED');
  });

  it('permite assinatura apenas ao administrador autorizado', () => {
    const state = createInitialState();
    const operator = saveReportSubscription(state, account(state, 'acc-operator-fiap'), { type: 'SESSIONS', establishmentIds: ['est-fiap'], cadence: 'WEEKLY', status: 'ACTIVE' }, NOW);
    const admin = saveReportSubscription(state, account(state, 'acc-est-fiap'), { type: 'SESSIONS', establishmentIds: ['est-fiap'], cadence: 'WEEKLY', status: 'ACTIVE' }, NOW);
    expect(operator.issues).toContain('Perfil sem permissao para assinar relatorios.');
    expect(admin.subscription).toMatchObject({ status: 'ACTIVE', cadence: 'WEEKLY', establishmentIds: ['est-fiap'] });
  });
});
