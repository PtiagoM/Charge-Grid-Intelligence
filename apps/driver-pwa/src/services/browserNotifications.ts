export type BrowserNotificationPermission = NotificationPermission | "unsupported";

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  return "Notification" in window ? Notification.permission : "unsupported";
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

export async function showBrowserNotification(title: string, body: string, url = "/notifications") {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  const options: NotificationOptions = {
    body,
    icon: "/chargegrid-mark.svg",
    badge: "/chargegrid-mark.svg",
    tag: `chargegrid-${title.toLocaleLowerCase("pt-BR").replace(/\s+/g, "-")}`,
    data: { url }
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
    return true;
  }

  const notification = new Notification(title, options);
  notification.onclick = () => {
    window.focus();
    window.location.assign(url);
  };
  return true;
}
