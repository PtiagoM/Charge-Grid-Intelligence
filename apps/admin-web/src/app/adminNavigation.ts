import type { Profile } from "../domain/admin";
import { hasAdminCapability, type AdminCapability } from "../domain/adminCapabilities";

export type AdminDomainId = "overview" | "network" | "operations" | "energy" | "commercial" | "intelligence";

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
    id: "overview",
    label: "Visão geral",
    icon: "layout-dashboard",
    entryRoute: { GOODWE: "overview", ESTABELECIMENTO: "overview" },
    description: {
      GOODWE: "Saúde da rede, alertas e prioridades comerciais em uma leitura executiva.",
      ESTABELECIMENTO: "Situação dos seus pontos, carregadores, sessões e demanda em um só lugar."
    },
    links: [{ route: "overview", label: "Resumo", capability: "overview:view" }]
  },
  {
    id: "network",
    label: "Rede",
    icon: "map-pinned",
    entryRoute: { GOODWE: "clients", ESTABELECIMENTO: "locations" },
    description: {
      GOODWE: "Estrutura comercial do cliente até os pontos e equipamentos vinculados.",
      ESTABELECIMENTO: "Pontos de recarga e equipamentos atribuídos ao seu estabelecimento."
    },
    links: [
      { route: "clients", label: "Clientes", capability: "network:portfolio" },
      { route: "establishments", label: "Estabelecimentos", capability: "network:portfolio" },
      { route: "locations", label: "Pontos de recarga", capability: "network:assets" },
      { route: "chargers", label: "Carregadores", capability: "network:assets" },
      { route: "plants", label: "Plantas e onboarding", capability: "network:onboard" }
    ],
    relatedRoutes: ["client", "new-client", "establishment", "location", "new-location", "charger", "plant", "plant-onboarding", "installations"]
  },
  {
    id: "operations",
    label: "Operação",
    icon: "activity",
    entryRoute: { GOODWE: "operations", ESTABELECIMENTO: "operations" },
    description: {
      GOODWE: "Disponibilidade, sessões, filas e incidentes que exigem atuação da operação.",
      ESTABELECIMENTO: "Acompanhamento diário das sessões, filas e ocorrências dos seus pontos."
    },
    links: [
      { route: "operations", label: "Central operacional", capability: "operations:monitor" },
      { route: "sessions", label: "Sessões", capability: "operations:monitor" },
      { route: "queue", label: "Fila", capability: "queue:manage" },
      { route: "support", label: "Chamados", capability: "operations:monitor" }
    ],
    relatedRoutes: ["session", "ticket"]
  },
  {
    id: "energy",
    label: "Energia",
    icon: "zap",
    entryRoute: { GOODWE: "energy", ESTABELECIMENTO: "energy" },
    description: {
      GOODWE: "Demanda, margem contratada e impacto energético consolidados por escopo.",
      ESTABELECIMENTO: "Demanda local, margem disponível e sinais para operar com segurança."
    },
    links: [{ route: "energy", label: "Demanda e energia", capability: "energy:monitor" }]
  },
  {
    id: "commercial",
    label: "Comercial",
    icon: "badge-dollar-sign",
    entryRoute: { GOODWE: "finance", ESTABELECIMENTO: "finance" },
    description: {
      GOODWE: "Tarifas, contratos, receita e conciliação da carteira ChargeGrid.",
      ESTABELECIMENTO: "Tarifação, receita, repasses e documentos do seu contrato."
    },
    links: [
      { route: "pricing", label: "Tarifação e pagamentos", capability: "commercial:read" },
      { route: "finance", label: "Financeiro", capability: "commercial:read" },
      { route: "contract", label: "Meu contrato", capability: "commercial:self-service" },
      { route: "documents", label: "Documentos", capability: "commercial:self-service" },
      { route: "contracts", label: "Contratos", capability: "commercial:manage" }
    ],
    relatedRoutes: ["financial-session", "invoices"]
  },
  {
    id: "intelligence",
    label: "Inteligência",
    icon: "brain-circuit",
    entryRoute: { GOODWE: "ai", ESTABELECIMENTO: "ai" },
    description: {
      GOODWE: "Recomendações, relatórios e oportunidades explicadas pelos dados da rede.",
      ESTABELECIMENTO: "Recomendações e relatórios para melhorar a operação do estabelecimento."
    },
    links: [
      { route: "ai", label: "Assistente", capability: "intelligence:read" },
      { route: "reports", label: "Relatórios", capability: "intelligence:read" },
      { route: "expansion", label: "Expansão", capability: "intelligence:portfolio" },
      { route: "audit", label: "Auditoria", capability: "governance:audit" }
    ]
  }
];

export function getAdminDomainForRoute(route: string) {
  return ADMIN_DOMAINS.find((domain) =>
    domain.links.some((link) => link.route === route) || domain.relatedRoutes?.includes(route)
  );
}

export function getAdminContextLinks(domain: AdminDomain, profile: Profile) {
  return domain.links.filter((link) => hasAdminCapability(profile, link.capability));
}

export function getAdminEntryRoute(domain: AdminDomain, profile: Profile) {
  return domain.entryRoute[profile];
}
