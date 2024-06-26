

//self.addEventListener('install', self.skipWaiting)

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', e => e.waitUntil(activated()))
let cache = null
async function activated(){
	const req = new Request('/server/version.js'), [old, [res, nw]] = await Promise.all([
		caches.open('cache').then(c => (cache=c).match(req).then(k => k?.text())),
		fetch(req).then(a=>a.clone().text().then(k=>[a,k])).catch(e=>[null,null])
	])
	if(nw && old !== nw){
		// Update available
		await caches.delete('cache')
		cache = null
		await cache.put(req, res)
	}
}

async function onFetch(req, p){
	let res = await cache?.match(req)
	if(!res){
		res = await fetch(req)
		cache.put(req, res.clone())
	}
	return res
}
self.addEventListener('fetch', e => e.respondWith(cache ? onFetch(e.request, e.preloadResponse) : caches.open('cache').then(c => (cache = c, onFetch(e.request, e.preloadResponse)))))