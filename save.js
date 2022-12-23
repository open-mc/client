export const servers = (localStorage.servers || 'localhost:27277').split('\0')
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
	localStorage.servers = servers.join('\0')
}
export const options = {}
const defaults = {
	guiScale: 1,
	zoom: 0.4,
	sound: 0.75,
	music: 0.75,
	sensitivity: 0.5
}
for(const k in defaults){
	let v = defaults[k], s = localStorage[k]
	if(typeof v == 'string' && s !== undefined)v = s
	else if(typeof v == 'number' && s !== undefined)v = +s
	else if(typeof v == 'boolean' && s !== undefined)v = s == 'true'
	Object.defineProperty(options, k, {get(){return v},set(a){localStorage[k]=v=a}})
}