export async function requestNotifyPermission() {
  if (!('Notification' in window)) return false
  let perm = Notification.permission
  if (perm === 'default') {
    perm = await Notification.requestPermission()
  }
  return perm === 'granted'
}

export function notify(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try { new Notification(title, options) } catch {}
}
