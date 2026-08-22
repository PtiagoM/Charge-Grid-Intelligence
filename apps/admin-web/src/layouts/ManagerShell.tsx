import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, BadgeDollarSign, BrainCircuit, createIcons, LayoutDashboard, LogOut,
  MapPinned, Settings, Zap
} from "lucide";
import { assets } from "../constants/assets";
import { useAdminState } from "../app/AdminState";
import { ADMIN_DOMAINS, getAdminContextLinks, getAdminDomainForRoute, getAdminEntryRoute } from "../app/adminNavigation";

const sidebarIcons = { Activity, BadgeDollarSign, BrainCircuit, LayoutDashboard, LogOut, MapPinned, Settings, Zap };

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
  const scopedSearch = selectedEstablishmentId ? `?est=${encodeURIComponent(selectedEstablishmentId)}` : "";

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
      <a className="sidebar-logo" href={`#/mvp/overview${scopedSearch}`} aria-label="GoodWe"><img className="logo-collapsed" src={assets.logoCollapsed} alt="GoodWe" /></a>
      <nav className="sidebar-nav" aria-label="Domínios principais">{ADMIN_DOMAINS.map((domain) => <NavLink key={domain.id} to={{ pathname: `/mvp/${getAdminEntryRoute(domain, profile)}`, search: scopedSearch }} className={activeDomain?.id === domain.id ? "sidebar-item is-active" : "sidebar-item"} title={domain.label} aria-label={domain.label}><i className="sidebar-lucide" data-lucide={domain.icon} aria-hidden="true" /><span className="sidebar-tooltip">{domain.label}</span></NavLink>)}</nav>
    </aside>
    <main className="main-area">
      <header className="topbar" data-testid="topbar"><div className="topbar-promo"><img src={assets.icons.solarInfo} alt="" />Hub Comercial ChargeGrid</div><div className="topbar-actions">{account?.profile === "GOODWE" ? <label className="scope-selector"><span>Escopo</span><select aria-label="Escopo operacional" value={selectedEstablishmentId} onChange={(event) => changeScope(event.target.value)}><option value="">Toda a rede</option>{state.establishments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}<span className="profile-chip">{account?.profile}</span><span className="profile-name">{account?.displayName}</span><img className="avatar" src={assets.avatar} alt="Perfil" /><a className="topbar-account-action" href="#/mvp/settings" aria-label="Configuracoes"><i data-lucide="settings" /></a><a className="topbar-account-action is-logout" href="#/logout" aria-label="Sair do sistema"><i data-lucide="log-out" /></a></div></header>
      <section className="page-content" data-testid="page-content"><header className="page-heading"><div><span className="page-heading-eyebrow">ChargeGrid Intelligence · {profile === "GOODWE" ? "GoodWe" : "Estabelecimento"}</span><h1>{activeDomain?.label ?? "Configurações"}</h1><p>{activeDomain?.description[profile] ?? "Preferências da conta e controles de acesso do ambiente administrativo."}</p><small>Dados atualizados em 22/08/2026, 06:39:38</small></div></header>{activeDomain ? <nav className="context-navigation" aria-label={`Navegação de ${activeDomain.label}`}>{getAdminContextLinks(activeDomain, profile).map((item) => <NavLink key={item.route} to={{ pathname: `/mvp/${item.route}`, search: scopedSearch }} className={activeRoute === item.route ? "is-active" : ""}>{item.label}</NavLink>)}</nav> : null}{children}</section>
    </main>
    <button type="button" className="assistant-orb-button" aria-label="Assistente ChargeGrid" onClick={() => setAssistantOpen(true)}><img src={assets.assistant} alt="" /><span className="assistant-orb-eye" /></button>
    {assistantOpen ? <AssistantDrawer onClose={() => setAssistantOpen(false)} /> : null}
  </div>;
}
