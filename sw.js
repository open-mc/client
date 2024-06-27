self.addEventListener('install', e => e.waitUntil(ready ? ready.then(() => upt) : upt))
// Change this if you feed data from a different repo
const REPO = 'open-mc/client', BRANCH = 'main'
self.addEventListener('fetch', e => {
	let req = e.request.url
	const i = req.indexOf('/')+2, j = req.indexOf('/', i)
	if(req.slice(j-8,j) == '.sandbox') req = req.slice(j)
	else if(req.slice(i,j) != location.host) return
	req = ready == '' ? '/index.html' : req[req.length-1]=='/'?req+'main.html':req
	e.respondWith(ready ? ready.then(() => cache.match(req)) : cache.match(req))
})
let cache, upt = null
let ready = (async () => {
	let latest = fetch('https://api.github.com/repos/'+REPO+'/commits/'+BRANCH, {headers: {accept: 'application/vnd.github.VERSION.sha'}}).then(a => a.text(),err=>'{"error":"network"}')
	cache = await caches.open('')
	const ver = await cache.match('https://.git')
	latest = await latest
	if(latest[0] != '{' && (ver?ver.headers.get('commit'):'') != latest) ready='', upt = update(latest, ver)
	else{
		ready = null
		if(!ver) upt = Promise.reject('Install failed')
		for(const l of areListening)l.postMessage(ver?1:-1);areListening.length=0
	}
})()
const areListening = []
self.addEventListener('message', e => {
	if(!ready) e.source.postMessage(1)
	else areListening.push(e.source)
})
async function update(latest, ver){
	const _idx = await ver?.text()
	const hashes = new Map
	if(_idx) for(const e of _idx){
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
			if(k[k.length-1].url == 'https://.git') break fetch
			else await caches.delete('updates'),u=await caches.open('updates')
		}
		console.info('Downloading update...')
		let res = []
		let total = hashes.size*1.25, done = 0
		const traverse = (hash, api, url) => {
			fetch(api+hash+'?recursive=true').then(a => a.json()).then(async a => {
				if(a.truncated || !a.tree) return void r(1)
				for(const {path, type, sha} of a.tree){
					const p = url + path
					res.push(p+' '+sha)
					if(hashes.get(p) == sha){hashes.delete(p)&&(total-=1.25); continue}
					hashes.delete(p)||(total+=1.25)
					todo++
					if(type == 'blob') k.push(p), u.add(p).then(() => progress(++done/total), () => r(1))
					else if(type == 'commit') fetch(api.slice(0, -10) + 'contents/' + path).then(a => a.json()).then(({git_url}) => git_url?traverse(sha, git_url.slice(0,-40), p+'/'):r(1))
					else --todo||r(0)
				}
				--todo||r(0)
			})
		}
		traverse(latest, 'https://api.github.com/repos/'+REPO+'/git/trees/', '/')
		if(await({then:a=>r=a})){
			console.info('Update aborted!')
			await caches.delete('updates')
			progress(-1)
			areListening.length = 0
			return upt = Promise.reject('Install failed')
		}
		if(hashes.size){
			let e = null
			for(const file of hashes.keys()){
				todo++
				const req = new Request(url+file,{method:'DELETE'})
				k.push(req)
				u.put(req,e||(e=new Response())).then(() => progress(++done/total))
			}
			await({then:a=>r=a})
		}
		k.push('https://.git')
		await u.put('https://.git', new Response(res.join('\n'), {headers: {commit: latest}}))
		console.info('Downloaded update!')
	}
	console.info('Committing update...')
	const total = (todo = k.length)*5
	for(const req of k){
		if(typeof req=='object'&&req.mode=='DELETE') cache.delete(req).then(()=>progress(1-todo/total))
		else u.match(req).then(a => cache.put(req, a)).then(()=>progress(1-todo/total))
	}
	await({then:a=>r=a})
	await caches.delete('updates')
	progress(1)
	areListening.length = 0
	console.info('Update complete!')
	ready = upt = null
}