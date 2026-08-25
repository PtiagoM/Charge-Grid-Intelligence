import type { AdminState } from "../domain/admin";

export interface AdminStateRepository {
  load(fallback: AdminState): AdminState;
  save(state: AdminState): void;
}

const storageKey = "chargegrid-admin-state-v3";

export function normalizeAdminState(candidate: AdminState, fallback: AdminState): AdminState {
  const fallbackAccounts = new Map(fallback.accounts.map((item) => [item.id, item]));
  const fallbackChargers = new Map(fallback.chargers.map((item) => [item.id, item]));
  const chargers = (Array.isArray(candidate.chargers) ? candidate.chargers : fallback.chargers).map((item) => ({
    ...item,
    commercialStatus: item.commercialStatus ?? fallbackChargers.get(item.id)?.commercialStatus ?? "PUBLISHED" as const
  }));
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
  const candidateAccounts = candidate.accounts.filter((item) => item.profile === "GOODWE" || item.profile === "ESTABELECIMENTO").map((item) => ({
    ...item,
    semsAccountType: item.semsAccountType ?? fallbackAccounts.get(item.id)?.semsAccountType ?? (item.profile === "GOODWE" ? "DISTRIBUTOR_INSTALLER" as const : "OWNER" as const),
    role: item.role === "GOODWE_ADMIN" ? "GOODWE_CENTRAL" as const : item.role ?? fallbackAccounts.get(item.id)?.role,
    semsOrganizationFunction: item.semsOrganizationFunction ?? fallbackAccounts.get(item.id)?.semsOrganizationFunction,
    technicalEstablishmentIds: item.technicalEstablishmentIds ?? fallbackAccounts.get(item.id)?.technicalEstablishmentIds
  }));
  const candidateAccountIds = new Set(candidateAccounts.map((item) => item.id));
  const accounts = [...candidateAccounts, ...fallback.accounts.filter((item) => !candidateAccountIds.has(item.id))];
  const migratedGrants = (Array.isArray(candidate.accessGrants) ? candidate.accessGrants : fallback.accessGrants).map((item) => ({
    ...item,
    role: item.role === "GOODWE_ADMIN" ? "GOODWE_CENTRAL" as const : item.role,
    establishmentIds: item.role === "GOODWE_ADMIN" && !item.establishmentIds.length ? fallback.establishments.map((establishment) => establishment.id) : item.establishmentIds
  }));
  const grantedAccountIds = new Set(migratedGrants.map((item) => item.accountId));
  const accessGrants = [...migratedGrants, ...fallback.accessGrants.filter((item) => !grantedAccountIds.has(item.accountId))];

  return {
    ...fallback,
    ...candidate,
    accounts,
    accessGrants,
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
    recommendations: Array.isArray(candidate.recommendations) ? candidate.recommendations : fallback.recommendations,
    reportJobs: Array.isArray(candidate.reportJobs) ? candidate.reportJobs : fallback.reportJobs,
    reportSubscriptions: Array.isArray(candidate.reportSubscriptions) ? candidate.reportSubscriptions : fallback.reportSubscriptions
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
