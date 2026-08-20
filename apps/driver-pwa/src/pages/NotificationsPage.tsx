import { useEffect, useState } from "react";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { PageIntro, PrimaryButton } from "../components/Ui";
import { getBrowserNotificationPermission, requestBrowserNotificationPermission, type BrowserNotificationPermission } from "../services/browserNotifications";

export function NotificationsPage() {
  const { addNotification, notifications, markNotificationsRead } = useDriverApp();
  const [permission, setPermission] = useState<BrowserNotificationPermission>(getBrowserNotificationPermission);
  const [error, setError] = useState("");
  useEffect(() => markNotificationsRead(), [markNotificationsRead]);

  async function enableNotifications() {
    setError("");
    const nextPermission = await requestBrowserNotificationPermission();
    setPermission(nextPermission);
    if (nextPermission === "granted") addNotification("Notificações ativadas", "Você receberá alertas importantes da sua jornada.");
    if (nextPermission === "denied") setError("A permissão foi negada. Você pode reativá-la nas configurações do navegador.");
    if (nextPermission === "unsupported") setError("Este navegador não oferece notificações para o aplicativo.");
  }

  return <>
    <PageIntro eyebrow="Eventos da sua jornada" title="Notificações"><p>Avisos de fila, pagamento, energia e ociosidade ficam disponíveis no aplicativo e no navegador.</p></PageIntro>
    <section className={`notification-permission permission-${permission}`}><span><AppIcon name="bell" size={27} /></span><div><strong>{permission === "granted" ? "Avisos do navegador ativos" : permission === "denied" ? "Avisos bloqueados" : "Ative os avisos do navegador"}</strong><p>{permission === "granted" ? "O service worker está pronto para exibir alertas mesmo fora desta tela." : "Permita os avisos para acompanhar chamados da fila e o término da recarga."}</p></div>{permission !== "granted" && permission !== "unsupported" ? <PrimaryButton onClick={enableNotifications}>Ativar notificações</PrimaryButton> : null}</section>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {notifications.length ? <section className="notification-list">{notifications.map((item) => <article key={item.id}><span className="notification-icon"><AppIcon name="bell" /></span><div><strong>{item.title}</strong><p>{item.body}</p><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</small></div></article>)}</section> : <section className="empty-inline tall"><span><AppIcon name="bell" size={30} /></span><strong>Tudo tranquilo por aqui</strong><p>Pagamento, fila, início, término e devolução aparecerão neste espaço.</p></section>}
  </>;
}
