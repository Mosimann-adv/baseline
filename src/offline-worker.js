/* Só arquivos públicos da interface. Nunca intercepta Supabase, YouTube ou POSTs. */
const CACHE = 'baseline-app-__CACHE_VERSION__';
const scoped = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const response = await fetch(scoped('offline-assets.json'), { cache: 'no-store' });
    if (!response.ok) throw new Error('Manifesto offline indisponível');
    const assets = await response.json();
    const cache = await caches.open(CACHE);
    await cache.addAll(assets.map(scoped));
    // A nova versão espera as abas antigas fecharem: não mistura chunks durante um treino.
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('baseline-app-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Um service worker de uma demo não toma conta do HTML do build de outro modo.
        const response = await fetch(request, { signal: AbortSignal.timeout(5000) });
        if (response.ok) return response;
      } catch { /* O shell já foi pré-carregado na instalação. */ }
      return (await caches.open(CACHE)).match(scoped('index.html'), { ignoreVary: true });
    })());
  } else if (/\/(assets|icons)\//.test(url.pathname) || /\/(hero\.webp|pix-qr\.png)$/.test(url.pathname)) {
    // Servidores estáticos podem variar o header CORS por Origin. O conteúdo destes
    // arquivos públicos e versionados é o mesmo; o Vary não pode impedir a leitura offline.
    event.respondWith((async () => (await (await caches.open(CACHE)).match(request, { ignoreVary: true })) ?? fetch(request))());
  }
});
