import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDriverApp, type DriverNotification } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { PageIntro, PrimaryButton, SecondaryButton } from "../components/Ui";
import { getBrowserNotificationPermission, requestBrowserNotificationPermission, type BrowserNotificationPermission } from "../services/browserNotifications";

const RECENT_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

function NotificationList({ items }: { items: readonly DriverNotification[] }) {
  const formatter = useMemo(() => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }), []);
  return <section className="notification-list">{items.map((item) => <Link to={item.url} key={item.id} className="notification-item"><span className="notification-icon"><AppIcon name="bell" /></span><div><strong>{item.title}</strong><p>{item.body}</p><small>{formatter.format(new Date(item.createdAt))}</small></div><AppIcon name="chevron-right" size={18} /></Link>)}</section>;
}

export function NotificationsPage() {
  const { addNotification, notifications, markNotificationsRead } = useDriverApp();
  const [permission, setPermission] = useState<BrowserNotificationPermission>(getBrowserNotificationPermission);
  const [showOlder, setShowOlder] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => markNotificationsRead(), [markNotificationsRead]);

  const threshold = Date.now() - RECENT_PERIOD_MS;
  const recentNotifications = notifications.filter((item) => new Date(item.createdAt).getTime() >= threshold);
  const olderNotifications = notifications.filter((item) => new Date(item.createdAt).getTime() < threshold);

  async function enableNotifications() {
    setError("");
    const nextPermission = await requestBrowserNotificationPermission();
    setPermission(nextPermission);
    if (nextPermission === "granted") addNotification("Notificações ativadas", "Você receberá alertas importantes da sua jornada.");
    if (nextPermission === "denied") setError("A permissão foi negada. Você pode reativá-la nas configurações do navegador.");
    if (nextPermission === "unsupported") setError("Este navegador não oferece notificações para o aplicativo.");
  }

  return <>
    <PageIntro eyebrow="Últimos sete dias" title="Notificações"><p>Avisos recentes de fila, pagamento, energia e ociosidade ficam reunidos aqui.</p></PageIntro>
    <section className={`notification-permission permission-${permission}`}><span><AppIcon name="bell" size={27} /></span><div><strong>{permission === "granted" ? "Avisos do navegador ativos" : permission === "denied" ? "Avisos bloqueados" : "Ative os avisos do navegador"}</strong><p>{permission === "granted" ? "O aplicativo pode exibir alertas importantes durante sua jornada." : "Permita os avisos para acompanhar chamados da fila e o término da recarga."}</p></div>{permission !== "granted" && permission !== "unsupported" ? <PrimaryButton onClick={enableNotifications}>Ativar notificações</PrimaryButton> : null}</section>
    {error ? <p className="form-error" role="alert">{error}</p> : null}

    {recentNotifications.length ? <><div className="list-section-heading"><h2>Recentes</h2><span>{recentNotifications.length}</span></div><NotificationList items={recentNotifications} /></> : <section className="empty-inline tall"><span><AppIcon name="bell" size={30} /></span><strong>Tudo tranquilo por aqui</strong><p>Pagamento, fila, início, término e devolução aparecerão neste espaço.</p></section>}

    {olderNotifications.length ? <section className="older-notifications"><SecondaryButton aria-expanded={showOlder} onClick={() => setShowOlder((current) => !current)}>{showOlder ? "Ocultar anteriores" : `Ver anteriores (${olderNotifications.length})`}</SecondaryButton>{showOlder ? <><div className="list-section-heading"><h2>Anteriores</h2><span>{olderNotifications.length}</span></div><NotificationList items={olderNotifications} /></> : null}</section> : null}
  </>;
}
