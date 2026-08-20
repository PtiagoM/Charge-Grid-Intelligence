import { NavLink, Outlet } from "react-router-dom";

export function MobileShell() {
  return (
    <div className="mobile-shell">
      <header className="mobile-header">
        <div className="mobile-logo"><img src="/assets/sems/logos/goodwe_logo_w.e0d65374.png" alt="GoodWe" /></div>
        <div><strong>ChargeGrid</strong><small>Intelligence</small></div>
        <span className="demo-pill">Demo D0</span>
      </header>
      <main className="mobile-content"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Navegação do motorista">
        <NavLink to="/" end><img src="/assets/sems/icons/icon_station_over.fd7f2df2.png" alt="" /><strong>Explorar</strong></NavLink>
        <span className="nav-placeholder"><img src="/assets/sems/icons/icon_device.ad71c9b2.png" alt="" /><strong>Sessão</strong></span>
        <span className="nav-placeholder"><img src="/assets/sems/icons/icon_reports.3ff95c2c.png" alt="" /><strong>Histórico</strong></span>
        <span className="nav-placeholder"><img src="/assets/sems/icons/icon_services.f837f7f1.png" alt="" /><strong>Conta</strong></span>
      </nav>
    </div>
  );
}
