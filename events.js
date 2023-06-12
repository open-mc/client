import { keyMsg, win } from "./iframe.js"
import { pause } from "./uis/pauseui.js"
import { ui, NONE, ptrFail, ptrSuccess } from "./ui.js"

onkeydown = e => {
	if(document.activeElement != document.body && e.key != 'Escape') return
	e.preventDefault()
	if(e.repeat) return
	if(cbs[e.key])for(const f of cbs[e.key])f()
	if(win) keyMsg(e.keyCode)
}
onkeyup = e => {
	if(document.activeElement != document.body && e.key != 'Escape') return
	else if(e.key == 'Escape'){
		if(ignoreEsc){ignoreEsc = false; return}
		if(ui && ui.esc) ui.esc()
		return
	}
	if(win) keyMsg(~e.keyCode)
	e.preventDefault()
}
onmousedown = e => void(win && (!ui || (ui instanceof Comment)) && keyMsg(e.button))
onmouseup = e => void(win && keyMsg(~e.button))

const cbs = {}
export function key(key, handler){
	const keyname = key.toLowerCase()
	if(!cbs[keyname])cbs[keyname] = [handler]
	cbs[keyname].push(handler)
}

// Don't prompt if live server or local server
window.onbeforeunload = () => (location.host != '127.0.0.1' && location.host != 'localhost' &&
	![].find.call(document.body.childNodes, a =>
		a instanceof Comment && a.data.trim() == 'Code injected by live-server')) || undefined
HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
let wasFullscreen = false
let ignoreEsc = false
document.onpointerlockerror = document.onpointerlockchange = function(e){
	if(e.type == 'error' || e.type == 'pointerlockerror') ptrFail(), keyMsg(true)
	else if(document.pointerLockElement){
		ptrSuccess()
		keyMsg(false)
		//if(wasFullscreen)document.documentElement.requestFullscreen()
	}else{
		keyMsg(true)
		wasFullscreen = !!(!ui && document.fullscreenElement)
		if(wasFullscreen)document.exitFullscreen ? document.exitFullscreen().catch(Function.prototype) : document.webkitExitFullscreen()
		if(!ui)pause(), ignoreEsc = true
	}
}