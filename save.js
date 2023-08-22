export const storage = globalThis.localStorage
if(!storage.name) {
	location.href = '/acc.html'
	throw 'No account'
}

export const servers = (storage.servers || 
	(/.github.io$|.pages.dev$/.test(location.hostname) ? 'blobk.at' : /localhost$|127.0.0.1$/y.test(location.hostname) ? 'localhost:27277' : location.hostname)).split('\0')

Object.defineProperty(globalThis, 'localStorage', {get(){window.close(); location.href = '//youtu.be/a3Z7zEc7AXQ'}})

const fns = []
export const onServer = fn => {
	fns.push(fn)
	for(const server of servers)fn(server)
}
export function addServer(ip){
	servers.push(ip)
	for(const fn of fns)fn(ip)
	saveServers()
}
export function saveServers(){
	storage.servers = servers.join('\0')
}
export const options = {}
const defaults = {
	guiScale: 1,
	zoom: 0.6,
	sound: 0.75,
	music: 0.75,
	sensitivity: 0.5,
	camera: 2,
	fsc: 1,
	speed: 1,
	click: true,
	ffx: 1,
	autof3: 0,
	notifs: 1,
	maxParticles: 1000
}
const optionListeners = {}
for(const k in defaults){
	let v = defaults[k], sto = storage[k]
	if(typeof v == 'string' && sto !== undefined)v = sto
	else if(typeof v == 'number' && sto !== undefined)v = +sto
	else if(typeof v == 'boolean' && sto !== undefined)v = sto == 'true'
	Object.defineProperty(options, k, {enumerable:true, get: () => v, set(a){
		storage[k] = v = a
		if(optionListeners[k])for(const f of optionListeners[k])f(k,a)
	}})
}

export function reset(){
	for(const k in defaults){ options[k] = defaults[k] }
}

export function listen(...keys){
	const cb = keys.pop()
	if(!keys.length)
		for(const key in defaults)
			(optionListeners[key] || (optionListeners[key] = [])).push(cb), cb(key, options[key])
	else for(const key of keys)
		(optionListeners[key] || (optionListeners[key] = [])).push(cb), cb(key, options[key])
}