// Deferred prompt for PWA install
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.disabled = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  if (choiceResult.outcome === 'accepted') {
    console.log('PWA telepítés elfogadva');
  }
  deferredPrompt = null;
  installBtn.disabled = true;
});

// Notification permission and prompt
const notifBtn = document.getElementById('notifBtn');

async function ensureNotifications() {
  if (!('Notification' in window)) {
    alert('A böngésződ nem támogatja az értesítéseket.');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

notifBtn.addEventListener('click', async () => {
  const allowed = await ensureNotifications();
  if (allowed) alert('Értesítések engedélyezve.');
  else alert('Értesítések nem engedélyezve.');
});

// Implementáld itt a Google Calendar szinkron és további funkciókat
