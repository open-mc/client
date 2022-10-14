import { codes, onstring, types } from "./incomingPacket.js"
import sounds from "../ui/sounds.js"
import { clearDirtScreenMessage, dirtDcreenMessage } from "../ui/ui.js"
import {} from "../ui/chat.js";
import { DataReader } from "./data.js";
import { queue } from "../ui/music.js";

export function connection(ip){
	globalThis.ws = new WebSocket(`ws://${ip}/${localStorage.name || 'Steve'}/tokenplaceholder`)
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
		dirtDcreenMessage(running ? 'Connection lost' : 'Connection refused', 0x0f, { 'Reconnect': reconnect })
	}
	ws.onopen = () => dirtDcreenMessage('Authenticating...', 0x3f)
	return ws
}
export function reconnect(){
	sounds.click()
	globalThis.ws = connection('localhost:27277')
	clearDirtScreenMessage()
}
export function finished(){
	running = false
	queue('', true)
	chat.innerHTML = ''
	map.clear()
	entities.clear()
	chunks.innerHTML = ''
}