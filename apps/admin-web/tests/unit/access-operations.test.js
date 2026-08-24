import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { activeGrantFor, grantAccess, revokeAccess } from '../../src/domain/accessOperations.js';
import { hasAdminCapability } from '../../src/domain/adminCapabilities.js';

const NOW = '2026-08-22T12:00:00-03:00';

function account(state, id) {
  return state.accounts.find((item) => item.id === id);
}

describe('access operations', () => {
  it('concede papel e escopo e aposenta a concessao anterior', () => {
    const state = createInitialState();
    const result = grantAccess(state, account(state, 'acc-goodwe'), { accountId: 'acc-operator-fiap', role: 'REPORT_VIEWER', establishmentIds: ['est-fiap'] }, NOW);

    expect(result.grant).toMatchObject({ role: 'REPORT_VIEWER', establishmentIds: ['est-fiap'], status: 'ACTIVE' });
    expect(result.state.accessGrants.find((item) => item.id === 'grant-acc-operator-fiap-initial')).toMatchObject({ status: 'REVOKED', revocationReason: 'Substituido por uma nova concessao.' });
    const updated = account(result.state, 'acc-operator-fiap');
    expect(updated.role).toBe('REPORT_VIEWER');
    expect(hasAdminCapability(updated, 'reports:generate')).toBe(true);
    expect(hasAdminCapability(updated, 'chargers:command')).toBe(false);
  });

  it('mantem idempotencia para papel e escopo iguais', () => {
    const state = createInitialState();
    const before = state.accessGrants.length;
    const result = grantAccess(state, account(state, 'acc-goodwe'), { accountId: 'acc-operator-fiap', role: 'ESTABLISHMENT_OPERATOR', establishmentIds: ['est-fiap'] }, NOW);
    expect(result.state.accessGrants).toHaveLength(before);
    expect(result.grant?.id).toBe('grant-acc-operator-fiap-initial');
  });

  it('impede operador e escalacao indevida de privilegio', () => {
    const state = createInitialState();
    const operator = grantAccess(state, account(state, 'acc-operator-fiap'), { accountId: 'acc-reports-fiap', role: 'REPORT_VIEWER', establishmentIds: ['est-fiap'] }, NOW);
    const promotion = grantAccess(state, account(state, 'acc-est-fiap'), { accountId: 'acc-operator-fiap', role: 'ESTABLISHMENT_ADMIN', establishmentIds: ['est-fiap'] }, NOW);
    const outside = grantAccess(state, account(state, 'acc-est-fiap'), { accountId: 'acc-operator-fiap', role: 'ESTABLISHMENT_OPERATOR', establishmentIds: ['est-mercadox'] }, NOW);

    expect(operator.issues).toContain('Perfil sem permissao para gerenciar acessos.');
    expect(promotion.issues).toContain('Administrador local nao pode promover outro administrador.');
    expect(outside.issues).toContain('Escopo solicitado ultrapassa os estabelecimentos administrados.');
  });

  it('revoga imediatamente, preserva trilha e protege o proprio acesso', () => {
    const state = createInitialState();
    const actor = account(state, 'acc-est-fiap');
    const self = revokeAccess(state, actor, 'grant-acc-est-fiap-initial', 'Tentativa de revogacao propria', NOW);
    const short = revokeAccess(state, actor, 'grant-acc-operator-fiap-initial', 'curto', NOW);
    const revoked = revokeAccess(state, actor, 'grant-acc-operator-fiap-initial', 'Colaborador removido da operacao.', NOW);

    expect(self.issues).toContain('Nao e permitido revogar o proprio acesso ativo.');
    expect(short.issues).toContain('Informe o motivo da revogacao com pelo menos 8 caracteres.');
    expect(activeGrantFor(revoked.state, 'acc-operator-fiap')).toBeUndefined();
    expect(revoked.grant).toMatchObject({ status: 'REVOKED', revocationReason: 'Colaborador removido da operacao.' });
    expect(revoked.state.audit.at(-1)?.summary).toContain('revogado por Gestora FIAP');
  });
});
