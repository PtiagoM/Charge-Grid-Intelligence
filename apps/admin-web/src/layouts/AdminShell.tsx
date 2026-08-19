import { NavLink, Outlet } from "react-router-dom";

export function AdminShell() {
  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="Navegação administrativa">
        <div className="brand-mark" aria-label="ChargeGrid Intelligence">CG</div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span aria-hidden="true">⌂</span>
            <span>Visão inicial</span>
          </NavLink>
        </nav>
        <p className="sidebar-note">Baseline MVP</p>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>Admin Web</span>
          <span className="simulation-label">Dados sintéticos · D0</span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
