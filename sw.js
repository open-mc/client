const VERSION = '0.0.0'

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([caches.open('cache')
      .then(async cache => {
				await cache.addAll(['index.html', 'style.css', 'index.js'])
			})
      .then(self.skipWaiting()),
		])
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(names => names.filter(name => name != 'cache-'+VERSION)).then(todelete => Promise.all(todelete.map(name => caches.delete(name)))).then(() => self.clients.claim())))

self.addEventListener('fetch', event => {
	event.respondWith((async function(){
		const cache = await caches.open('cache')
		let res = await cache.match(req)
		if(!res){
			res = await fetch(req)
			cache.put(req, res)
		}
		return res
	})())
})