import type { AdminState } from "../domain/admin";

export interface AdminStateRepository {
  load(fallback: AdminState): AdminState;
  save(state: AdminState): void;
}

const storageKey = "chargegrid-admin-state-v3";

export function normalizeAdminState(candidate: AdminState, fallback: AdminState): AdminState {
  const chargers = Array.isArray(candidate.chargers) ? candidate.chargers : fallback.chargers;
  const chargerIds = new Set(chargers.map((item) => item.id));
  const fallbackEnergy = new Map(fallback.energy.map((item) => [item.establishmentId, item]));
  const energy = (Array.isArray(candidate.energy) ? candidate.energy : fallback.energy).map((item) => {
    const defaults = fallbackEnergy.get(item.establishmentId);
    return {
      ...defaults,
      ...item,
      demandKw: Number.isFinite(item.demandKw) ? item.demandKw : defaults?.demandKw ?? 0,
      contractedLimitKw: Number.isFinite(item.contractedLimitKw) ? item.contractedLimitKw : defaults?.contractedLimitKw ?? 0
    };
  });
  const fallbackQueue = new Map(fallback.queue.map((item) => [item.id, item]));
  const queue = (Array.isArray(candidate.queue) ? candidate.queue : fallback.queue).map((item, index) => ({
    ...fallbackQueue.get(item.id),
    ...item,
    driverId: item.driverId ?? fallbackQueue.get(item.id)?.driverId ?? `legacy-driver-${item.id}`,
    requiredConnector: item.requiredConnector ?? fallbackQueue.get(item.id)?.requiredConnector ?? "TYPE_2",
    joinedAt: item.joinedAt ?? fallbackQueue.get(item.id)?.joinedAt ?? new Date(Date.UTC(2026, 7, 18, 20, index)).toISOString()
  }));

  return {
    ...fallback,
    ...candidate,
    accounts: candidate.accounts.filter((item) => item.profile === "GOODWE" || item.profile === "ESTABELECIMENTO"),
    commercialPlants: Array.isArray(candidate.commercialPlants) ? candidate.commercialPlants : fallback.commercialPlants,
    plantOnboardingDraft: {
      ...fallback.plantOnboardingDraft,
      ...(candidate.plantOnboardingDraft ?? {})
    },
    chargers,
    chargerTelemetry: Array.isArray(candidate.chargerTelemetry) ? candidate.chargerTelemetry : fallback.chargerTelemetry,
    chargerCommands: Array.isArray(candidate.chargerCommands) ? candidate.chargerCommands : fallback.chargerCommands,
    sessions: candidate.sessions.map((item) => chargerIds.has(item.chargerId) ? item : {
      ...item,
      chargerId: chargers.find((charger) => charger.establishmentId === item.establishmentId)?.id ?? item.chargerId
    }),
    sessionEvents: Array.isArray(candidate.sessionEvents) ? candidate.sessionEvents : fallback.sessionEvents,
    queue,
    queueEvents: Array.isArray(candidate.queueEvents) ? candidate.queueEvents : fallback.queueEvents,
    energy,
    energyPolicies: Array.isArray(candidate.energyPolicies) ? candidate.energyPolicies : fallback.energyPolicies,
    tariffPolicies: Array.isArray(candidate.tariffPolicies) ? candidate.tariffPolicies : fallback.tariffPolicies,
    paymentTransactions: Array.isArray(candidate.paymentTransactions) ? candidate.paymentTransactions : fallback.paymentTransactions,
    financialEvents: Array.isArray(candidate.financialEvents) ? candidate.financialEvents : fallback.financialEvents,
    incidents: Array.isArray(candidate.incidents) ? candidate.incidents : fallback.incidents,
    incidentEvents: Array.isArray(candidate.incidentEvents) ? candidate.incidentEvents : fallback.incidentEvents,
    recommendations: Array.isArray(candidate.recommendations) ? candidate.recommendations : fallback.recommendations
  };
}

export const browserAdminStateRepository: AdminStateRepository = {
  load(fallback) {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return fallback;
    try {
      return normalizeAdminState(JSON.parse(stored) as AdminState, fallback);
    } catch {
      return fallback;
    }
  },
  save(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }
};
