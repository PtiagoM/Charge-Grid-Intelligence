import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { assets } from "../constants/assets";

const flowPrefixes = ["/qr", "/scan", "/checkout", "/queue", "/session", "/receipt", "/login", "/signup"];

function routeTitle(pathname: string) {
  if (pathname.startsWith("/place")) return "Detalhes";
  if (pathname.startsWith("/qr")) return "Acesso por QR";
  if (pathname.startsWith("/scan")) return "Escanear QR";
  if (pathname.startsWith("/checkout")) return "Pagamento";
  if (pathname.startsWith("/queue")) return "Sua fila";
  if (pathname.startsWith("/session")) return "Sua sessão";
  if (pathname.startsWith("/receipt")) return "Comprovante";
  if (pathname.startsWith("/history")) return "Histórico";
  if (pathname.startsWith("/account")) return "Sua conta";
  if (pathname.startsWith("/notifications")) return "Notificações";
  if (pathname.startsWith("/login")) return "Entrar";
  if (pathname.startsWith("/signup")) return "Criar conta";
  if (pathname.startsWith("/explore")) return "Explorar";
  return "ChargeGrid";
}

export function MobileShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isOnline, notifications, selectedEstablishmentId, session, setTheme, theme } = useDriverApp();
  const isFlow = location.pathname === "/" || flowPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const showBack = location.pathname !== "/" && location.pathname !== "/explore";
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="mobile-shell">
      <header className="mobile-header">
        {showBack ? (
          <button type="button" className="icon-button header-back" aria-label="Voltar" onClick={() => navigate(-1)}>
            <AppIcon name="arrow-left" />
          </button>
        ) : (
          <div className="mobile-logo"><img src={assets.logoCompact} alt="GoodWe" /></div>
        )}
        <div className="header-title"><strong>{routeTitle(location.pathname)}</strong><small>ChargeGrid · Motorista</small></div>
        <div className="header-actions">
          <button type="button" className="icon-button theme-button" aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <AppIcon name={theme === "light" ? "moon" : "sun"} size={21} />
          </button>
          {!isFlow && isAuthenticated ? (
            <button type="button" className="icon-button notification-button" aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`} onClick={() => navigate("/notifications")}>
              <AppIcon name="bell" />
              {unreadCount ? <span>{Math.min(unreadCount, 9)}</span> : null}
            </button>
          ) : null}
        </div>
      </header>
      {!isOnline ? <div className="offline-banner" role="status"><AppIcon name="wifi-off" size={18} /> Você está offline. Novas autorizações estão indisponíveis.</div> : null}
      <main className="mobile-content"><Outlet /></main>
      {!isFlow && isAuthenticated ? <nav className="bottom-nav" aria-label="Navegação do motorista">
        <NavLink to="/explore"><img src={assets.icons.explore} alt="" /><strong>Explorar</strong></NavLink>
        <NavLink to={session ? "/session" : `/place/${selectedEstablishmentId}`}><img src={assets.icons.session} alt="" /><strong>Sessão</strong></NavLink>
        <NavLink to="/history"><img src={assets.icons.history} alt="" /><strong>Histórico</strong></NavLink>
        <NavLink to="/account"><img src={assets.icons.account} alt="" /><strong>Conta</strong></NavLink>
      </nav> : null}
    </div>
  );
}
