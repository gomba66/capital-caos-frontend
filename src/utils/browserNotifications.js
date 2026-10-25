export function getBrowserNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.requestPermission();
}

export function showBrowserNotification({ title, body, tag }) {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted" ||
    document.visibilityState === "visible"
  ) {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      tag,
      silent: true,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (error) {
    console.warn("Could not show browser notification:", error);
    return false;
  }
}
