import type { AccessActionResult, AccessGrant, Account, AdminRole, AdminState } from "./admin";
import { hasAdminCapability } from "./adminCapabilities";

export interface GrantAccessInput {
  accountId: string;
  role: AdminRole;
  establishmentIds: string[];
}

export interface AccessTransitionResult extends AccessActionResult {
  state: AdminState;
}

const GOODWE_ROLES: readonly AdminRole[] = ["GOODWE_CENTRAL", "GOODWE_PORTFOLIO_MANAGER", "GOODWE_TECH_SUPPORT", "GOODWE_ADMIN"];

function isGoodWeRole(role?: AdminRole) {
  return Boolean(role && GOODWE_ROLES.includes(role));
}

export function activeGrantFor(state: AdminState, accountId: string) {
  return state.accessGrants.find((item) => item.accountId === accountId && item.status === "ACTIVE");
}

export function accessibleEstablishmentIds(state: AdminState, account: Account | null) {
  if (!account) return [];
  const grant = activeGrantFor(state, account.id);
  return grant?.establishmentIds ?? (account.establishmentId ? [account.establishmentId] : []);
}

export function canAccessEstablishment(state: AdminState, account: Account | null, establishmentId: string) {
  return accessibleEstablishmentIds(state, account).includes(establishmentId);
}

function normalizeScopes(establishmentIds: string[]) {
  return [...new Set(establishmentIds.map((item) => item.trim()).filter(Boolean))].sort();
}

function grantIssues(state: AdminState, actor: Account | null, input: GrantAccessInput) {
  const issues: string[] = [];
  const target = state.accounts.find((item) => item.id === input.accountId);
  const scopes = normalizeScopes(input.establishmentIds);
  if (!actor || !hasAdminCapability(actor, "access:manage")) issues.push("Perfil sem permissao para gerenciar acessos.");
  if (!target) issues.push("Conta de destino nao encontrada.");
  if (isGoodWeRole(input.role)) {
    if (actor?.role !== "GOODWE_CENTRAL" && actor?.role !== "GOODWE_ADMIN") issues.push("Somente a Central GoodWe pode atribuir responsabilidades GoodWe.");
    if (target?.profile !== "GOODWE") issues.push("A responsabilidade selecionada exige uma conta GoodWe.");
    if (!scopes.length) issues.push("Toda responsabilidade GoodWe exige carteira, regiao ou plantas explicitas.");
  } else {
    if (!scopes.length) issues.push("Selecione ao menos um estabelecimento para o acesso.");
    if (target?.profile !== "ESTABELECIMENTO") issues.push("O papel selecionado exige uma conta de estabelecimento.");
  }
  const known = new Set(state.establishments.map((item) => item.id));
  if (scopes.some((item) => !known.has(item))) issues.push("O escopo contem estabelecimento inexistente.");
  if (actor) {
    const actorScopes = new Set(accessibleEstablishmentIds(state, actor));
    if (!isGoodWeRole(actor.role) && input.role === "ESTABLISHMENT_ADMIN") issues.push("Administrador local nao pode promover outro administrador.");
    if (scopes.some((item) => !actorScopes.has(item))) issues.push("Escopo solicitado ultrapassa os estabelecimentos administrados.");
  }
  return issues;
}

export function grantAccess(state: AdminState, actor: Account | null, input: GrantAccessInput, now = new Date().toISOString()): AccessTransitionResult {
  const establishmentIds = normalizeScopes(input.establishmentIds);
  const issues = grantIssues(state, actor, { ...input, establishmentIds });
  if (issues.length) return { ok: false, issues, state };

  const active = activeGrantFor(state, input.accountId);
  if (active && active.role === input.role && active.establishmentIds.join("|") === establishmentIds.join("|")) {
    return { ok: true, issues: [], grant: active, state };
  }

  const retired = state.accessGrants.map((item) => item.accountId === input.accountId && item.status === "ACTIVE" ? {
    ...item,
    status: "REVOKED" as const,
    revokedAt: now,
    revokedBy: actor!.displayName,
    revocationReason: "Substituido por uma nova concessao."
  } : item);
  const grant: AccessGrant = {
    id: `grant-${input.accountId}-${Date.parse(now) || now.replace(/\W/g, "")}`,
    accountId: input.accountId,
    role: input.role,
    establishmentIds,
    status: "ACTIVE",
    grantedAt: now,
    grantedBy: actor!.displayName
  };
  return {
    ok: true,
    issues: [],
    grant,
    state: {
      ...state,
      accounts: state.accounts.map((item) => item.id === input.accountId ? { ...item, role: input.role, establishmentId: establishmentIds[0] ?? item.establishmentId } : item),
      accessGrants: [...retired, grant],
      audit: [...state.audit, { id: `audit-${grant.id}`, summary: `Acesso ${input.role} concedido a ${input.accountId} por ${actor!.displayName}`, at: now }]
    }
  };
}

export function revokeAccess(state: AdminState, actor: Account | null, grantId: string, reason: string, now = new Date().toISOString()): AccessTransitionResult {
  const current = state.accessGrants.find((item) => item.id === grantId);
  if (!current) return { ok: false, issues: ["Concessao de acesso nao encontrada."], state };
  if (!actor || !hasAdminCapability(actor, "access:manage")) return { ok: false, issues: ["Perfil sem permissao para gerenciar acessos."], grant: current, state };
  if (current.accountId === actor.id) return { ok: false, issues: ["Nao e permitido revogar o proprio acesso ativo."], grant: current, state };
  if (current.status === "REVOKED") return { ok: true, issues: [], grant: current, state };
  if (reason.trim().length < 8) return { ok: false, issues: ["Informe o motivo da revogacao com pelo menos 8 caracteres."], grant: current, state };
  const actorScopes = new Set(accessibleEstablishmentIds(state, actor));
  if (current.establishmentIds.some((item) => !actorScopes.has(item))) return { ok: false, issues: ["Concessao fora do escopo administrado."], grant: current, state };
  const grant: AccessGrant = { ...current, status: "REVOKED", revokedAt: now, revokedBy: actor.displayName, revocationReason: reason.trim() };
  return {
    ok: true,
    issues: [],
    grant,
    state: {
      ...state,
      accessGrants: state.accessGrants.map((item) => item.id === grantId ? grant : item),
      accounts: state.accounts.map((item) => item.id === current.accountId ? { ...item, role: undefined } : item),
      audit: [...state.audit, { id: `audit-${grant.id}-revoked`, summary: `Acesso de ${current.accountId} revogado por ${actor.displayName}`, at: now }]
    }
  };
}
