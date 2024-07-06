import { open as socketOpen, close as sockClose } from "/server/misc/sock.js"
import { players, DEFAULT_TPS, saveAll, saving } from '/server/world/index.js'
import { setTPS } from "/server/world/tick.js"
import { codes, onstring } from '/server/misc/incomingPacket.js'

onmessage = function({data}){
	if(data === undefined){
		// Shutdown
		saving.then(() => {
			const pr = [saveAll()]
			for(const c of clients) sockClose.call(c)
			Promise.all(pr).then(() => close())
		})
	}
}
started = Date.now()
setTPS(DEFAULT_TPS)