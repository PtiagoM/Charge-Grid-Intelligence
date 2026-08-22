import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Account, AdminState, NewChargerInput, NewClientInput, NewLocationInput, PlantOnboardingDraft, PlantOnboardingPublishResult, QueueActionResult, RequestChargerCommandInput, RequestChargerCommandResult, SupportTicket } from "../domain/admin";
import { createInitialState } from "../fixtures/adminDemo";
import { GOODWE_PLANT_CATALOG } from "../fixtures/goodwePlantCatalog";
import { createEmptyPlantOnboardingDraft, publishPlantOnboarding as publishPlantDraft } from "../domain/plantOnboarding";
import { browserAdminStateRepository } from "../services/adminStateRepository";
import { acceptChargerCommand, requestChargerCommand as requestCommand, resolveChargerCommand } from "../domain/chargerOperations";
import { demoAdminChargerCommandRepository } from "../services/adminChargerCommandRepository";
import { callNextDriver, confirmQueueArrival as confirmArrival, markQueueNoShow as noShow, releaseQueueEntry as releaseEntry } from "../domain/queueOperations";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function readState(): AdminState {
  return browserAdminStateRepository.load(createInitialState());
}

interface AdminContextValue {
  state: AdminState;
  account: Account | null;
  login: (email: string, password: string) => Account | null;
  logout: () => void;
  createClient: (input: NewClientInput) => string;
  createLocation: (input: NewLocationInput) => string;
  createCharger: (input: NewChargerInput) => void;
  requestChargerCommand: (input: RequestChargerCommandInput) => Promise<RequestChargerCommandResult>;
  callNextQueueDriver: (establishmentId: string) => QueueActionResult;
  confirmQueueArrival: (entryId: string) => QueueActionResult;
  markQueueNoShow: (entryId: string, now?: string) => QueueActionResult;
  releaseQueueEntry: (entryId: string) => QueueActionResult;
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
  }, [state.accounts]);

  const logout = useCallback(() => setState((current) => ({ ...current, currentAccountId: null })), []);

  const createClient = useCallback((input: NewClientInput) => {
    const id = `cli-${slugify(input.name)}`;
    setState((current) => ({
      ...current,
      clients: [...current.clients, { id, ...input, status: "Implantação" }],
      audit: [...current.audit, { id: `audit-${Date.now()}`, summary: `Cliente ${input.name} criado`, at: new Date().toISOString() }]
    }));
    return id;
  }, []);

  const createLocation = useCallback((input: NewLocationInput) => {
    const id = `loc-${slugify(input.name)}-${Date.now().toString(36)}`;
    setState((current) => ({ ...current, locations: [...current.locations, { id, ...input, latitude: -23.5617, longitude: -46.6559, status: "Ativo" }] }));
    return id;
  }, []);

  const createCharger = useCallback((input: NewChargerInput) => {
    setState((current) => ({
      ...current,
      chargers: [...current.chargers, { id: input.identifier, ...input, status: "available", todayEnergyKwh: 0, revenueToday: 0 }],
      chargerTelemetry: [...current.chargerTelemetry, { chargerId: input.identifier, connectorState: "AVAILABLE", currentPowerKw: 0, observedAt: new Date().toISOString(), vehicleConnected: false }]
    }));
  }, []);

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
    setState(resolved.state);
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

  const value = useMemo(() => ({ state, account, login, logout, createClient, createLocation, createCharger, requestChargerCommand, callNextQueueDriver, confirmQueueArrival, markQueueNoShow, releaseQueueEntry, createTicket, updatePlantOnboardingDraft, resetPlantOnboardingDraft, publishPlantOnboarding }), [state, account, login, logout, createClient, createLocation, createCharger, requestChargerCommand, callNextQueueDriver, confirmQueueArrival, markQueueNoShow, releaseQueueEntry, createTicket, updatePlantOnboardingDraft, resetPlantOnboardingDraft, publishPlantOnboarding]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminState() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdminState deve ser usado dentro de AdminProvider.");
  return context;
}
