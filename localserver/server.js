import { close } from "../server/misc/sock.js"
import { DEFAULT_TPS, saveAll, saving, stat } from "../server/world/index.js"
import { setTPS } from "../server/world/tick.js"

const clients = new Set
stat('misc', 'restarts')
onmessage = function({data, source}){
	if(data === null){
		// Shutdown
		saving.then(() => {
			const pr = [saveAll()]
			for(const c of clients) close.call(c)
			Promise.all(pr).then(() => postMessage(null))
		})
	}
}
postMessage(null)

setTPS(DEFAULT_TPS)