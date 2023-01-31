import { fwOption } from "./iframe.js";

export const storage = globalThis.localStorage
if(!storage.name) {
	location.href = '/acc.html'
	throw 'No account'
}

export const servers = (storage.servers || 'localhost:27277').split('\0')

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
	zoom: 0.4,
	sound: 0.75,
	music: 0.75,
	sensitivity: 0.5,
	camera: 0,
	speed: 1
}
for(const k in defaults){
	let v = defaults[k], s = storage[k]
	if(typeof v == 'string' && s !== undefined)v = s
	else if(typeof v == 'number' && s !== undefined)v = +s
	else if(typeof v == 'boolean' && s !== undefined)v = s == 'true'
	Object.defineProperty(options, k, {enumerable:true,get(){return v},set(a){storage[k] = v = a;
		fwOption(k,a)
	}})
}

export function reset(){
	for(const k in defaults){ options[k] = defaults[k] }
}