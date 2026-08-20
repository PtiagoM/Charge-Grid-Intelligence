import { UserRole } from "@chargegrid/shared";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { assets } from "../constants/assets";
import { demoScenarioD0 } from "../services/adminDemo";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const commonItems: readonly NavItem[] = [
  { to: "/chargers", label: "Carregadores", icon: assets.icons.devices },
  { to: "/sessions", label: "Sessões", icon: assets.icons.reports },
  { to: "/energy", label: "Demanda e Energia", icon: assets.icons.solarInfo },
  { to: "/financial", label: "Tarifação e Pagamentos", icon: assets.icons.reports }
];

const routeCopy: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "ChargeGrid Intelligence", subtitle: "A operação comercial conectada ao ecossistema energético GoodWe." },
  "/establishments": { title: "Estabelecimentos", subtitle: "Contas comerciais e plantas SEMS+ vinculadas." },
  "/plants": { title: "Mapa de plantas", subtitle: "Visão operacional das plantas autorizadas para esta conta." },
  "/chargers": { title: "Carregadores", subtitle: "Estado técnico GoodWe e disponibilidade comercial ChargeGrid." },
  "/sessions": { title: "Sessões", subtitle: "Operação comercial, energia confirmada e garantia financeira." },
  "/energy": { title: "Demanda e Energia", subtitle: "Dados SEMS+ normalizados para decisão comercial." },
  "/financial": { title: "Tarifação e Pagamentos", subtitle: "Política comercial, receita, comissão e liquidação." }
};

function formatObservedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

export function AdminShell() {
  const { account, logout } = useAuth();
  const location = useLocation();
  if (!account) return <Navigate to="/login" replace />;

  const roleItems: readonly NavItem[] = account.role === UserRole.GOODWE_ADMIN
    ? [{ to: "/", label: "Visão Geral", icon: assets.icons.analysis }, { to: "/establishments", label: "Estabelecimentos", icon: assets.icons.services }, { to: "/plants", label: "Plantas", icon: assets.icons.plants }, ...commonItems]
    : [{ to: "/", label: "Visão Geral", icon: assets.icons.analysis }, { to: "/plants", label: "Minhas Plantas", icon: assets.icons.plants }, ...commonItems];
  const copy = routeCopy[location.pathname] ?? routeCopy["/"]!;

  return (
    <div className="app-shell desktop-shell" data-testid="desktop-shell">
      <aside className="sidebar" data-testid="sidebar">
        <NavLink className="sidebar-logo" to="/" aria-label="GoodWe"><img className="logo-collapsed" src={assets.logoCollapsed} alt="GoodWe" /><small>SEMS+</small></NavLink>
        <nav className="sidebar-nav">
          {roleItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => isActive ? "sidebar-item is-active" : "sidebar-item"} title={item.label} aria-label={item.label}><img src={item.icon} alt="" /><span className="sidebar-tooltip">{item.label}</span></NavLink>)}
        </nav>
        <div className="sidebar-footer"><button type="button" className="sidebar-item" onClick={logout} title="Sair" aria-label="Sair"><img src={assets.icons.setting} alt="" /><span className="sidebar-tooltip">Sair</span></button></div>
      </aside>
      <main className="main-area">
        <header className="topbar" data-testid="topbar">
          <div className="topbar-promo"><img src={assets.icons.solarInfo} alt="" />Hub Comercial ChargeGrid</div>
          <div className="topbar-actions">
            <button className="topbar-icon-button" type="button" aria-label="Pesquisar"><img src={assets.icons.search} alt="" /></button>
            <button className="topbar-icon-button" type="button" aria-label="Alarmes"><img src={assets.icons.alarms} alt="" /></button>
            <button className="topbar-icon-button" type="button" aria-label="Mensagens"><img src={assets.icons.message} alt="" /></button>
            <button className="topbar-icon-button" type="button" aria-label="Idioma"><img src={assets.icons.language} alt="" /></button>
            <span className="profile-chip">{account.profileLabel}</span><span className="profile-name">{account.displayName}</span><img className="avatar" src={assets.avatar} alt="Perfil" />
          </div>
        </header>
        <section className="page-content">
          <header className="page-heading"><div><h1>{copy.title} {account.role === UserRole.GOODWE_ADMIN ? "GoodWe" : "Estabelecimento"}</h1><p>{copy.subtitle}</p><small>Tempo de atualização de dados: {formatObservedAt(demoScenarioD0.plant.observedAt)}</small></div><div className="page-heading-actions"><button type="button">Atualizar dados</button></div></header>
          <Outlet />
        </section>
      </main>
      <button type="button" className="assistant-orb-button" aria-label="Assistente ChargeGrid"><img src={assets.assistant} alt="" /><span className="assistant-orb-eye" /></button>
    </div>
  );
}
