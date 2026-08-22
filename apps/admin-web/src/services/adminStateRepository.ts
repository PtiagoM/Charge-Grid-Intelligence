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
    energy
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
