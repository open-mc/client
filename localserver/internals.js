import { close as sockClose } from "../server/misc/sock.js"
import { DEFAULT_TPS, saveAll, saving, stat } from "../server/world/index.js"
import { setTPS } from "../server/world/tick.js"

const clients = new Set
stat('misc', 'restarts')
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
postMessage(null)

setTPS(DEFAULT_TPS)