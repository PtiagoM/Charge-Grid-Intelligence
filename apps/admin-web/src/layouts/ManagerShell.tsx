import { useEffect, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { assets } from "../constants/assets";
import { useAdminState } from "../app/AdminState";
import { getAdminContextLinks, getAdminDomainForRoute } from "../app/adminNavigation";
import { hasAdminCapability, type AdminCapability } from "../domain/adminCapabilities";
import { hasOwnChargeGridOperation } from "../domain/accessOperations";
import { canUseHardwareLab, hardwareLabEnabled } from "../services/hardwareLabAccess";

interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  capability: AdminCapability;
  activeRoutes: readonly string[];
}

const semsNavigation: readonly NavigationItem[] = [
  { label: "Painel", route: "overview", icon: assets.icons.dashboard, capability: "overview:view", activeRoutes: ["overview"] },
  { label: "Lista de usinas", route: "plants", icon: assets.icons.plants, capability: "network:assets", activeRoutes: ["plants", "plant", "clients", "client", "establishments", "establishment", "locations", "location"] },
  { label: "Lista de dispositivos", route: "chargers", icon: assets.icons.devices, capability: "network:assets", activeRoutes: ["chargers", "charger"] },
  { label: "Central de alarmes", route: "incidents", icon: assets.icons.alarms, capability: "alarms:view", activeRoutes: ["incidents", "incident", "recommendations"] },
  { label: "Central de relatórios", route: "reports", icon: assets.icons.reports, capability: "reports:generate", activeRoutes: ["reports"] },
  { label: "Ferramentas de análise", route: "analysis-iv", icon: assets.icons.analysis, capability: "analysis:technical", activeRoutes: ["analysis-iv", "analysis-comparison", "analysis-battery", "energy", "expansion"] },
  { label: "Centro de serviço", route: "support", icon: assets.icons.services, capability: "service:view", activeRoutes: ["support", "ticket"] }
];

const chargeGridNavigation: NavigationItem = {
  label: "ChargeGrid",
  route: "operations",
  icon: assets.icons.chargeGrid,
  capability: "operations:monitor",
  activeRoutes: ["operations", "sessions", "session", "queue", "finance", "invoices", "financial-session"]
};

const organizationRoutes = new Set(["access", "settings", "audit", "contracts", "contract", "plant-onboarding", "pricing"]);
const routeTitles: Record<string, string> = {
  admin: "Laboratório de hardware",
  "analysis-iv": "Diagnóstico IV",
  "analysis-comparison": "Comparação de dados",
  "analysis-battery": "Consistência da bateria",
  access: "Gestão da organização",
  settings: "Gestão da organização"
};
const semsStandaloneRoutes = new Set(["admin", "plants", "locations", "chargers", "charger", "incidents", "reports", "support", "analysis-iv", "analysis-comparison", "analysis-battery", "access", "settings"]);

const roleLabels = {
  GOODWE_CENTRAL: "Central GoodWe",
  GOODWE_PORTFOLIO_MANAGER: "Gestor de carteira",
  GOODWE_TECH_SUPPORT: "Técnico / suporte",
  GOODWE_ADMIN: "Central GoodWe",
  ESTABLISHMENT_ADMIN: "Proprietário comercial",
  ESTABLISHMENT_OPERATOR: "Operador comercial",
  REPORT_VIEWER: "Financeiro e relatórios"
} as const;

export function ManagerShell({ children }: { children: ReactNode }) {
  const { account, state, commercialSync } = useAdminState();
  const location = useLocation();
  const activeRoute = location.pathname === "/admin" ? "admin" : location.pathname.split("/")[2] ?? "overview";
  const activeContextRoute = activeRoute === "session" ? "sessions" : activeRoute === "financial-session" ? "finance" : activeRoute;
  const activeDomain = getAdminDomainForRoute(activeRoute);
  const selectedEstablishmentId = new URLSearchParams(location.search).get("est") ?? "";
  const contextSearch = selectedEstablishmentId ? `?est=${encodeURIComponent(selectedEstablishmentId)}` : "";
  const profile = account?.profile ?? "ESTABELECIMENTO";
  const ownsChargeGridOperation = hasOwnChargeGridOperation(state, account);
  const primaryNavigation = ownsChargeGridOperation
    ? [...semsNavigation.slice(0, 3), chargeGridNavigation, ...semsNavigation.slice(3)]
    : semsNavigation;
  const visibleNavigation = account ? primaryNavigation.filter((item) => hasAdminCapability(account, item.capability)) : [];
  const isStandaloneRoute = semsStandaloneRoutes.has(activeRoute);
  const contextLinks = account && activeDomain ? getAdminContextLinks(activeDomain, account) : [];

  useEffect(() => { document.body.className = "layout-desktop"; }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector(".page-content")?.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  return <div className="app-shell desktop-shell" data-testid="desktop-shell">
    <aside className="sidebar" data-testid="sidebar">
      <a className="sidebar-logo" href="#/mvp/overview" aria-label="GoodWe SEMS+"><img className="logo-expanded" src={assets.logo} alt="GoodWe" /><small>SEMS+ · CHARGEGRID</small></a>
      <nav className="sidebar-nav" aria-label="Navegação principal">{visibleNavigation.map((item) => {
        const isActive = item.activeRoutes.includes(activeRoute);
        return <div className="sidebar-nav-group" key={item.label}><NavLink to={`/mvp/${item.route}`} className={isActive ? "sidebar-item is-active" : "sidebar-item"} title={item.label}><img src={item.icon} alt="" /><span className="sidebar-tooltip">{item.label}</span></NavLink></div>;
      })}</nav>
      {account && hasAdminCapability(account, "organization:view") ? <footer className="sidebar-footer"><NavLink to="/mvp/access" className={organizationRoutes.has(activeRoute) ? "sidebar-item is-active" : "sidebar-item"}><img src={assets.icons.setting} alt="" /><span className="sidebar-tooltip">Gestão da organização</span></NavLink></footer> : null}
    </aside>
    <main className="main-area">
      <header className="topbar" data-testid="topbar"><div className="topbar-spacer" />{commercialSync.status !== "SYNCED" ? <span className="api-sync-warning" role="status" title={commercialSync.error ?? undefined}>{commercialSync.status === "STALE" ? `API indisponível · última leitura ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(commercialSync.lastUpdatedAt!))}` : commercialSync.status === "LOADING" ? "Sincronizando dados comerciais…" : "API indisponível · dados comerciais não confirmados"}</span> : null}<div className="topbar-actions">
        {hardwareLabEnabled && canUseHardwareLab(account) ? <NavLink className="ghost-button" to="/admin">Laboratório de hardware</NavLink> : null}
        <a className="topbar-icon-button" href="#/mvp/incidents" aria-label="Alarmes"><img src={assets.icons.alarms} alt="" /></a>
        {account ? <details className="topbar-account-menu"><summary><span className="profile-name">{account.displayName}</span><img className="avatar" src={assets.avatar} alt="" /></summary><div><strong>{account.displayName}</strong><span>{account.semsAccountType === "DISTRIBUTOR_INSTALLER" ? "Distribuidor / Instalador" : "Proprietário"}</span><span>{account.role ? roleLabels[account.role] : "Somente SEMS+"}</span>{hasAdminCapability(account, "organization:view") ? <a href="#/mvp/access">Configurações da organização</a> : null}<a href="#/logout">Sair do sistema</a></div></details> : null}
      </div></header>
      <section className="page-content" data-testid="page-content">
        {activeRoute !== "charger" ? <header className="page-heading"><div><h1>{routeTitles[activeRoute] ?? visibleNavigation.find((item) => item.activeRoutes.includes(activeRoute))?.label ?? activeDomain?.label ?? "Configurações"}</h1>{activeRoute === "overview" ? <small>Dados técnicos e comerciais do escopo autorizado.</small> : !isStandaloneRoute ? <p>{activeDomain?.description[profile] ?? "Preferências da conta e controles de acesso."}</p> : null}</div></header> : null}
        {activeRoute !== "overview" && activeRoute !== "charger" && activeRoute !== "access" && activeDomain && account && contextLinks.length > 1 ? <nav className={activeDomain.id === "chargegrid" ? "context-navigation sems-device-type-tabs chargegrid-context-navigation" : "context-navigation"} aria-label={`Navegação de ${activeDomain.label}`} role={activeDomain.id === "chargegrid" ? "tablist" : undefined}>{contextLinks.map((item) => <NavLink key={item.route} to={{ pathname: `/mvp/${item.route}`, search: contextSearch }} className={activeContextRoute === item.route ? "is-active" : ""} role={activeDomain.id === "chargegrid" ? "tab" : undefined} aria-selected={activeDomain.id === "chargegrid" ? activeContextRoute === item.route : undefined}>{item.label}</NavLink>)}</nav> : null}
        {children}
      </section>
    </main>
  </div>;
}
