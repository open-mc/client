// Change this if you feed data from a different repo
const REPO = 'open-mc/client', BRANCH = 'main'
self.addEventListener('fetch', e => {
	let req = e.request.url
	const i = req.indexOf('/')+2, j = req.indexOf('/', i)
	if(req.slice(i,j) != location.host) return
	req = ready == '' ? '/index.html' : req[req.length-1]=='/'?req+'main.html':req
	e.respondWith(ready ? ready.then(() => cache.match(req)) : cache.match(req))
})
self.addEventListener('install', e => e.waitUntil(ready ? ready.then(() => upt) : upt))
let cache, upt = null
let ready = /(\.|^)localhost$|^127.0.0.1$|^\[::1\]$/.test(location.hostname) ? ((cache = globalThis).match = fetch,null)
: (async () => {
	let latest = fetch('https://api.github.com/repos/'+REPO+'/commits/'+BRANCH, {headers: {accept: 'application/vnd.github.VERSION.sha'}}).then(a => a.text(),()=>'{"error":"network"}')
	cache = await caches.open('')
	const ver = await cache.match('https://.git/')
	latest = await latest
	const our = ver?ver.headers.get('commit'):'null'
	if(latest[0] != '{' && our != latest) ready='', upt = update(latest, ver, our)
	else{
		ready = null
		if(!ver) upt = Promise.reject('Install failed')
		for(const l of areListening)l.postMessage(ver?1:-1);areListening.length=0
	}
})()
const areListening = []
self.addEventListener('message', e => {
	if(ready==null) e.source.postMessage(1)
	else areListening.push(e.source)
})
async function update(latest, ver, old){
	const _idx = ver?await ver.text():''
	const hashes = new Map
	if(_idx) for(const e of _idx.split('\n')){
		const i = e.indexOf(' ')
		if(i<0) continue
		hashes.set(e.slice(0, i), e.slice(i+1))
	}
	let u = await caches.open('updates')
	const k = await u.keys()
	let todo = 1, r
	const progress = a => {for(const l of areListening) l.postMessage(a); --todo||r()}
	fetch: {
		if(k.length){
			if(k[k.length-1].url == 'https://.git/') break fetch
			else await caches.delete('updates'),u=await caches.open('updates'),k.length=0
		}
		console.info('Downloading diffs for %s', latest.slice(0,7))
		let res = []
		let total = hashes.size*1.25+1.25, done = 0
		const traverse = (hash, api, url) => fetch(api+hash+'?recursive=true').then(a => a.json()).then(async a => {
			if(a.truncated || !a.tree) return void r(1)
			for(const {path='', type='', sha=''} of a.tree){
				const p = url + path, isBlob = type == 'blob'
				if(!isBlob){ if(type == 'commit'){
					if(hashes.get(p) == sha){ for(const h of hashes.keys()) if(h.startsWith(p)&&h[p.length]=='/') hashes.delete(h)&&(total-=1.25) }
					else todo++, fetch(api.slice(0, -10) + 'contents/' + path).then(a => a.json()).then(({git_url}) => git_url?traverse(sha, git_url.slice(0,-40), p+'/'):r(1))
					hashes.delete(p)&&(total-=1.25); res.push(p+' '+sha)
				} continue }
				res.push(p+' '+sha)
				if(hashes.get(p) == sha){hashes.delete(p);total-=1.25;continue}
				hashes.delete(p)||(total+=1.25); todo++; k.push(p)
				fetch(p).then(res => {
					if(res.redirected) res = new Response(res.body,res)
					return u.put(p, res)
				}).then(() => progress(++done/total), () => r(1))
			}
			--todo||r(0)
		})
		traverse(latest, 'https://api.github.com/repos/'+REPO+'/git/trees/', '/')
		if(await({then:a=>r=a})){
			console.info('Download aborted!')
			await caches.delete('updates')
			progress(-1)
			areListening.length = 0
			return upt = Promise.reject('Install failed')
		}
		if(hashes.size){
			let e
			todo = hashes.size
			for(const file of hashes.keys()){
				const req = 'https://.git' + file
				k.push(req)
				u.put(req,e||(e=new Response())).then(() => progress(++done/total))
			}
			await({then:a=>r=a})
		}
		k.push('https://.git/')
		await u.put('https://.git/', new Response(res.join('\n'), {headers: {commit: latest}}))
	}
	console.info('Committing diffs over %s', old)
	const total = (todo = k.length)*5
	for(const req of k){
		const url = typeof req=='object'?req.url:req
		if(url.startsWith('https://.git/') && url.length > 13) cache.delete(url.slice(12)).then(()=>progress(1-todo/total))
		else u.match(req).then(a => cache.put(req, a)).then(()=>progress(1-todo/total))
	}
	await({then:a=>r=a})
	await caches.delete('updates')
	progress(1)
	console.info('Update complete!')
	areListening.length = 0
	ready = upt = null
}