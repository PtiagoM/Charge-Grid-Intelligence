import { CommercialSessionStatus, PaymentStatus, QueueStatus } from "@chargegrid/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { commercialPlants, getPlantById } from "../data/commercialPlants";
import { showBrowserNotification } from "../services/browserNotifications";
import { remoteAuthConfigured, signInDriver, signOutDriver, signUpDriver, subscribeToRemoteSession } from "../services/driverAuth";

export type DriverMode = "guest" | "driver";
export type PaymentMethod = "CARD" | "PIX";
export type AppTheme = "light" | "dark";

export interface DriverProfile {
  id: string;
  fullName: string;
  email: string;
  vehicleName: string;
  batteryCapacityKwh?: number;
}

interface StoredDriverAccount {
  profile: DriverProfile;
  passwordHash?: string;
  authProvider: "local" | "supabase";
}

export interface DriverReceipt {
  id: string;
  owner: DriverMode;
  establishmentId: string;
  establishmentName: string;
  chargerName: string;
  completedAt: string;
  energyKwh: number;
  energyAmount: number;
  idleAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  financialLimit: number;
  refundAmount: number;
  paymentIntentId?: string;
}

export interface DriverNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  url: string;
}

export interface DriverSessionState {
  paymentSessionId: string;
  owner: DriverMode;
  status: CommercialSessionStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  establishmentId: string;
  establishmentName: string;
  chargerId: string;
  chargerName: string;
  parkingSpot: string;
  tariffPerKwh: number;
  financialLimit: number;
  paymentMethod: PaymentMethod;
  energyKwh: number;
  currentPowerKw: number;
  energyAmount: number;
  idleMinutes: number;
  idleAmount: number;
}

export interface DriverQueueState {
  status: QueueStatus;
  establishmentId: string;
  establishmentName: string;
  position: number;
  estimatedWaitMinutes: number;
  expiresAt?: string;
  chargerName?: string;
  chargerId?: string;
  parkingSpot?: string;
}

interface PersistedState {
  version: 2;
  account: StoredDriverAccount | null;
  isAuthenticated: boolean;
  theme: AppTheme;
  selectedEstablishmentId: string;
  selectedChargerId: string;
  session: DriverSessionState | null;
  queue: DriverQueueState | null;
  receipts: DriverReceipt[];
  notifications: DriverNotification[];
}

export interface CheckoutInput {
  paymentSessionId: string;
  owner: DriverMode;
  financialLimit: number;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  vehicleName: string;
  batteryCapacityKwh?: number;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
  requiresEmailConfirmation?: boolean;
}

interface DriverAppContextValue extends PersistedState {
  profile: DriverProfile | null;
  isOnline: boolean;
  register(input: RegisterInput): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): void;
  clearLocalData(): void;
  setTheme(theme: AppTheme): void;
  selectChargingPoint(establishmentId: string, chargerId: string): void;
  authorizeSession(input: CheckoutInput): void;
  setSessionStatus(status: CommercialSessionStatus): void;
  tickSession(): void;
  finishEnergy(): void;
  applyIdleFee(): void;
  settleSession(): void;
  joinQueue(establishmentId: string): void;
  callQueue(): void;
  leaveQueue(): void;
  markNotificationsRead(): void;
  addNotification(title: string, body: string, url?: string): void;
}

const STORAGE_KEY = "chargegrid.driver.v2";
const defaultPlant = commercialPlants[0]!;
const defaultCharger = defaultPlant.chargers[0]!;

if (!defaultPlant || !defaultCharger) {
  throw new Error("A rede ChargeGrid precisa ter ao menos um ponto de recarga configurado.");
}

const initialState: PersistedState = {
  version: 2,
  account: null,
  isAuthenticated: false,
  theme: "light",
  selectedEstablishmentId: defaultPlant.id,
  selectedChargerId: defaultCharger.id,
  session: null,
  queue: null,
  receipts: [],
  notifications: []
};

function readStoredState(): PersistedState {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as PersistedState | null;
    return parsed?.version === 2 ? parsed : initialState;
  } catch {
    return initialState;
  }
}

const DriverAppContext = createContext<DriverAppContextValue | null>(null);

function notification(title: string, body: string, url = "/notifications"): DriverNotification {
  return { id: crypto.randomUUID(), title, body, createdAt: new Date().toISOString(), read: false, url };
}

async function hashPassword(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function DriverAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(readStoredState);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const lastBrowserNotificationId = useRef(state.notifications[0]?.id);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", state.theme === "light" ? "#ffffff" : "#1f2123");
  }, [state.theme]);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  useEffect(() => subscribeToRemoteSession((profile) => {
    if (!remoteAuthConfigured) return;
    setState((current) => profile ? {
      ...current,
      account: { profile, authProvider: "supabase" },
      isAuthenticated: true
    } : current.account?.authProvider === "supabase" ? { ...current, isAuthenticated: false } : current);
  }), []);

  useEffect(() => {
    const newest = state.notifications[0];
    if (!newest || newest.id === lastBrowserNotificationId.current) return;
    lastBrowserNotificationId.current = newest.id;
    void showBrowserNotification(newest.title, newest.body, newest.url).catch(() => undefined);
  }, [state.notifications]);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    const normalizedEmail = input.email.trim().toLocaleLowerCase("pt-BR");
    const remote = await signUpDriver(input).catch((error: unknown) => ({ error }));
    if (remote && "error" in remote) return { ok: false, message: remote.error instanceof Error ? remote.error.message : "Não foi possível criar sua conta." };
    const profile: DriverProfile = remote?.profile ?? {
      id: crypto.randomUUID(),
      fullName: input.fullName.trim(),
      email: normalizedEmail,
      vehicleName: input.vehicleName.trim() || "Veículo elétrico",
      batteryCapacityKwh: input.batteryCapacityKwh
    };
    const passwordHash = remote ? undefined : await hashPassword(input.password);
    const authenticated = remote ? remote.authenticated : true;
    setState((current) => ({
      ...current,
      account: { profile, passwordHash, authProvider: remote ? "supabase" : "local" },
      isAuthenticated: authenticated,
      notifications: [notification("Conta criada", `Bem-vindo ao ChargeGrid, ${profile.fullName.split(" ")[0]}.`, "/account"), ...current.notifications]
    }));
    return { ok: true, requiresEmailConfirmation: remote?.requiresEmailConfirmation };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (remoteAuthConfigured) {
      try {
        const remote = await signInDriver(email, password);
        if (!remote) return { ok: false, message: "Autenticação indisponível." };
        setState((current) => ({ ...current, account: { profile: remote.profile, authProvider: "supabase" }, isAuthenticated: true, notifications: [notification("Acesso confirmado", `Olá, ${remote.profile.fullName.split(" ")[0]}.`, "/explore"), ...current.notifications] }));
        return { ok: true };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "Não foi possível entrar." };
      }
    }
    const passwordHash = await hashPassword(password);
    const normalizedEmail = email.trim().toLocaleLowerCase("pt-BR");
    if (!state.account || state.account.profile.email !== normalizedEmail || state.account.passwordHash !== passwordHash) {
      return { ok: false, message: "E-mail ou senha incorretos." };
    }
    setState((current) => ({
        ...current,
        isAuthenticated: true,
        notifications: [notification("Acesso confirmado", `Olá, ${state.account?.profile.fullName.split(" ")[0]}.`, "/explore"), ...current.notifications]
    }));
    return { ok: true };
  }, [state.account]);

  const logout = useCallback(() => {
    void signOutDriver();
    setState((current) => ({ ...current, isAuthenticated: false, session: current.session?.owner === "driver" ? null : current.session, queue: null }));
  }, []);

  const clearLocalData = useCallback(() => setState((current) => ({ ...initialState, theme: current.theme })), []);
  const setTheme = useCallback((theme: AppTheme) => setState((current) => ({ ...current, theme })), []);

  const selectChargingPoint = useCallback((establishmentId: string, chargerId: string) => {
    setState((current) => current.selectedEstablishmentId === establishmentId && current.selectedChargerId === chargerId
      ? current
      : { ...current, selectedEstablishmentId: establishmentId, selectedChargerId: chargerId });
  }, []);

  const authorizeSession = useCallback((input: CheckoutInput) => {
    setState((current) => {
      const plant = getPlantById(current.selectedEstablishmentId) ?? defaultPlant;
      const charger = plant.chargers.find((item) => item.id === current.selectedChargerId) ?? plant.chargers[0] ?? defaultCharger;
      return {
        ...current,
        session: {
          paymentSessionId: input.paymentSessionId,
          owner: input.owner,
          status: CommercialSessionStatus.AUTHORIZED,
          paymentStatus: input.paymentMethod === "PIX" ? PaymentStatus.PAID : PaymentStatus.AUTHORIZED,
          paymentIntentId: input.paymentIntentId,
          establishmentId: plant.id,
          establishmentName: plant.name,
          chargerId: charger.id,
          chargerName: charger.commercialName,
          parkingSpot: charger.parkingSpot ?? "A01",
          tariffPerKwh: plant.tariffFrom?.amount ?? 0,
          financialLimit: input.financialLimit,
          paymentMethod: input.paymentMethod,
          energyKwh: 0,
          currentPowerKw: 0,
          energyAmount: 0,
          idleMinutes: 0,
          idleAmount: 0
        },
        queue: null,
        notifications: [notification("Pagamento autorizado", "O carregador está validando o início da recarga.", "/session"), ...current.notifications]
      };
    });
  }, []);

  const setSessionStatus = useCallback((status: CommercialSessionStatus) => {
    setState((current) => current.session ? {
      ...current,
      session: { ...current.session, status, currentPowerKw: status === CommercialSessionStatus.CHARGING ? Math.min(22, current.session.currentPowerKw || 7) : current.session.currentPowerKw },
      notifications: status === CommercialSessionStatus.CHARGING
        ? [notification("Recarga iniciada", `Energia confirmada em ${current.session.chargerName}.`, "/session"), ...current.notifications]
        : current.notifications
    } : current);
  }, []);

  const tickSession = useCallback(() => setState((current) => {
    if (!current.session || current.session.status !== CommercialSessionStatus.CHARGING) return current;
    const energyKwh = Number((current.session.energyKwh + 0.5).toFixed(2));
    return {
      ...current,
      session: {
        ...current.session,
        energyKwh,
        currentPowerKw: Math.max(current.session.currentPowerKw, 7),
        energyAmount: Number((energyKwh * current.session.tariffPerKwh).toFixed(2))
      }
    };
  }), []);

  const finishEnergy = useCallback(() => setState((current) => current.session ? {
    ...current,
    session: { ...current.session, status: CommercialSessionStatus.ENERGY_FINISHED, currentPowerKw: 0 },
    notifications: [notification("Energia finalizada", "Retire o veículo em até 15 minutos para evitar cobrança de ociosidade.", "/session"), ...current.notifications]
  } : current), []);

  const applyIdleFee = useCallback(() => setState((current) => current.session ? {
    ...current,
    session: { ...current.session, status: CommercialSessionStatus.IDLE_FEE, idleMinutes: 4, idleAmount: 2 },
    notifications: [notification("Ociosidade em cobrança", "A tolerância terminou. A taxa atual é de R$ 0,50 por minuto.", "/session"), ...current.notifications]
  } : current), []);

  const settleSession = useCallback(() => setState((current) => {
    if (!current.session) return current;
    const session = current.session;
    const totalAmount = Number((session.energyAmount + session.idleAmount).toFixed(2));
    const refundAmount = session.paymentMethod === "PIX" ? Number(Math.max(0, session.financialLimit - totalAmount).toFixed(2)) : 0;
    const receipt: DriverReceipt = {
      id: `CG-${Date.now().toString().slice(-8)}`,
      owner: session.owner,
      establishmentId: session.establishmentId,
      establishmentName: session.establishmentName,
      chargerName: session.chargerName,
      completedAt: new Date().toISOString(),
      energyKwh: session.energyKwh,
      energyAmount: session.energyAmount,
      idleAmount: session.idleAmount,
      totalAmount,
      paymentMethod: session.paymentMethod,
      financialLimit: session.financialLimit,
      refundAmount,
      paymentIntentId: session.paymentIntentId
    };
    return {
      ...current,
      session: { ...session, status: CommercialSessionStatus.COMPLETED, paymentStatus: refundAmount > 0 ? PaymentStatus.REFUND_PENDING : PaymentStatus.PAID },
      receipts: [receipt, ...current.receipts],
      notifications: [notification("Sessão concluída", refundAmount > 0 ? `Saldo de ${refundAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em processamento.` : "Pagamento concluído e comprovante disponível.", `/receipt/${receipt.id}`), ...current.notifications]
    };
  }), []);

  const joinQueue = useCallback((establishmentId: string) => setState((current) => {
    const plant = getPlantById(establishmentId) ?? defaultPlant;
    return {
      ...current,
      queue: {
        status: QueueStatus.WAITING,
        establishmentId: plant.id,
        establishmentName: plant.name,
        position: Math.max(1, plant.queueSummary.activeCount + 1),
        estimatedWaitMinutes: plant.queueSummary.estimatedWaitMinutes ?? 18
      },
      notifications: [notification("Você entrou na fila", `Acompanhe sua posição em ${plant.name}.`, "/queue"), ...current.notifications]
    };
  }), []);

  const callQueue = useCallback(() => setState((current) => {
    if (!current.queue) return current;
    const plant = getPlantById(current.queue.establishmentId) ?? defaultPlant;
    const charger = plant.chargers[0] ?? defaultCharger;
    return {
      ...current,
      selectedEstablishmentId: plant.id,
      selectedChargerId: charger.id,
      queue: {
        ...current.queue,
        status: QueueStatus.CALLED,
        position: 1,
        estimatedWaitMinutes: 0,
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        chargerName: charger.commercialName,
        chargerId: charger.id,
        parkingSpot: charger.parkingSpot
      },
      notifications: [notification("Sua vez", `Dirija-se à vaga ${charger.parkingSpot ?? "indicada"} em até 10 minutos.`, "/queue"), ...current.notifications]
    };
  }), []);

  const leaveQueue = useCallback(() => setState((current) => ({ ...current, queue: null })), []);
  const markNotificationsRead = useCallback(() => setState((current) => ({ ...current, notifications: current.notifications.map((item) => ({ ...item, read: true })) })), []);
  const addNotification = useCallback((title: string, body: string, url?: string) => setState((current) => ({ ...current, notifications: [notification(title, body, url), ...current.notifications] })), []);

  const value = useMemo<DriverAppContextValue>(() => ({
    ...state,
    profile: state.account?.profile ?? null,
    isOnline,
    register,
    login,
    logout,
    clearLocalData,
    setTheme,
    selectChargingPoint,
    authorizeSession,
    setSessionStatus,
    tickSession,
    finishEnergy,
    applyIdleFee,
    settleSession,
    joinQueue,
    callQueue,
    leaveQueue,
    markNotificationsRead,
    addNotification
  }), [addNotification, applyIdleFee, authorizeSession, callQueue, clearLocalData, finishEnergy, isOnline, joinQueue, leaveQueue, login, logout, markNotificationsRead, register, selectChargingPoint, setSessionStatus, setTheme, settleSession, state, tickSession]);

  return <DriverAppContext.Provider value={value}>{children}</DriverAppContext.Provider>;
}

export function useDriverApp() {
  const context = useContext(DriverAppContext);
  if (!context) throw new Error("useDriverApp deve ser usado dentro de DriverAppProvider");
  return context;
}
