import type { Account, Profile } from "../domain/admin";
import { hasAdminCapability, type AdminCapability } from "../domain/adminCapabilities";

export type AdminDomainId = "overview" | "plants" | "devices" | "chargegrid" | "alarms" | "reports" | "analysis" | "service" | "organization";

export interface AdminContextLink {
  route: string;
  label: string;
  capability: AdminCapability;
}

export interface AdminDomain {
  id: AdminDomainId;
  label: string;
  icon: string;
  entryRoute: Record<Profile, string>;
  description: Record<Profile, string>;
  links: readonly AdminContextLink[];
  relatedRoutes?: readonly string[];
}

export const ADMIN_DOMAINS: readonly AdminDomain[] = [
  {
    id: "overview", label: "Painel", icon: "layout-dashboard",
    entryRoute: { GOODWE: "overview", ESTABELECIMENTO: "overview" },
    description: {
      GOODWE: "Prioridades do escopo autorizado, sem substituir a leitura técnica do SEMS+.",
      ESTABELECIMENTO: "Situação técnica das plantas e contexto comercial somente onde o ChargeGrid está ativo."
    },
    links: [{ route: "overview", label: "Painel", capability: "overview:view" }]
  },
  {
    id: "plants", label: "Lista de usinas", icon: "map-pinned",
    entryRoute: { GOODWE: "plants", ESTABELECIMENTO: "plants" },
    description: {
      GOODWE: "Usinas do escopo técnico e contexto comercial da carteira atribuída.",
      ESTABELECIMENTO: "Usinas SEMS+ próprias, com estado ChargeGrid somente nas plantas contratadas."
    },
    links: [
      { route: "plants", label: "Lista de usinas", capability: "network:assets" },
      { route: "clients", label: "Carteira comercial", capability: "network:portfolio" }
    ],
    relatedRoutes: ["plant", "client", "establishments", "establishment", "locations", "location"]
  },
  {
    id: "devices", label: "Lista de dispositivos", icon: "plug-zap",
    entryRoute: { GOODWE: "chargers", ESTABELECIMENTO: "chargers" },
    description: {
      GOODWE: "Inventário técnico SEMS+ dos equipamentos autorizados.",
      ESTABELECIMENTO: "Dispositivos técnicos das plantas autorizadas."
    },
    links: [{ route: "chargers", label: "Inventário SEMS+", capability: "network:assets" }],
    relatedRoutes: ["charger"]
  },
  {
    id: "chargegrid", label: "ChargeGrid", icon: "badge-dollar-sign",
    entryRoute: { GOODWE: "operations", ESTABELECIMENTO: "operations" },
    description: {
      GOODWE: "Operação local indisponível para responsabilidades de carteira.",
      ESTABELECIMENTO: "Operação, sessões, fila e resultado financeiro das plantas comerciais próprias."
    },
    links: [
      { route: "operations", label: "Operação", capability: "operations:monitor" },
      { route: "sessions", label: "Sessões", capability: "operations:monitor" },
      { route: "queue", label: "Fila", capability: "queue:manage" },
      { route: "finance", label: "Resumo financeiro", capability: "finance:manage" }
    ],
    relatedRoutes: ["session", "financial-session", "invoices"]
  },
  {
    id: "alarms", label: "Central de alarmes", icon: "triangle-alert",
    entryRoute: { GOODWE: "incidents", ESTABELECIMENTO: "incidents" },
    description: {
      GOODWE: "Alarmes técnicos e impacto comercial dentro da responsabilidade atribuída.",
      ESTABELECIMENTO: "Ocorrências técnicas e comerciais das plantas autorizadas."
    },
    links: [
      { route: "incidents", label: "Alarmes e ocorrências", capability: "alarms:view" },
      { route: "recommendations", label: "Recomendações", capability: "intelligence:read" }
    ],
    relatedRoutes: ["incident"]
  },
  {
    id: "reports", label: "Central de relatórios", icon: "file-chart-column",
    entryRoute: { GOODWE: "reports", ESTABELECIMENTO: "reports" },
    description: {
      GOODWE: "Geração e exportação de relatórios limitadas ao escopo autorizado.",
      ESTABELECIMENTO: "Relatórios SEMS+ e exportações ChargeGrid disponíveis para suas plantas."
    },
    links: [{ route: "reports", label: "Central de relatórios", capability: "reports:generate" }]
  },
  {
    id: "analysis", label: "Ferramentas de análise", icon: "chart-no-axes-combined",
    entryRoute: { GOODWE: "analysis-iv", ESTABELECIMENTO: "analysis-iv" },
    description: {
      GOODWE: "Análise técnica SEMS+ e evidências comerciais adequadas à responsabilidade.",
      ESTABELECIMENTO: "Diagnósticos técnicos e recomendações para as plantas autorizadas."
    },
    links: [
      { route: "analysis-iv", label: "Diagnóstico IV", capability: "analysis:technical" },
      { route: "analysis-comparison", label: "Comparação de dados", capability: "analysis:technical" },
      { route: "analysis-battery", label: "Consistência da bateria", capability: "analysis:technical" },
      { route: "energy", label: "Energia e demanda", capability: "energy:monitor" },
      { route: "expansion", label: "Oportunidades", capability: "intelligence:portfolio" }
    ]
  },
  {
    id: "service", label: "Centro de serviço", icon: "headphones",
    entryRoute: { GOODWE: "support", ESTABELECIMENTO: "support" },
    description: {
      GOODWE: "Suporte técnico, garantias e chamados do escopo autorizado.",
      ESTABELECIMENTO: "Conteúdo técnico e atendimento das suas plantas e equipamentos."
    },
    links: [{ route: "support", label: "Centro de serviço", capability: "service:view" }],
    relatedRoutes: ["ticket"]
  },
  {
    id: "organization", label: "Gestão da organização", icon: "settings",
    entryRoute: { GOODWE: "access", ESTABELECIMENTO: "access" },
    description: {
      GOODWE: "Conta SEMS+, responsabilidades ChargeGrid e escopos permanecem separados.",
      ESTABELECIMENTO: "Preferências organizacionais e acessos comerciais autorizados."
    },
    links: [
      { route: "access", label: "Organização e usuários", capability: "organization:view" },
      { route: "plant-onboarding", label: "Ativação de planta", capability: "commercial:activate" },
      { route: "contracts", label: "Contratos e ativações", capability: "commercial:read" },
      { route: "pricing", label: "Política tarifária", capability: "finance:manage" },
      { route: "audit", label: "Auditoria", capability: "governance:audit" }
    ],
    relatedRoutes: ["settings", "contract"]
  }
];

export function getAdminDomainForRoute(route: string) {
  return ADMIN_DOMAINS.find((domain) => domain.links.some((link) => link.route === route) || domain.relatedRoutes?.includes(route));
}

export function getAdminContextLinks(domain: AdminDomain, subject: Profile | Account) {
  return domain.links.filter((link) => hasAdminCapability(subject, link.capability));
}

export function getAdminEntryRoute(domain: AdminDomain, subject: Profile | Account) {
  const profile = typeof subject === "string" ? subject : subject.profile;
  const preferred = domain.entryRoute[profile];
  if (typeof subject === "string") return preferred;
  const preferredLink = domain.links.find((item) => item.route === preferred);
  if (!preferredLink || hasAdminCapability(subject, preferredLink.capability)) return preferred;
  return getAdminContextLinks(domain, subject)[0]?.route ?? "overview";
}

export function getAdminRouteCapability(route: string): AdminCapability | undefined {
  const direct = ADMIN_DOMAINS.flatMap((domain) => domain.links).find((item) => item.route === route)?.capability;
  if (direct) return direct;
  const related: Record<string, AdminCapability> = {
    plant: "network:assets", client: "network:portfolio", establishments: "network:portfolio",
    establishment: "network:portfolio", locations: "network:assets", location: "network:assets",
    charger: "network:assets", session: "operations:monitor", incident: "alarms:view", ticket: "service:view",
    "financial-session": "finance:manage", finance: "finance:manage", pricing: "finance:manage",
    invoices: "finance:manage", contract: "commercial:read", settings: "organization:view"
  };
  return related[route];
}
