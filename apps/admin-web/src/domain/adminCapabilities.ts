import type { Account, AdminRole, Profile } from "./admin";

export type AdminCapability =
  | "overview:view"
  | "network:assets"
  | "network:portfolio"
  | "network:onboard"
  | "operations:monitor"
  | "queue:manage"
  | "chargers:command"
  | "energy:monitor"
  | "incidents:manage"
  | "commercial:read"
  | "commercial:self-service"
  | "commercial:manage"
  | "finance:manage"
  | "intelligence:read"
  | "intelligence:portfolio"
  | "governance:audit"
  | "access:manage"
  | "reports:generate"
  | "reports:subscribe";

const CAPABILITIES_BY_PROFILE = {
  GOODWE: [
    "overview:view",
    "network:assets",
    "network:portfolio",
    "network:onboard",
    "operations:monitor",
    "queue:manage",
    "chargers:command",
    "energy:monitor",
    "incidents:manage",
    "commercial:read",
    "commercial:manage",
    "finance:manage",
    "intelligence:read",
    "intelligence:portfolio",
    "governance:audit",
    "access:manage",
    "reports:generate",
    "reports:subscribe"
  ],
  ESTABELECIMENTO: [
    "overview:view",
    "network:assets",
    "operations:monitor",
    "queue:manage",
    "chargers:command",
    "energy:monitor",
    "incidents:manage",
    "commercial:read",
    "commercial:self-service",
    "intelligence:read",
    "access:manage",
    "reports:generate",
    "reports:subscribe"
  ]
} as const satisfies Record<Profile, readonly AdminCapability[]>;

const CAPABILITIES_BY_ROLE = {
  GOODWE_ADMIN: CAPABILITIES_BY_PROFILE.GOODWE,
  ESTABLISHMENT_ADMIN: CAPABILITIES_BY_PROFILE.ESTABELECIMENTO,
  ESTABLISHMENT_OPERATOR: [
    "overview:view",
    "network:assets",
    "operations:monitor",
    "queue:manage",
    "chargers:command",
    "energy:monitor",
    "incidents:manage"
  ],
  REPORT_VIEWER: ["overview:view", "reports:generate"]
} as const satisfies Record<AdminRole, readonly AdminCapability[]>;

type CapabilitySubject = Profile | Account;

function capabilitiesFor(subject: CapabilitySubject): readonly AdminCapability[] {
  if (typeof subject === "string") return CAPABILITIES_BY_PROFILE[subject];
  return CAPABILITIES_BY_ROLE[subject.role];
}

export function hasAdminCapability(subject: CapabilitySubject, capability: AdminCapability) {
  return capabilitiesFor(subject).includes(capability);
}

export function getAdminCapabilities(subject: CapabilitySubject): readonly AdminCapability[] {
  return capabilitiesFor(subject);
}
