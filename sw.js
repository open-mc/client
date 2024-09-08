// Change this if you feed data from a different repo
const REPO = 'open-mc/client'
const LOCAL = location.protocol != 'https:'
const HOST = location.origin + '/'
self.addEventListener('fetch', e => {
	let req = e.request.url
	if(!req.startsWith(HOST)) return
	if(req[req.length-1]=='/') req += 'main.html'
	if(LOCAL) return req != e.request.url && e.respondWith(fetch(req))
	e.respondWith(ready ? ready.then(() => cache.match(ready == '' ? '/index.html' : req)) : cache.match(ready == '' ? '/index.html' : req))
})

const fromHex = h => (h=h-48&0xffff)<10?h:(h=(h|32)-49&0xffff)<6?h+10:0
const parseModule = (str, baseUrl, imports) => {
	if(/\s*\/\/\s*@no-resolve/yi.test(str)) return str
	let i = 0, levels = 0, src = [], r = null
function rstr(end){
	let r = ''
	top: while(i < str.length){
		const c = str.charCodeAt(i++)
		if(c == end) break
		if(c == 92){
			const c2 = str.charCodeAt(i++)
			if(c2 == 48) r += '\0'
			else switch(c2|32){
				case 98: r += '\b'; break;
				case 102: r += '\f'; break;
				case 110: r += '\n'; break;
				case 114: r += '\r'; break;
				case 116: r += '\t'; break;
				case 117:
				if(i>str.length-4){ r += '\ufffd'; break top }
				const c1 = str.charCodeAt(i++)
				if(c1 == 123){
					let res = 0
					while(i < str.length){
						const c = str.charCodeAt(i++)
						if(c == 125) break
						if(c == end){r += '\ufffd'; break top }
						else res = res<<4|fromHex(c)
					}
					r += (res >>>= 0) > 1114111 ? '\ufffd' : String.fromCodePoint(res)
				}else r += String.fromCharCode(fromHex(c1)<<12|fromHex(str.charCodeAt(i++))<<8|fromHex(str.charCodeAt(i++))<<4|fromHex(str.charCodeAt(i++)));
				break;
				case 118: r += '\v'; break;
				case 120:
				if(i>str.length-2){ r += '\ufffd'; break top }
				r += String.fromCharCode(fromHex(str.charCodeAt(i++))<<4|fromHex(str.charCodeAt(i++)))
				break;
				default: r += String.fromCharCode(c2);
			}
		}else r += str[i-1]
	}
	return r
}

function parse(end = 125){
	let lastExpr = 0
	for(;i < str.length;){
		let c; do{c = str.charCodeAt(i++)}while(c == 32 || (c > 8 && c < 14))
		if(c == 123){
			let j = i-2, c3 = str.charCodeAt(j)
			while(c3 == 32 || (c3 > 8 && c3 < 14)) c3 = str.charCodeAt(--j)
			parse(125)
			if(c3==33||c3==37||c3==38||c3==40||(c3>=42&&c3<=45)||(c3==47&&lastExpr!=j)||(c3>=58&&c3<=63)||c3==91||c3==123||c3==124||c3==126) lastExpr = i-1
		}else if(end==41&&c==40) parse(41)
		else if(c == end) return
		else if(c == 47){
			const c2 = str.charCodeAt(i++)
			if(c2 == 47){
				while(i < str.length && str.charCodeAt(i++) != 10);
				continue
			}else if(c2 == 42){
				while(i < str.length){
					if(str.charCodeAt(i++) == 47 && str.charCodeAt(i-2) == 42) break
				}
				continue
			}
			let j = --i-2, c3 = str.charCodeAt(j)
			while(c3 == 32 || (c3 > 8 && c3 < 14)) c3 = str.charCodeAt(--j)
			if(c3==33||c3==37||c3==38||c3==40||(c3>=42&&c3<=45)||(c3==47&&lastExpr!=j)||(c3>=58&&c3<=63)||c3==91||(c3>=123&&c3<=126&&lastExpr!=j)){
				let cset = false
				while(i < str.length){
					const c = str.charCodeAt(i++)
					if(cset){ cset = c!=93||str.charCodeAt(i-1)==92; continue }
					if(c == 91) cset = true
					else if(c == 47 && str.charCodeAt(i-2) != 92) break
				}
				lastExpr = i - 1
			}
		}else if((c-48&0xffff)<10||c==36||(c-97&0xffff)<26||c==95||(c-65&0xffff)<26){
			let s = i-1
			let c2 = 0
			do{c2 = str.charCodeAt(i++)}while(c2 == c2 && ((c2-48&0xffff)<10||c2==36||(c2-97&0xffff)<26||(c2-65&0xffff)<26||c2==95));
			let j = s
			let c3 = str.charCodeAt(--j)
			if(c3 == 35){ i--; continue }
			while(c3 == 32 || (c3 > 8 && c3 < 14)) c3 = str.charCodeAt(--j)
			if(c3 == 46){ i--; continue }
			const k = str.slice(s, i-1)
			if(k == 'import'){
				while(c2 == 32 || (c2 > 8 && c2 < 14)) c2 = str.charCodeAt(i++)
				if(c2 == 40){
					// dynamic import
					src.push(str.slice(0, s))
					str = str.slice(i); i = 0
					let j = src.length; src.push('import(')
					do{c2 = str.charCodeAt(i++)}while(c2 == 32 || (c2 > 8 && c2 < 14))
					if(c2 == 34 || c2 == 39){
						const url = resolve(rstr(c2), baseUrl)
						do{c2 = str.charCodeAt(i++)}while(c2 == 32 || (c2 > 8 && c2 < 14))
						if(c2==41){
							imports.push(url+vS)
							src[j] = '__import__('+JSON.stringify(url)+',"")'
							str = str.slice(i); i = 0
							continue
						}
					}
					i = 0
					parse(41)
					do{c2 = str.charCodeAt(i++)}while(c2 == 32 || (c2 > 8 && c2 < 14)); i--
					if(c2 != 123) src[j] = r ??= '__import__('+JSON.stringify(baseUrl)+','
					continue
				}else if(c2 == 46){
					do{c2 = str.charCodeAt(i++)}while(c2 == 32 || (c2 > 8 && c2 < 14)); i--
					let s1 = i
					if(c2 == c2 && ((c2-48&0xffff)<10||c2==36||(c2-97&0xffff)<26||c2==95||(c2-65&0xffff)<26)){
						do{c2 = str.charCodeAt(i++)}while(c2 == c2 && ((c2-48&0xffff)<10||c2==36||(c2-97&0xffff)<26||(c2-65&0xffff)<26||c2==95));
						const k2 = str.slice(s1, i-1)
						if(k2!='meta') continue
						src.push(str.slice(0, s), r ??= '__import__.meta('+JSON.stringify(baseUrl)+')')
						str = str.slice(i-1); i = 0
					}
					continue
				}
				if(!levels && c2 == 34 || c2 == 39){
					s = i-1
					const href = resolve(rstr(c2), baseUrl)
					imports.push(href+vS)
					src.push(str.slice(0, s), JSON.stringify(href))
					str = str.slice(i); i = 0
					continue
				}
				do{c2 = str.charCodeAt(i++)}while(c2 == c2 && c2 != 34 && c2 != 39)
				if(c2!=c2){ i--; continue }
				s = i-1
				const href = resolve(rstr(c2), baseUrl)
				imports.push(href+vS)
				src.push(str.slice(0, s), JSON.stringify(href))
				str = str.slice(i); i = 0
			}else if(k == 'export'){
				while(c2 == 32 || (c2 > 8 && c2 < 14)) c2 = str.charCodeAt(i++)
				if(c2 == 123){
					// Edge case, find matching }
					while(c2 == c2 && (c2 = str.charCodeAt(i++)) != 125);
					do{c2 = str.charCodeAt(i++)}while(c2 == 32 || (c2 > 8 && c2 < 14))
					if(c2 != 102 || str.charCodeAt(i++) != 114 || str.charCodeAt(i++) != 111 || str.charCodeAt(i++) != 109) continue
					c2 = str.charCodeAt(i++); if(((c2-48&0xffff)<10||c2==36||(c2-97&0xffff)<26||c2==95||(c2-65&0xffff)<26)) continue
				}else if(c2 != 42) continue
				while(c2 == c2 && c2 != 34 && c2 != 39) c2 = str.charCodeAt(i++);
				if(c2!=c2) continue
				s = i-1
				const href = resolve(rstr(c2), baseUrl)
				imports.push(href+vS)
				src.push(str.slice(0, s), JSON.stringify(href))
				str = str.slice(i); i = 0
			}else i--
		}else if(c == 34){
			while(i < str.length && (str.charCodeAt(i++) != 34 || str.charCodeAt(i-2) == 92));
			continue
		}else if(c == 39){
			while(i < str.length && (str.charCodeAt(i++) != 39 || str.charCodeAt(i-2) == 92));
			continue
		}else if(c == 96){
			while(i < str.length){
				const c = str.charCodeAt(i++)
				if(c == 96 && str.charCodeAt(i-2) != 92) break
				else if(c==123 && str.charCodeAt(i-2) == 36){
					i++
					levels++; parse(125)
				}
			}
			continue
		}
	}
}
	parse(125)
	if(str) src.push(str)
	return src
}
const cacheMeta = globalThis.cacheMeta = new Map
const enc = new TextEncoder(), dec = new TextDecoder()
const CORE = HOST + 'iframe/index.js'
const IMPORT_MAP = new Map().set('core', CORE)
	.set('vanilla', HOST + 'vanilla/index.js')
	.set('world', HOST + 'iframe/world.js')
	.set('api', HOST + 'iframe/api.js')
	.set('definitions', HOST + 'iframe/definitions.js')

let vS = '', vI = 0
const resolve = (path, base) => {
	vS = ''; vI = 0
	const sep = path.lastIndexOf('^')
	if(sep >= 0) vS = '^'+(vI = path.slice(sep+1)>>>0), path = path.slice(0, sep)
	let c = path.charCodeAt(0)
	// ../, ./ or /
	if(c == 47 || (c == 46 && ((c = path.charCodeAt(1)) == 47 || (c == 46 && path.charCodeAt(2) == 47)))) return new URL(path, base).href
	// Self import (import * as thisModule from "")
	if(c != c) return base
	// Import maps
	if(path.startsWith(HOST)) return 'data:'
	return (IMPORT_MAP.get(path) ?? path)
}
// 1d, 2d, 30d
const INIT_LIFETIME = 86400, ACCESS_LIFETIME = 172800, MAX_LIFETIME = 2592000
const h = {headers: new Headers()}; h.headers.set('x-version', 0)
const mimes = {__proto__: null}
mimes.js = mimes.mjs = mimes.cjs = 'application/javascript'
mimes.json = 'application/json'
mimes.uri = mimes.uris = mimes.urls = 'text/uri-list'
mimes.txt = 'text/plain'
mimes.md = 'text/markdown'
mimes.csv = 'text/csv'
mimes.xml = 'text/xml'
mimes.html = mimes.htm = 'text/html'
mimes.cache = 'application/cache-list'
// Image
mimes.png = 'image/png'; mimes.apng = 'image/apng'
mimes.avif = 'image/avif'; mimes.gif = 'image/gif'
mimes.jpg = mimes.jpeg = mimes.jfif = mimes.jpe = mimes.jif = 'image/jpeg'
mimes.svg = 'image/svg+xml'; mimes.webp = 'image/webp'
mimes.bmp = 'image/bmp'; mimes.ico = mimes.cur = 'image/x-icon'
mimes.tif = mimes.tiff = 'image/tiff'
// Video
mimes.mp4 = mimes.m4a = 'video/mp4'
mimes.m4v = 'video/x-m4v'; mimes.webm = 'video/webm'
mimes.mov = mimes.qt = 'video/quicktime'
mimes.mpeg = 'video/mpeg'; mimes.ogv = 'video/ogg'
// Audio
mimes.mp3 = 'audio/mpeg'
mimes.wav = mimes.wave = 'audio/wav'
mimes.mid = mimes.midi = 'audio/midi'
mimes.wav = mimes.wave = 'audio/x-wav'
mimes.oga = mimes.ogg = mimes.opus = 'audio/ogg'
// Font
mimes.ttf = 'font/ttf'; mimes.otf = 'font/otf'
mimes.woff = 'font/woff'; mimes.woff2 = 'font/woff2'

const download = (url, m, cache) => fetch(url).then(res => {
	let ex = url.slice(url.lastIndexOf('.')+1)
	if(ex.includes('/')) ex = ''
	const mime = mimes[ex.toLowerCase()] ?? 'application/octet-stream'
	if(mime == 'application/cache-list') return res.text().then(txt => {
		m.imports = []
		for(let l of txt.split('\n')){
			l = l.trim()
			if(l[0] == '#') continue
			m.imports.push(resolve(l, url)+vS)
		}
		if(!LOCAL) cacheMeta.set(url, m)
		else cacheMeta.delete(url)
		return null
	})
	return mime == 'application/javascript' ? res.text().then(a => {
		const blob = new Blob(parseModule(a, url, m.imports = []), {type: 'application/javascript'})
		if(!LOCAL) return cache.put(url, new Response(blob)).then(()=>(cacheMeta.set(url, m), blob))
		else return cacheMeta.delete(url), blob
	}) : res.blob().then(blob => {
		blob = blob.slice(0, blob.size, mime)
		if(!LOCAL) return cache.put(url, new Response(blob)).then(()=>(cacheMeta.set(url, m), blob))
		else return cacheMeta.delete(url), blob
	})
})
function getBlobs(entries, cb, now = Math.floor(Date.now()/1000), mappings){
	const files = new Map()
	let pending = 0
	const gather = (entries, version = 0) => { for(let url of entries){
		let v = version
		const sep = url.lastIndexOf('^')
		if(sep >= 0) v = url.slice(sep+1)>>>0 || v, url = url.slice(0, sep)
		if(files.has(url)) continue
		if(Array.isArray(m)){ pending++; m.push(v => {
			files.set(url, v)
			if(!--pending) saveMeta(), cb(files)
		}); continue }
		const M = mappings?.get(url)
		let url1 = url
		if(M){
			url1 = M
			v = version
			const sep = url1.lastIndexOf('^')
			if(sep >= 0) v = url1.slice(sep+1)>>>0 || v, url1 = url1.slice(0, sep)
		}
		let m = cacheMeta.get(url)
		if(m === undefined || m.version < v){
			const arr = [v => {
				files.set(url, v)
				if(!--pending) saveMeta(), cb(files)
			}]
			cacheMeta.set(url1, arr)
			if(m) m.version = v
			else m = {version: v, expire: now + INIT_LIFETIME, pins: 0, imports: null}
			pending++
			download(url1, m, cache).then(blob => {
				for(const f of arr) f(blob)
				if(m.imports) gather(m.imports, v)
			}, err => {
				console.warn(err)
				if(!LOCAL) cacheMeta.set(url1, m)
				else cacheMeta.delete(url1)
				for(const f of arr) f(null)
			})
			continue
		}else{
			pending++
			files.set(url, null)
			m.expire = Math.min(m.expire + ACCESS_LIFETIME, now + MAX_LIFETIME)
			cache.match(url1).then(a => a?a.blob():null).then(blob => {
				files.set(url, blob)
				if(!--pending) saveMeta(), cb(files)
			})
		}
		if(m.imports) gather(m.imports, v)
	} }
	gather(entries, 0)
	if(!pending) saveMeta(), cb(files)
}

function saveMeta(){
	const now = Math.floor(Date.now()/1000)
	const files = [], entries = [], ids = new Map
	let bytes = 10
	for(const {0:k,1:v} of cacheMeta){
		if(Array.isArray(v)) continue
		const {version,expire,pins,imports} = v
		const e2 = expire - now, len = imports?.length ?? 0
		if(e2 <= 0 && !pins){ cache.delete(k); continue }
		const id = ids.get(k) ?? (ids.set(k, ids.size), files.push(enc.encode(k)), ids.size-1)
		// id: u32, version: u32, expire: u32, pins: u32, importCount: u32, imports: u32[importCount]
		const entry = new Uint8Array(20 + (len<<2)); bytes += entry.length
		entry[0] = id>>24; entry[1] = id>>16; entry[2] = id>>8; entry[3] = id
		entry[4] = version>>24; entry[5] = version>>16; entry[6] = version>>8; entry[7] = version
		entry[8] = e2>>24; entry[9] = e2>>16; entry[10] = e2>>8; entry[11] = e2
		entry[12] = pins>>24; entry[13] = pins>>16; entry[14] = pins>>8; entry[15] = pins
		entry[16] = len>>24; entry[17] = len>>16; entry[18] = len>>8; entry[19] = len
		let i = 20
		if(len) for(const k of imports){
			const id = ids.get(k) ?? (ids.set(k, ids.size), files.push(enc.encode(k)), ids.size-1)
			entry[i] = id>>24; entry[i+1] = id>>16; entry[i+2] = id>>8; entry[i+3] = id
			i += 4
		}
		entries.push(entry)
	}
	for(const arr of files) bytes += arr.length + 4
	const total = new Uint8Array(bytes)
	let l = files.length
	total[0] = l>>24; total[1] = l>>16; total[2] = l>>8; total[3] = l
	let i = 4
	for(const f of files){
		l = f.length
		total[i] = l>>24; total[i+1] = l>>16; total[i+2] = l>>8; total[i+3] = l
		total.set(f, i+=4); i += l
	}
	files.length = 0
	const e2 = Math.floor(now/4294967296)
	total[i] = e2>>8; total[i+1] = e2; total[i+2] = now>>24
	total[i+3] = now>>16; total[i+4] = now>>8; total[i+5] = now
	i += 6
	for(const e of entries) total.set(e, i), i += e.length
	entries.length = 0
	cache.put('/.packs', new Response(total))
}
const areListening = []
self.addEventListener('message', e => {
	if(e.data){
		const {base, files, maps} = e.data
		if(base){
			const l = files.push(CORE)-1
			for(let i=0;i<l;i++) files[i] = resolve(files[i], base)+vS
		}else{
			const l = files.push(HOST + 'localserver/index.js')-1
			for(let i=0;i<l;i++) files[i] = new URL(files[i], HOST).href
		}
		let mappings = new Map, tot = 0
		const now = Math.floor(Date.now()/1000)
		const r = map => e.source.postMessage(map), done = () => (upt ? upt.then(() => getBlobs(files, r, now, mappings)) : getBlobs(files, r, now, mappings))
		if(maps) for(let url of maps.split('\n')){
			tot++
			let i = url.indexOf(' ')
			let base1 = ''
			if(i >= 0){ base1 = resolve(url.slice(0, i), base || 'file:'), url = resolve(url.slice(i+1), base || 'file:') }
			else url = resolve(url, base || 'file:')
			let m = cacheMeta.get(url)
			const r = v => v ? v.text().then(txt => {
				for(let l of txt.split('\n')){
					l = l.trim()
					if(l[0] == '#') continue
					let j = l.indexOf(' '), key = ''
					if(j >= 0) key = l.slice(0, j), l = l.slice(j+1)
					mappings.set(new URL(key, base1).href, resolve(l, base)+vS)
				}
				--tot||done()
			}) : --tot||done()
			if(Array.isArray(m)){ m.push(r); continue }
			if(m === undefined || m.version < vI){
				const arr = [r]
				cacheMeta.set(url, arr)
				if(m) m.version = vI
				else m = {version: vI, expire: now + INIT_LIFETIME, pins: 0, imports: null}
				download(url, m, cache).then(blob => { for(const f of arr) f(blob) }, err => {
					console.warn(err)
					if(!LOCAL) cacheMeta.set(url, m)
					else cacheMeta.delete(url)
					for(const f of arr) f(null)
				})
				continue
			}else{
				m.expire = Math.min(m.expire + ACCESS_LIFETIME, now + MAX_LIFETIME)
				cache.match(url).then(a => a?a.blob():null).then(r)
			}
		}else done()
	}else if(ready == null) e.source.postMessage(1)
	else areListening.push(e.source)
})
self.addEventListener('install', e => e.waitUntil(ready ? ready.then(() => upt) : upt))
let cache, upt = null
let ready = LOCAL ? caches.open('').then(a => {
	cache = a
	for(const l of areListening) l.postMessage(1)
	areListening.length = 0
	ready = null
}) : (async () => {
	let latest = fetch('/.gitversion').then(a => a.text(),()=>'{"error":"network"}')
	cache = await caches.open('')
	const ver = await cache.match('/.git')
	latest = await latest
	const our = ver?ver.headers.get('commit'):'null'
	if(latest[0] != '{' && our != latest) ready='', upt = update(latest, ver, our)
	else{
		if(!ver) upt = Promise.reject('Install failed')
		for(const l of areListening) l.postMessage(ver?1:-1)
		areListening.length=0
	}
	const p = cache.match('/.packs').then(a => a?.arrayBuffer()).then(b => {
		if(!b) return
		const v = new Uint8Array(b)
		const now = Math.floor(Date.now()/1000)
		const files = []
		let fl = v[0]<<24|v[1]<<16|v[2]<<8|v[3], i = 4
		while(fl--){
			const l = v[i]<<24|v[i+1]<<16|v[i+2]<<8|v[i+3]
			files.push(dec.decode(v.subarray(i += 4, i += l)))
		}
		const t = (v[i]<<8|v[i+1])*4294967296+(v[i+2]<<24|v[i+3]<<16|v[i+4]<<8|v[i+5]); i += 6
		while(i < v.length){
			const id = v[i]<<24|v[i+1]<<16|v[i+2]<<8|v[i+3]
			const version = v[i+4]<<24|v[i+5]<<16|v[i+6]<<8|v[i+7]
			const expire = t + (v[i+8]<<24|v[i+9]<<16|v[i+10]<<8|v[i+11])
			const pins = v[i+12]<<24|v[i+13]<<16|v[i+14]<<8|v[i+15]
			let il = v[i+16]<<24|v[i+17]<<16|v[i+18]<<8|v[i+19]; i += 20
			const imports = il ? [] : null
			while(il--) imports.push(files[v[i]<<24|v[i+1]<<16|v[i+2]<<8|v[i+3]]), i += 4
			if(expire <= now && !pins){
				cache.delete(files[id])
				continue
			}
			cacheMeta.set(files[id], {version, expire, pins, imports})
		}
	})
	upt = upt ? upt.then(() => p) : p
})()
const BLOBS_DIRS = ['/vanilla/', '/iframe/', '/server/']
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
			if(k[k.length-1].url == '/.git') break fetch
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
				hashes.delete(p)||(total+=1.25); todo++
				a: { for(const pat of BLOBS_DIRS) if(p.startsWith(pat)){
					download(new URL(p, HOST).href, {version: 0, expire: 0, pins: 1, imports: null}, u).then(b => (b&&k.push(p),progress(++done/total)), () => r(1))
					break a
				}
					fetch(p).then(res => {
						k.push(p)
						if(res.redirected) res = new Response(res.body,res)
						return u.put(p, res)
					}).then(() => progress(++done/total), () => r(1))
				}
				
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
				const req = 'https://.del' + file
				k.push(req)
				u.put(req,e||(e=new Response())).then(() => progress(++done/total))
			}
			await({then:a=>r=a})
		}
		k.push('/.git')
		await u.put('/.git', new Response(res.join('\n'), {headers: {commit: latest}}))
	}
	console.info('Committing diffs over %s', old)
	const total = (todo = k.length)*5
	for(const req of k){
		const url = typeof req=='object'?req.url:req
		if(url.startsWith('https://.del') && url.length > 13){
			const u = url.slice(12)
			cache.delete(u).then(()=>progress(1-todo/total))
			cacheMeta.delete(u)
		}else u.match(req).then(a => cache.put(req, a)).then(()=>progress(1-todo/total))
	}
	await({then:a=>r=a})
	await caches.delete('updates')
	progress(1)
	console.info('Update complete!')
	areListening.length = 0
	ready = upt = null
}