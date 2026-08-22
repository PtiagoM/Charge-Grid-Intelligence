import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Account, AppState, NewChargerInput, NewClientInput, NewLocationInput, Payment, Session, SupportTicket } from "./model";
import { createInitialState } from "./seed";

const storageKey = "chargegrid-native-state-v2";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function readState(): AppState {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return createInitialState();
  try {
    return JSON.parse(stored) as AppState;
  } catch {
    return createInitialState();
  }
}

interface AppContextValue {
  state: AppState;
  account: Account | null;
  login: (email: string, password: string) => Account | null;
  logout: () => void;
  createClient: (input: NewClientInput) => string;
  createLocation: (input: NewLocationInput) => string;
  createCharger: (input: NewChargerInput) => void;
  createTicket: (establishmentId: string, title: string, description: string) => string;
  startSession: (chargerId: string, payment: Payment, source?: "driver" | "quick") => Session | null;
  finishSession: (sessionId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(readState);

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(state)), [state]);

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
      chargers: [...current.chargers, { id: input.identifier, ...input, status: "available", todayEnergyKwh: 0, revenueToday: 0 }]
    }));
  }, []);

  const createTicket = useCallback((establishmentId: string, title: string, description: string) => {
    const id = `ticket-${Date.now().toString(36)}`;
    const ticket: SupportTicket = { id, establishmentId, code: `SUP-2026-${String(Date.now()).slice(-4)}`, title, description, status: "Aberto", createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, supportTickets: [...current.supportTickets, ticket], audit: [...current.audit, { id: `audit-${Date.now()}`, summary: `Chamado ${ticket.code} criado`, at: ticket.createdAt }] }));
    return id;
  }, []);

  const startSession = useCallback((chargerId: string, payment: Payment, source: "driver" | "quick" = "driver") => {
    const charger = state.chargers.find((item) => item.id === chargerId);
    if (!charger || charger.status === "offline") return null;
    const session: Session = {
      id: `CG-${Date.now().toString(36).toUpperCase()}`,
      chargerId,
      establishmentId: charger.establishmentId,
      locationId: charger.locationId,
      driverId: source === "quick" ? "guest-qr" : "user-driver-01",
      driverName: source === "quick" ? "Visitante QR" : "Usuario Demo",
      vehicle: source === "quick" ? "Visitante" : "BYD Dolphin",
      status: "active",
      startedAt: new Date().toISOString(),
      durationMinutes: 0,
      energyKwh: 0,
      tariffPerKwh: state.establishments.find((item) => item.id === charger.establishmentId)?.pricePerKwh ?? 2.95,
      consumedAmount: 0,
      payment
    };
    setState((current) => ({ ...current, sessions: [session, ...current.sessions], chargers: current.chargers.map((item) => item.id === chargerId ? { ...item, status: "charging" } : item) }));
    return session;
  }, [state.chargers, state.establishments]);

  const finishSession = useCallback((sessionId: string) => setState((current) => {
    const target = current.sessions.find((item) => item.id === sessionId);
    if (!target) return current;
    return {
      ...current,
      sessions: current.sessions.map((item) => item.id === sessionId ? { ...item, status: "finished", finalAmount: item.consumedAmount } : item),
      chargers: current.chargers.map((item) => item.id === target.chargerId ? { ...item, status: "available" } : item)
    };
  }), []);

  const value = useMemo(() => ({ state, account, login, logout, createClient, createLocation, createCharger, createTicket, startSession, finishSession }), [state, account, login, logout, createClient, createLocation, createCharger, createTicket, startSession, finishSession]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState deve ser usado dentro de AppProvider.");
  return context;
}
