/* Retired: HBStats now runs at the site root with accounts. Clear this club's old offline copy and step aside. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('hbstats-triana-fem-')).map((n) => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(new URL('../', self.registration.scope).href));
  })());
});
