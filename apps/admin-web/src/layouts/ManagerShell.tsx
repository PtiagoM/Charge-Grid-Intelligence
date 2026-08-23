import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  createIcons, LogOut
} from "lucide";
import { assets } from "../constants/assets";
import { useAdminState } from "../app/AdminState";
import { getAdminContextLinks, getAdminDomainForRoute } from "../app/adminNavigation";
import { hasAdminCapability, type AdminCapability } from "../domain/adminCapabilities";

const sidebarIcons = { LogOut };

const semsNavigation: ReadonlyArray<{ label: string; route: string; establishmentRoute?: string; icon: string; capability: AdminCapability; activeRoutes: readonly string[] }> = [
  { label: "Painel", route: "overview", icon: assets.icons.dashboard, capability: "overview:view", activeRoutes: ["overview"] },
  { label: "Lista de usinas", route: "plants", establishmentRoute: "locations", icon: assets.icons.plants, capability: "network:assets", activeRoutes: ["plants", "plant", "plant-onboarding", "installations", "locations", "location", "new-location"] },
  { label: "Lista de dispositivos", route: "chargers", icon: assets.icons.devices, capability: "network:assets", activeRoutes: ["chargers", "charger", "sessions", "session", "operations", "queue"] },
  { label: "Central de alarmes", route: "incidents", icon: assets.icons.alarms, capability: "incidents:manage", activeRoutes: ["incidents", "incident"] },
  { label: "Central de relatórios", route: "reports", icon: assets.icons.reports, capability: "reports:generate", activeRoutes: ["reports"] },
  { label: "Ferramentas de análise", route: "analysis-iv", icon: assets.icons.analysis, capability: "intelligence:read", activeRoutes: ["analysis-iv", "analysis-comparison", "analysis-battery", "ai", "recommendations", "energy", "expansion", "audit"] },
  { label: "Centro de serviço", route: "support", icon: assets.icons.services, capability: "operations:monitor", activeRoutes: ["support", "ticket"] }
];

const analysisLinks = [
  { route: "analysis-iv", label: "Diagnóstico IV" },
  { route: "analysis-comparison", label: "Comparação de dados" },
  { route: "analysis-battery", label: "Consistência da bateria" },
  { route: "ai", label: "Inteligência ChargeGrid" }
] as const;

const routeTitles: Record<string, string> = {
  "analysis-iv": "Diagnóstico IV",
  "analysis-comparison": "Comparação de dados",
  "analysis-battery": "Consistência da bateria"
};

const semsStandaloneRoutes = new Set(["plants", "plant-onboarding", "locations", "chargers", "incidents", "reports", "support", "analysis-iv", "analysis-comparison", "analysis-battery"]);

function AssistantDrawer({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState("Operacao da rede");
  const topics = ["Operacao da rede", "Demanda energetica", "Receita e tarifa", "Expansao comercial"];
  return <div className="goodwe-ai-drawer-layer" data-testid="goodwe-ai-drawer-layer">
    <aside className="goodwe-ai-agent goodwe-ai-drawer" data-testid="goodwe-ai-drawer">
      <header className="goodwe-ai-header"><h2>Agente de IA GoodWe</h2><div className="goodwe-ai-window-actions"><button type="button" onClick={onClose} aria-label="Fechar agente">×</button></div></header>
      <div className="goodwe-ai-intro"><img src={assets.assistant} alt="" /><h3>Como posso apoiar a operacao?</h3><p>Analiso os dados comerciais e energeticos disponiveis nesta demonstracao.</p></div>
      <div className="goodwe-ai-body"><div className="goodwe-ai-topic-list">{topics.map((item) => <button key={item} type="button" className={topic === item ? "is-active" : ""} onClick={() => setTopic(item)}><strong>{item}</strong><span>Leitura deterministica do cenario atual</span></button>)}</div><article className="goodwe-ai-answer"><small>Analise atual</small><h3>{topic}</h3><p>A rede possui margem controlada, fila ativa e oportunidade de priorizar carregadores disponiveis.</p><ul><li>Monitorar o pico entre 18h e 21h.</li><li>Preservar a reserva minima da bateria.</li></ul></article></div>
      <form className="goodwe-ai-compose"><button type="button">Nova conversa</button><input aria-label="Mensagem para o agente" placeholder="Pergunte sobre a operacao" /><button type="submit" aria-label="Enviar">↑</button></form>
    </aside>
  </div>;
}

export function ManagerShell({ children }: { children: ReactNode }) {
  const { account, state } = useAdminState();
  const location = useLocation();
  const navigate = useNavigate();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const activeRoute = location.pathname.split("/")[2] ?? "overview";
  const activeDomain = getAdminDomainForRoute(activeRoute);
  const selectedEstablishmentId = new URLSearchParams(location.search).get("est") ?? "";
  const profile = account?.profile ?? "ESTABELECIMENTO";
  const visibleNavigation = account ? semsNavigation.filter((item) => hasAdminCapability(account, item.capability)) : [];
  const scopedSearch = selectedEstablishmentId ? `?est=${encodeURIComponent(selectedEstablishmentId)}` : "";
  const isStandaloneRoute = semsStandaloneRoutes.has(activeRoute);

  function changeScope(establishmentId: string) {
    const query = new URLSearchParams(location.search);
    ["est", "loc", "charger", "client", "ticket"].forEach((key) => query.delete(key));
    if (establishmentId) query.set("est", establishmentId);
    navigate({ pathname: location.pathname, search: query.toString() });
  }

  useEffect(() => { document.body.className = "layout-desktop"; }, []);
  useEffect(() => { createIcons({ icons: sidebarIcons }); }, [activeRoute, assistantOpen]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector(".page-content")?.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  return <div className="app-shell desktop-shell" data-testid="desktop-shell">
    <aside className="sidebar" data-testid="sidebar">
      <a className="sidebar-logo" href={`#/mvp/overview${scopedSearch}`} aria-label="GoodWe SEMS+"><img className="logo-expanded" src={assets.logo} alt="GoodWe" /><small>SEMS+ · CHARGEGRID</small></a>
      <nav className="sidebar-nav" aria-label="Navegação principal">{visibleNavigation.map((item) => { const route = profile === "GOODWE" ? item.route : (item.establishmentRoute ?? item.route); const isActive = item.activeRoutes.includes(activeRoute); return <div className="sidebar-nav-group" key={item.label}><NavLink to={{ pathname: `/mvp/${route}`, search: scopedSearch }} className={isActive ? "sidebar-item is-active" : "sidebar-item"} title={item.label}><img src={item.icon} alt="" /><span className="sidebar-tooltip">{item.label}</span></NavLink>{item.route === "analysis-iv" && isActive ? <div className="sidebar-subnav">{analysisLinks.map((link) => <NavLink key={link.route} to={{ pathname: `/mvp/${link.route}`, search: scopedSearch }} className={activeRoute === link.route || (link.route === "ai" && activeRoute === "recommendations") ? "is-active" : ""}>{link.label}</NavLink>)}</div> : null}</div>; })}</nav>
      {account && hasAdminCapability(account, "access:manage") ? <footer className="sidebar-footer"><NavLink to="/mvp/access" className={activeRoute === "access" || activeRoute === "settings" ? "sidebar-item is-active" : "sidebar-item"}><img src={assets.icons.setting} alt="" /><span className="sidebar-tooltip">Gestão da organização</span></NavLink></footer> : null}
    </aside>
    <main className="main-area">
      <header className="topbar" data-testid="topbar"><div className="topbar-spacer" /><div className="topbar-actions">{account?.profile === "GOODWE" ? <label className="scope-selector"><span>Escopo</span><select aria-label="Escopo operacional" value={selectedEstablishmentId} onChange={(event) => changeScope(event.target.value)}><option value="">Toda a rede</option>{state.establishments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}<span className="topbar-promo"><img src={assets.icons.solarInfo} alt="" />Hub Solar Insight</span><button className="topbar-icon-button" type="button" aria-label="Pesquisar"><img src={assets.icons.search} alt="" /></button><a className="topbar-icon-button" href="#/mvp/incidents" aria-label="Alarmes"><img src={assets.icons.alarms} alt="" /></a><button className="topbar-icon-button" type="button" aria-label="Mensagens"><img src={assets.icons.message} alt="" /></button><button className="topbar-icon-button" type="button" aria-label="Idioma"><img src={assets.icons.language} alt="" /></button><span className="profile-name">{account?.displayName}</span><img className="avatar" src={assets.avatar} alt="Perfil" /><a className="topbar-account-action is-logout" href="#/logout" aria-label="Sair do sistema"><i data-lucide="log-out" /></a></div></header>
      <section className="page-content" data-testid="page-content"><header className="page-heading"><div><h1>{routeTitles[activeRoute] ?? visibleNavigation.find((item) => item.activeRoutes.includes(activeRoute))?.label ?? activeDomain?.label ?? "Configurações"}</h1>{activeRoute === "overview" ? <small>Atualizado em 22/08/2026, 06:39:38 <button type="button" aria-label="Atualizar painel">↻</button></small> : !isStandaloneRoute ? <p>{activeDomain?.description[profile] ?? "Preferências da conta e controles de acesso."}</p> : null}</div></header>{activeRoute !== "overview" && !isStandaloneRoute && activeDomain && account ? <nav className="context-navigation" aria-label={`Navegação de ${activeDomain.label}`}>{getAdminContextLinks(activeDomain, account).map((item) => <NavLink key={item.route} to={{ pathname: `/mvp/${item.route}`, search: scopedSearch }} className={activeRoute === item.route ? "is-active" : ""}>{item.label}</NavLink>)}</nav> : null}{children}</section>
    </main>
    <button type="button" className="assistant-orb-button" aria-label="Assistente ChargeGrid" onClick={() => setAssistantOpen(true)}><img src={assets.assistant} alt="" /><span className="assistant-orb-eye" /></button>
    {assistantOpen ? <AssistantDrawer onClose={() => setAssistantOpen(false)} /> : null}
  </div>;
}
