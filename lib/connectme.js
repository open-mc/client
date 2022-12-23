import { codes, onstring } from "./incomingPacket.js"
import {} from "../uis/chat.js";
import { DataReader } from "./data.js";
import { queue } from "../ui/sounds.js";
import { msg, reconn } from "../uis/dirtscreen.js";
let lastIp = null
globalThis.ws = null
export function connection(ip){
	if(!/\w+:\/\//y.test(ip))ip = 'ws://' + ip
	if(!/:\d+$/.test(ip))ip += ':27277'
	lastIp = ip
	globalThis.ws = new WebSocket(`${ip}/${localStorage.name || 'Steve'}/tokenplaceholder`)
	const timeout = setTimeout(ws.close.bind(ws), 5000)
	ws.binaryType = 'arraybuffer'
	ws.onmessage = function({data}){
		if(typeof data == 'string')return void onstring(data)
		let packet = new DataReader(data)
		const code = packet.byte()
		if(!codes[code])return
		codes[code](packet)
	}
	ws.onclose = () => {
		const msg = me._id < 0 ? 'Connection refused' : 'Connection lost'
		finished()
		reconn(msg)
	}
	ws.onopen = () => {
		clearTimeout(timeout)
		msg('Authenticating...')
	}
	msg('Connecting...')
}
export function reconnect(){
	if(!lastIp)return
	connection(lastIp)
}
export function finished(){
	if(!ws)return
	queue('', true)
	me._id = -1
	chat.innerHTML = ''
	for(const ch of map.values())if(ch.node)ch.node.remove()
	map.clear()
	for(const e of entities.values())if(e.node)e.node.remove()
	entities.clear()
	ws.onclose = Function.prototype
	ws.close()
	ws = null
}