import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { QueueStatus } from "@chargegrid/shared";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { assets } from "../constants/assets";

const accountEntryExclusions = ["/", "/login", "/signup"];

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
  const { isAuthenticated, isOnline, notifications, queue, selectedEstablishmentId, session, setTheme, theme } = useDriverApp();
  const hasAccountNavigation = isAuthenticated && !accountEntryExclusions.includes(location.pathname);
  const showBack = location.pathname !== "/" && location.pathname !== "/explore";
  const unreadCount = notifications.filter((item) => !item.read).length;

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(isAuthenticated ? "/explore" : "/", { replace: true });
  }

  return (
    <div className={`mobile-shell${hasAccountNavigation ? " has-account-navigation" : ""}`}>
      <header className="mobile-header">
        {showBack ? (
          <button type="button" className="icon-button header-back" aria-label="Voltar" onClick={goBack}>
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
          {hasAccountNavigation ? (
            <button type="button" className="icon-button notification-button" aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`} onClick={() => navigate("/notifications")}>
              <AppIcon name="bell" />
              {unreadCount ? <span>{Math.min(unreadCount, 9)}</span> : null}
            </button>
          ) : null}
        </div>
      </header>
      {!isOnline ? <div className="offline-banner" role="status"><AppIcon name="wifi-off" size={18} /> Você está offline. Novas autorizações estão indisponíveis.</div> : null}
      {isAuthenticated && queue && !location.pathname.startsWith("/queue") ? <button type="button" className={`active-queue-banner${queue.status === QueueStatus.CALLED ? " is-called" : ""}`} onClick={() => navigate("/queue")}>
        <AppIcon name="clock" size={19} /><span><strong>{queue.status === QueueStatus.CALLED ? "Sua vaga está disponível" : `Você está na fila · posição #${queue.position}`}</strong><small>{queue.status === QueueStatus.CALLED ? "Toque para ver o carregador atribuído" : `${queue.establishmentName} · acompanhe a qualquer momento`}</small></span><AppIcon name="chevron-right" size={18} />
      </button> : null}
      <main className="mobile-content"><Outlet /></main>
      {hasAccountNavigation ? <nav className="bottom-nav" aria-label="Navegação do motorista">
        <NavLink to="/explore"><img src={assets.icons.explore} alt="" /><strong>Explorar</strong></NavLink>
        <NavLink to={session ? "/session" : `/place/${selectedEstablishmentId}`} className={({ isActive }) => isActive || location.pathname.startsWith("/place/") ? "active" : undefined}><img src={assets.icons.session} alt="" /><strong>Sessão</strong></NavLink>
        <NavLink to="/history"><img src={assets.icons.history} alt="" /><strong>Histórico</strong></NavLink>
        <NavLink to="/account"><img src={assets.icons.account} alt="" /><strong>Conta</strong></NavLink>
      </nav> : null}
    </div>
  );
}
