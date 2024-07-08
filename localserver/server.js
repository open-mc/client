import { open as socketOpen, close as sockClose } from "/server/misc/sock.js"
import { DEFAULT_TPS, saveAll, saving } from '/server/world/index.js'
import { setTPS } from "/server/world/tick.js"
import { codes, onstring } from '/server/misc/incomingPacket.js'
import { DataReader } from '/server/modules/dataproto.js'

hostSocket.onmessage = function({data}){
	if(data === undefined){
		// Shutdown
		saving.then(() => {
			const pr = [saveAll()]
			sockClose.call(hostSocket)
			Promise.all(pr).then(() => close())
		})
		return
	}else if(typeof data == 'string') return void onstring.call(hostSocket, hostSocket.entity, data)
	const d = new DataReader(data)
	const fn = codes[d.byte()]
	if(fn) fn.call(hostSocket, hostSocket.entity, d)
}
await ready
started = Date.now()
setTPS(DEFAULT_TPS)
await socketOpen.call(hostSocket)
hostSocket.perms = 4