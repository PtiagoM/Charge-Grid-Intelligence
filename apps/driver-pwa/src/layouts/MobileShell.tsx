import { NavLink, Outlet } from "react-router-dom";

export function MobileShell() {
  return (
    <div className="mobile-shell">
      <header className="mobile-header">
        <div className="mobile-logo" aria-hidden="true">⚡</div>
        <div><strong>ChargeGrid</strong><small>Intelligence</small></div>
        <span className="demo-pill">Demo D0</span>
      </header>
      <main className="mobile-content"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Navegação do motorista">
        <NavLink to="/" end><span aria-hidden="true">⌖</span><strong>Explorar</strong></NavLink>
        <span className="nav-placeholder"><span aria-hidden="true">⚡</span><strong>Sessão</strong></span>
        <span className="nav-placeholder"><span aria-hidden="true">◷</span><strong>Histórico</strong></span>
        <span className="nav-placeholder"><span aria-hidden="true">○</span><strong>Conta</strong></span>
      </nav>
    </div>
  );
}
