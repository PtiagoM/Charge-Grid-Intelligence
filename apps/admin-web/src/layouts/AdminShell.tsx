import { NavLink, Outlet } from "react-router-dom";

const navItems: readonly { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: "/", label: "Visão geral", icon: "/assets/sems/icons/icon_backstage_over.6f515874.png", end: true },
  { to: "/plants", label: "Plantas", icon: "/assets/sems/icons/icon_station_over.fd7f2df2.png" },
  { to: "/chargers", label: "Carregadores", icon: "/assets/sems/icons/icon_device.ad71c9b2.png" },
  { to: "/sessions", label: "Sessões", icon: "/assets/sems/icons/icon_analysis.fd7d7adf.png" },
  { to: "/energy", label: "Energia", icon: "/assets/sems/icons/opt_collect.f1b9ab43.png" },
  { to: "/financial", label: "Relatórios", icon: "/assets/sems/icons/icon_reports.3ff95c2c.png" }
];

export function AdminShell() {
  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="Navegação administrativa">
        <a className="brand-mark" href="/" aria-label="ChargeGrid Intelligence">
          <img src="/assets/sems/logos/goodwe_logo_w.e0d65374.png" alt="GoodWe" />
        </a>
        <nav>
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end === true} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <img src={item.icon} alt="" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>)}
        </nav>
        <button className="sidebar-action" type="button" aria-label="Abrir configurações de demonstração"><img src="/assets/sems/icons/icon_setting.6ecae33c.png" alt="" /></button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-breadcrumb"><strong>SEMS+</strong><span>/</span><span>ChargeGrid Intelligence</span></div>
          <div className="topbar-actions"><span className="simulation-label">Demo · D0</span><button className="account-button" type="button" aria-label="Conta GoodWe Admin">GW</button></div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
