import type { Account, AdminRole, Profile } from "./admin";

export type AdminCapability =
  | "overview:view"
  | "network:assets"
  | "alarms:view"
  | "analysis:technical"
  | "service:view"
  | "organization:view"
  | "network:portfolio"
  | "network:onboard"
  | "operations:monitor"
  | "queue:manage"
  | "chargers:command"
  | "energy:monitor"
  | "incidents:manage"
  | "commercial:read"
  | "commercial:activate"
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
    "alarms:view",
    "analysis:technical",
    "service:view",
    "reports:generate"
  ],
  ESTABELECIMENTO: [
    "overview:view",
    "network:assets",
    "alarms:view",
    "analysis:technical",
    "service:view",
    "reports:generate"
  ]
} as const satisfies Record<Profile, readonly AdminCapability[]>;

const CAPABILITIES_BY_ROLE = {
  GOODWE_CENTRAL: [
    "organization:view",
    "network:portfolio",
    "network:onboard",
    "energy:monitor",
    "incidents:manage",
    "commercial:read",
    "commercial:activate",
    "commercial:manage",
    "intelligence:read",
    "intelligence:portfolio",
    "governance:audit",
    "access:manage",
    "reports:generate",
    "reports:subscribe"
  ],
  GOODWE_PORTFOLIO_MANAGER: [
    "organization:view",
    "network:portfolio",
    "network:onboard",
    "energy:monitor",
    "incidents:manage",
    "commercial:read",
    "commercial:activate",
    "commercial:manage",
    "intelligence:read",
    "intelligence:portfolio",
    "reports:generate",
    "reports:subscribe"
  ],
  GOODWE_TECH_SUPPORT: [
    "chargers:command",
    "energy:monitor",
    "governance:audit"
  ],
  GOODWE_ADMIN: [
    "network:portfolio",
    "network:onboard",
    "operations:monitor",
    "queue:manage",
    "chargers:command",
    "energy:monitor",
    "incidents:manage",
    "commercial:read",
    "commercial:activate",
    "commercial:manage",
    "finance:manage",
    "intelligence:read",
    "intelligence:portfolio",
    "governance:audit",
    "access:manage",
    "reports:subscribe"
  ],
  ESTABLISHMENT_ADMIN: [
    "organization:view",
    "operations:monitor",
    "queue:manage",
    "chargers:command",
    "energy:monitor",
    "incidents:manage",
    "commercial:read",
    "commercial:activate",
    "commercial:self-service",
    "commercial:manage",
    "finance:manage",
    "intelligence:read",
    "access:manage",
    "reports:subscribe"
  ],
  ESTABLISHMENT_OPERATOR: [
    "overview:view",
    "network:assets",
    "operations:monitor",
    "queue:manage",
    "chargers:command",
    "energy:monitor",
    "incidents:manage"
  ],
  REPORT_VIEWER: ["commercial:read", "reports:generate", "reports:subscribe"]
} as const satisfies Record<AdminRole, readonly AdminCapability[]>;

type CapabilitySubject = Profile | Account;

function capabilitiesFor(subject: CapabilitySubject): readonly AdminCapability[] {
  if (typeof subject === "string") return CAPABILITIES_BY_PROFILE[subject];
  const technical = CAPABILITIES_BY_PROFILE[subject.profile];
  const organization = subject.semsOrganizationFunction === "ADMINISTRATOR"
    ? (["organization:view"] as const)
    : [];
  const commercial = subject.role ? CAPABILITIES_BY_ROLE[subject.role] : [];
  return [...new Set<AdminCapability>([...technical, ...organization, ...commercial])];
}

export function hasAdminCapability(subject: CapabilitySubject, capability: AdminCapability) {
  return capabilitiesFor(subject).includes(capability);
}

export function getAdminCapabilities(subject: CapabilitySubject): readonly AdminCapability[] {
  return capabilitiesFor(subject);
}
