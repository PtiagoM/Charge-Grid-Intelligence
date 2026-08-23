import type { Account, AdminState, FinancialActionResult, FinancialEvent, PaymentTransaction, Session, TariffPolicy } from "./admin";
import { hasAdminCapability } from "./adminCapabilities";

export interface FinancialTransitionResult extends FinancialActionResult {
  state: AdminState;
}

export interface ActivateTariffInput {
  establishmentId: string;
  energyPriceCentsPerKwh: number;
  idlePriceCentsPerMinute: number;
  idleGraceMinutes: number;
  platformShareBps: number;
  effectiveFrom: string;
  changeReason: string;
}

export interface FinancialBreakdown {
  energyCents: number;
  idleCents: number;
  totalCents: number;
  providerFeeCents: number;
  platformShareCents: number;
  establishmentNetCents: number;
  refundedCents: number;
}

function canManage(account: Account | null, establishmentId: string) {
  return Boolean(account && hasAdminCapability(account, "finance:manage") && (
    account.profile === "GOODWE" || account.establishmentId === establishmentId
  ));
}

export function calculateSessionCharge(session: Session, tariff: TariffPolicy) {
  const energyCents = Math.round(session.energyKwh * tariff.energyPriceCentsPerKwh);
  const billableIdleMinutes = Math.max(0, (session.idleMinutes ?? 0) - tariff.idleGraceMinutes);
  const idleCents = billableIdleMinutes * tariff.idlePriceCentsPerMinute;
  return { energyCents, idleCents, totalCents: energyCents + idleCents, billableIdleMinutes };
}

export function calculateFinancialBreakdown(transaction: PaymentTransaction): FinancialBreakdown {
  const availableCents = Math.max(0, transaction.capturedCents - transaction.refundedCents);
  const platformShareCents = Math.round(availableCents * transaction.platformShareBps / 10_000);
  return {
    energyCents: transaction.capturedCents,
    idleCents: 0,
    totalCents: transaction.capturedCents,
    providerFeeCents: transaction.providerFeeCents,
    platformShareCents,
    establishmentNetCents: Math.max(0, availableCents - transaction.providerFeeCents - platformShareCents),
    refundedCents: transaction.refundedCents
  };
}

export function activeTariffFor(state: AdminState, establishmentId: string, at = new Date().toISOString()) {
  return state.tariffPolicies
    .filter((item) => item.establishmentId === establishmentId && item.status === "ACTIVE" && item.effectiveFrom <= at && (!item.effectiveTo || item.effectiveTo > at))
    .sort((a, b) => b.version - a.version)[0];
}

export function activateTariffPolicy(state: AdminState, account: Account | null, input: ActivateTariffInput, now = new Date().toISOString()): FinancialTransitionResult {
  const issues: string[] = [];
  if (!state.establishments.some((item) => item.id === input.establishmentId)) issues.push("Estabelecimento nao encontrado.");
  if (!canManage(account, input.establishmentId)) issues.push("Perfil sem permissao para publicar tarifas.");
  if (!Number.isInteger(input.energyPriceCentsPerKwh) || input.energyPriceCentsPerKwh <= 0) issues.push("Preco de energia deve ser informado em centavos inteiros positivos.");
  if (!Number.isInteger(input.idlePriceCentsPerMinute) || input.idlePriceCentsPerMinute < 0) issues.push("Preco de ociosidade deve usar centavos inteiros.");
  if (!Number.isInteger(input.idleGraceMinutes) || input.idleGraceMinutes < 0) issues.push("Carencia de ociosidade invalida.");
  if (!Number.isInteger(input.platformShareBps) || input.platformShareBps < 0 || input.platformShareBps > 10_000) issues.push("Participacao deve estar entre 0 e 10000 basis points.");
  if (input.changeReason.trim().length < 8) issues.push("Informe um motivo com pelo menos 8 caracteres.");
  if (!Number.isFinite(new Date(input.effectiveFrom).getTime())) issues.push("Inicio de vigencia invalido.");
  if (issues.length || !account) return { ok: false, issues, state };

  const versions = state.tariffPolicies.filter((item) => item.establishmentId === input.establishmentId);
  const version = Math.max(0, ...versions.map((item) => item.version)) + 1;
  const policy: TariffPolicy = {
    id: `tariff-${input.establishmentId}-v${version}`,
    establishmentId: input.establishmentId,
    version,
    status: "ACTIVE",
    energyPriceCentsPerKwh: input.energyPriceCentsPerKwh,
    idlePriceCentsPerMinute: input.idlePriceCentsPerMinute,
    idleGraceMinutes: input.idleGraceMinutes,
    platformShareBps: input.platformShareBps,
    effectiveFrom: input.effectiveFrom,
    createdAt: now,
    createdBy: account.displayName,
    changeReason: input.changeReason.trim()
  };
  return {
    ok: true,
    issues: [],
    tariffPolicy: policy,
    state: {
      ...state,
      tariffPolicies: [...state.tariffPolicies.map((item) => item.establishmentId === input.establishmentId && item.status === "ACTIVE" ? { ...item, status: "RETIRED" as const, effectiveTo: input.effectiveFrom } : item), policy],
      establishments: state.establishments.map((item) => item.id === input.establishmentId ? { ...item, pricePerKwh: input.energyPriceCentsPerKwh / 100 } : item),
      audit: [...state.audit, { id: `audit-${policy.id}`, summary: `Tarifa v${version} publicada para ${input.establishmentId} por ${account.displayName}`, at: now }]
    }
  };
}

function replaceTransaction(state: AdminState, transaction: PaymentTransaction, financialEvent: FinancialEvent): AdminState {
  return {
    ...state,
    paymentTransactions: state.paymentTransactions.map((item) => item.id === transaction.id ? transaction : item),
    financialEvents: [...state.financialEvents, financialEvent],
    audit: [...state.audit, { id: `audit-${financialEvent.id}`, summary: `${financialEvent.type} em ${transaction.id} por ${financialEvent.actor}`, at: financialEvent.at }]
  };
}

export function refundPayment(state: AdminState, account: Account | null, transactionId: string, amountCents: number, reason: string, idempotencyKey: string, now = new Date().toISOString()): FinancialTransitionResult {
  const current = state.paymentTransactions.find((item) => item.id === transactionId);
  if (!current) return { ok: false, issues: ["Transacao nao encontrada."], state };
  if (!canManage(account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para reembolsar esta transacao."], transaction: current, state };
  const eventId = `financial-refund-${idempotencyKey.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  if (state.financialEvents.some((item) => item.id === eventId)) return { ok: true, issues: [], transaction: current, state };
  const available = current.capturedCents - current.refundedCents;
  const issues: string[] = [];
  if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > available) issues.push("Valor de reembolso excede o saldo capturado disponivel.");
  if (reason.trim().length < 8) issues.push("Informe um motivo com pelo menos 8 caracteres.");
  if (!["CAPTURED", "PARTIALLY_REFUNDED"].includes(current.status)) issues.push("Transacao nao esta elegivel para reembolso.");
  if (issues.length || !account) return { ok: false, issues, transaction: current, state };

  const refundedCents = current.refundedCents + amountCents;
  const transaction: PaymentTransaction = { ...current, refundedCents, status: refundedCents === current.capturedCents ? "REFUNDED" : "PARTIALLY_REFUNDED" };
  const financialEvent: FinancialEvent = { id: eventId, transactionId, type: "REFUNDED", at: now, actor: account.displayName, amountCents, reason: reason.trim() };
  return { ok: true, issues: [], transaction, state: replaceTransaction(state, transaction, financialEvent) };
}

export function settlePayment(state: AdminState, account: Account | null, transactionId: string, now = new Date().toISOString()): FinancialTransitionResult {
  const current = state.paymentTransactions.find((item) => item.id === transactionId);
  if (!current) return { ok: false, issues: ["Transacao nao encontrada."], state };
  if (!canManage(account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para conciliar esta transacao."], transaction: current, state };
  if (current.settlementStatus !== "AVAILABLE") return { ok: false, issues: ["Liquidacao ainda nao esta disponivel."], transaction: current, state };
  if (current.status === "DISPUTED") return { ok: false, issues: ["Transacao em disputa nao pode ser liquidada."], transaction: current, state };
  const transaction: PaymentTransaction = { ...current, settlementStatus: "PAID", settledAt: now };
  const financialEvent: FinancialEvent = { id: `financial-settled-${transaction.id}`, transactionId, type: "SETTLED", at: now, actor: account?.displayName ?? "Operacao" };
  return { ok: true, issues: [], transaction, state: replaceTransaction(state, transaction, financialEvent) };
}
