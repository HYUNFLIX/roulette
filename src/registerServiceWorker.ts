export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Dynamically determine base path from current location
      const basePath = window.location.pathname.replace(/\/[^/]*$/, '') || '';
      const swUrl = `${window.location.origin}${basePath}/service-worker.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => console.log('service worker registered', reg.scope))
        .catch((err) => console.error('service worker registration failed', err));
    });
  }
}
