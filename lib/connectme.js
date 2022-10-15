import { codes, onstring, types } from "./incomingPacket.js"
import sounds from "../ui/sounds.js"
import { hideUI, showUI } from "../ui/ui.js"
import {} from "../uis/chat.js";
import { DataReader } from "./data.js";
import { queue } from "../ui/sounds.js";
import { msg, reconn } from "../uis/dirtscreen.js";
let lastIp = null
export function connection(ip){
	lastIp = ip
	globalThis.ws = new WebSocket(`${ip}/${localStorage.name || 'Steve'}/tokenplaceholder`)
	ws.binaryType = 'arraybuffer'
	ws.onmessage = async function({data}){
		if(typeof data == 'string')return void onstring(data)
		let packet = new DataReader(new Uint8Array(data))
		const code = packet.byte()
		if(!codes[code])return
		const dat = types[code] ? packet.read(types[code]) : packet
		if(!dat)return
		codes[code](dat)
	}
	ws.onclose = () => {
		finished()
		reconn(running ? 'Connection lost' : 'Connection refused')
	}
	ws.onopen = () => msg('Authenticating...')
	msg('Connecting...')
}
export function reconnect(){
	if(!lastIp)return
	connection(lastIp)
}
export function finished(){
	running = false
	queue('', true)
	chat.innerHTML = ''
	map.clear()
	entities.clear()
	chunks.innerHTML = ''
	ws.onclose = Function.prototype
	ws.close()
}