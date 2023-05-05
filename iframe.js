import { finished } from './connectme.js'
import { listen, options } from './save.js'
import { UI, hideUI, showUI, ui } from './ui.js'
import { pause } from './uis/pauseui.js'
import { serverlist } from './uis/serverlist.js'

export let iframe = document.createElement('iframe'), win = null


// Security druggie
iframe.sandbox = 'allow-scripts'
iframe.allow = 'cross-origin-isolated; autoplay'
iframe.credentialless = true
if(location.protocol == 'tauri:'){
	// tauri prod
	// ABSOLUTELY FUCKING RETARDED TAURI PROTOCOL SHITSHOW
	// HOW THE FUCK DOES THIS WORK
	// DO NOT **UNDER ANY CIRCUMSTANCES** REMOVE THE DOT AFTER THE DOMAIN NAME
	iframe.src = 'tauri://localhost./iframe/index.html'

	// We allow it, but, being on a different domain, it still can't access parent iframe or credentials
	// This is to actually allow it to load stuff from its own domain
	iframe.sandbox += ' allow-same-origin'
}else if(window.__TAURI__){
	// tauri dev
	// Fairly simple. Load localhost but by IP instead of domain
	iframe.src = 'http://0/iframe/index.html'
	
}else iframe.src = 'iframe/index.html'

const queue = []; let files = null
export function gameIframe(f){
	files = f
	destroyIframe()
	document.body.append(iframe)
}

const empty = new Comment()
empty.esc = pause

onmessage = ({data, source}) => {
	if(source != iframe.contentWindow || !iframe.contentWindow) return
	if(data === null){
		win = iframe.contentWindow
		if(!win) return
		for(const k in options) win.postMessage([k, options[k]], '*')
		win.postMessage(files, '*')
		for(let i = 0; i < queue.length; i += 2)queue[i](queue[i+1])
		queue.length = 0
	}else if(data === true) showUI(null)
	else if(data === false) hideUI()
	else if(data == 'custompause') showUI(empty)
	else if(data == 'quit')serverlist()
	else if(data instanceof ArrayBuffer && globalThis.ws) ws.send(data)
	else if(data instanceof Blob){
		let d = new Date()
		const a = document.createElement("a")
		a.href = URL.createObjectURL(data)
		a.download = `screenshot-${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDay()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
		a.click()
		URL.revokeObjectURL(a.href)
	}
}
document.body.onmousemove = ({movementX, movementY, clientX, clientY}) => {
	if(!win) return
	if(ui){
		win.postMessage([clientX, clientY], '*')
		return
	}
	const movementScale = globalThis.netscape ? devicePixelRatio : /Opera|OPR\//.test(navigator.userAgent) ? 1/devicePixelRatio : 1
	win.postMessage([movementX * movementScale, -movementY * movementScale], '*')
}

document.body.onwheel = ({deltaY}) => {
	if(!win) return
	const movementScale = devicePixelRatio ** (globalThis.netscape ? 1 : /Opera|OPR\//.test(navigator.userAgent) ? -1 : 0)
	win.postMessage([deltaY * movementScale], '*')
}

export function destroyIframe(){
	if(win)win.close(), win = null
	iframe.remove()
	win = null; queue.length = 0
}

export const fwOption = (a, b) => {
	if(!win) return
	win.postMessage([a, b], '*')
}
listen(fwOption)

export function fwPacket(a){
	if(!win) return void queue.push(fwPacket, a)
	if(a.buffer)win.postMessage(a.buffer, '*', [a.buffer])
	else win.postMessage(a, '*')
}

export function keyMsg(a){
	if(!win) return void queue.push(keyMsg, a)
	win.postMessage(a, '*')
}