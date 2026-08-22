import type { Profile } from "./admin";

export type AdminCapability =
  | "overview:view"
  | "network:assets"
  | "network:portfolio"
  | "network:onboard"
  | "operations:monitor"
  | "queue:manage"
  | "chargers:command"
  | "energy:monitor"
  | "commercial:read"
  | "commercial:self-service"
  | "commercial:manage"
  | "finance:manage"
  | "intelligence:read"
  | "intelligence:portfolio"
  | "governance:audit";

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
    "commercial:read",
    "commercial:manage",
    "finance:manage",
    "intelligence:read",
    "intelligence:portfolio",
    "governance:audit"
  ],
  ESTABELECIMENTO: [
    "overview:view",
    "network:assets",
    "operations:monitor",
    "queue:manage",
    "chargers:command",
    "energy:monitor",
    "commercial:read",
    "commercial:self-service",
    "intelligence:read"
  ]
} as const satisfies Record<Profile, readonly AdminCapability[]>;

export function hasAdminCapability(profile: Profile, capability: AdminCapability) {
  return (CAPABILITIES_BY_PROFILE[profile] as readonly AdminCapability[]).includes(capability);
}

export function getAdminCapabilities(profile: Profile): readonly AdminCapability[] {
  return CAPABILITIES_BY_PROFILE[profile];
}
