import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AccessActionResult, Account, AdminState, ChargerCommercialStatus, FinancialActionResult, IncidentActionResult, PlantOnboardingDraft, PlantOnboardingPublishResult, QueueActionResult, Recommendation, ReportActionResult, ReportSubscription, RequestChargerCommandInput, RequestChargerCommandResult, SupportTicket } from "../domain/admin";
import { createInitialState } from "../fixtures/adminDemo";
import { GOODWE_PLANT_CATALOG } from "../fixtures/goodwePlantCatalog";
import { createEmptyPlantOnboardingDraft, publishPlantOnboarding as publishPlantDraft } from "../domain/plantOnboarding";
import { browserAdminStateRepository } from "../services/adminStateRepository";
import { acceptChargerCommand, requestChargerCommand as requestCommand, resolveChargerCommand, updateChargerCommercialStatus as updateCommercialStatus } from "../domain/chargerOperations";
import { demoAdminChargerCommandRepository } from "../services/adminChargerCommandRepository";
import { callNextDriver, confirmQueueArrival as confirmArrival, markQueueNoShow as noShow, releaseQueueEntry as releaseEntry } from "../domain/queueOperations";
import { activateTariffPolicy as activateTariff, refundPayment as refundTransaction, settlePayment as settleTransaction, type ActivateTariffInput } from "../domain/financialOperations";
import { acknowledgeIncident as acknowledgeOperationalIncident, correlateOperationalSignals, decideRecommendation as decideOperationalRecommendation, resolveIncident as resolveOperationalIncident } from "../domain/incidentOperations";
import { grantAccess as grantAccountAccess, revokeAccess as revokeAccountAccess, type GrantAccessInput } from "../domain/accessOperations";
import { completeReport, failReport, markReportProcessing, requestReport as requestOperationalReport, saveReportSubscription as saveOperationalReportSubscription, type RequestReportInput } from "../domain/reportOperations";
import { demoAdminReportRepository } from "../services/adminReportRepository";

function readState(): AdminState {
  return browserAdminStateRepository.load(createInitialState());
}

interface AdminContextValue {
  state: AdminState;
  account: Account | null;
  login: (email: string, password: string) => Account | null;
  logout: () => void;
  updateChargerCommercialStatus: (chargerId: string, target: ChargerCommercialStatus) => AccessActionResult;
  requestChargerCommand: (input: RequestChargerCommandInput) => Promise<RequestChargerCommandResult>;
  callNextQueueDriver: (establishmentId: string) => QueueActionResult;
  confirmQueueArrival: (entryId: string) => QueueActionResult;
  markQueueNoShow: (entryId: string, now?: string) => QueueActionResult;
  releaseQueueEntry: (entryId: string) => QueueActionResult;
  activateTariffPolicy: (input: ActivateTariffInput) => FinancialActionResult;
  refundPayment: (transactionId: string, amountCents: number, reason: string, idempotencyKey: string) => FinancialActionResult;
  settlePayment: (transactionId: string) => FinancialActionResult;
  acknowledgeIncident: (incidentId: string, assignee: string) => IncidentActionResult;
  resolveIncident: (incidentId: string, resolution: string) => IncidentActionResult;
  decideRecommendation: (recommendationId: string, decision: Extract<Recommendation["status"], "ACCEPTED" | "DEFERRED" | "REJECTED">, reason: string) => IncidentActionResult;
  grantAccess: (input: GrantAccessInput) => AccessActionResult;
  revokeAccess: (grantId: string, reason: string) => AccessActionResult;
  requestReport: (input: RequestReportInput) => Promise<ReportActionResult>;
  retryReport: (jobId: string) => Promise<ReportActionResult>;
  saveReportSubscription: (input: Pick<ReportSubscription, "type" | "establishmentIds" | "cadence" | "status">) => ReportActionResult;
  createTicket: (establishmentId: string, title: string, description: string) => string;
  updatePlantOnboardingDraft: (patch: Partial<PlantOnboardingDraft>) => void;
  resetPlantOnboardingDraft: () => void;
  publishPlantOnboarding: () => PlantOnboardingPublishResult;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(readState);

  useEffect(() => browserAdminStateRepository.save(state), [state]);

  const account = state.accounts.find((item) => item.id === state.currentAccountId) ?? null;

  const login = useCallback((email: string, password: string) => {
    const matched = state.accounts.find((item) => item.email === email.trim().toLowerCase() && item.password === password) ?? null;
    if (matched) setState((current) => ({ ...current, currentAccountId: matched.id }));
    return matched;
  }, [state]);

  const logout = useCallback(() => setState((current) => ({ ...current, currentAccountId: null })), []);

  const updateChargerCommercialStatus = useCallback((chargerId: string, target: ChargerCommercialStatus) => {
    const transition = updateCommercialStatus(state, account, chargerId, target);
    if (transition.ok) setState(transition.state);
    return { ok: transition.ok, issues: transition.issues };
  }, [account, state]);

  const requestChargerCommand = useCallback(async (input: RequestChargerCommandInput) => {
    const requested = requestCommand(state, account, input);
    if (!requested.ok || !requested.command) return requested;
    setState(requested.state);

    const provider = await demoAdminChargerCommandRepository.submit(requested.command);
    const accepted = acceptChargerCommand(requested.state, requested.command.id, provider.providerCommandId, provider.acceptedAt);
    if (!accepted.ok || !accepted.command) {
      setState(accepted.state);
      return accepted;
    }
    setState(accepted.state);

    const observation = await demoAdminChargerCommandRepository.observe(accepted.command);
    const resolved = resolveChargerCommand(accepted.state, accepted.command.id, observation.outcome, observation.observedAt);
    setState(correlateOperationalSignals(resolved.state, observation.observedAt));
    return resolved;
  }, [account, state]);

  const callNextQueueDriver = useCallback((establishmentId: string) => {
    const transition = callNextDriver(state, account, establishmentId);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const confirmQueueArrival = useCallback((entryId: string) => {
    const transition = confirmArrival(state, account, entryId);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const markQueueNoShow = useCallback((entryId: string, now?: string) => {
    const transition = noShow(state, account, entryId, now);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const releaseQueueEntry = useCallback((entryId: string) => {
    const transition = releaseEntry(state, account, entryId);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const activateTariffPolicy = useCallback((input: ActivateTariffInput) => {
    const transition = activateTariff(state, account, input);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const refundPayment = useCallback((transactionId: string, amountCents: number, reason: string, idempotencyKey: string) => {
    const transition = refundTransaction(state, account, transactionId, amountCents, reason, idempotencyKey);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const settlePayment = useCallback((transactionId: string) => {
    const transition = settleTransaction(state, account, transactionId);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const acknowledgeIncident = useCallback((incidentId: string, assignee: string) => {
    const transition = acknowledgeOperationalIncident(state, account, incidentId, assignee);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const resolveIncident = useCallback((incidentId: string, resolution: string) => {
    const transition = resolveOperationalIncident(state, account, incidentId, resolution);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const decideRecommendation = useCallback((recommendationId: string, decision: Extract<Recommendation["status"], "ACCEPTED" | "DEFERRED" | "REJECTED">, reason: string) => {
    const transition = decideOperationalRecommendation(state, account, recommendationId, decision, reason);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const grantAccess = useCallback((input: GrantAccessInput) => {
    const transition = grantAccountAccess(state, account, input);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const revokeAccess = useCallback((grantId: string, reason: string) => {
    const transition = revokeAccountAccess(state, account, grantId, reason);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const runReport = useCallback(async (input: RequestReportInput) => {
    const requested = requestOperationalReport(state, account, input);
    if (!requested.ok || !requested.job) return requested;
    setState(requested.state);
    const processing = markReportProcessing(requested.state, requested.job.id);
    if (!processing.ok || !processing.job) return processing;
    setState(processing.state);
    try {
      const artifact = await demoAdminReportRepository.generate(processing.state, processing.job);
      const completed = completeReport(processing.state, processing.job.id, artifact);
      setState(completed.state);
      return completed;
    } catch (error) {
      const failed = failReport(processing.state, processing.job.id, error instanceof Error ? error.message : "Falha inesperada ao gerar relatorio.");
      setState(failed.state);
      return failed;
    }
  }, [account, state]);

  const retryReport = useCallback(async (jobId: string) => {
    const job = state.reportJobs.find((item) => item.id === jobId);
    if (!job || job.status !== "FAILED") return { ok: false, issues: ["Somente tarefas com falha podem ser repetidas."] };
    return runReport({ type: job.type, establishmentIds: job.establishmentIds, periodFrom: job.periodFrom, periodTo: job.periodTo });
  }, [runReport, state.reportJobs]);

  const saveReportSubscription = useCallback((input: Pick<ReportSubscription, "type" | "establishmentIds" | "cadence" | "status">) => {
    const transition = saveOperationalReportSubscription(state, account, input);
    if (transition.ok) setState(transition.state);
    return transition;
  }, [account, state]);

  const createTicket = useCallback((establishmentId: string, title: string, description: string) => {
    const id = `ticket-${Date.now().toString(36)}`;
    const ticket: SupportTicket = { id, establishmentId, code: `SUP-2026-${String(Date.now()).slice(-4)}`, title, description, status: "Aberto", createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, supportTickets: [...current.supportTickets, ticket], audit: [...current.audit, { id: `audit-${Date.now()}`, summary: `Chamado ${ticket.code} criado`, at: ticket.createdAt }] }));
    return id;
  }, []);

  const updatePlantOnboardingDraft = useCallback((patch: Partial<PlantOnboardingDraft>) => {
    setState((current) => ({
      ...current,
      plantOnboardingDraft: {
        ...current.plantOnboardingDraft,
        ...patch,
        updatedAt: new Date().toISOString()
      }
    }));
  }, []);

  const resetPlantOnboardingDraft = useCallback(() => {
    setState((current) => ({ ...current, plantOnboardingDraft: createEmptyPlantOnboardingDraft() }));
  }, []);

  const publishPlantOnboarding = useCallback(() => {
    const publication = publishPlantDraft(state, GOODWE_PLANT_CATALOG, state.plantOnboardingDraft);
    if (publication.result.ok) setState(publication.state);
    return publication.result;
  }, [state]);

  const value = useMemo(() => ({ state, account, login, logout, updateChargerCommercialStatus, requestChargerCommand, callNextQueueDriver, confirmQueueArrival, markQueueNoShow, releaseQueueEntry, activateTariffPolicy, refundPayment, settlePayment, acknowledgeIncident, resolveIncident, decideRecommendation, grantAccess, revokeAccess, requestReport: runReport, retryReport, saveReportSubscription, createTicket, updatePlantOnboardingDraft, resetPlantOnboardingDraft, publishPlantOnboarding }), [state, account, login, logout, updateChargerCommercialStatus, requestChargerCommand, callNextQueueDriver, confirmQueueArrival, markQueueNoShow, releaseQueueEntry, activateTariffPolicy, refundPayment, settlePayment, acknowledgeIncident, resolveIncident, decideRecommendation, grantAccess, revokeAccess, runReport, retryReport, saveReportSubscription, createTicket, updatePlantOnboardingDraft, resetPlantOnboardingDraft, publishPlantOnboarding]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminState() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdminState deve ser usado dentro de AdminProvider.");
  return context;
}
