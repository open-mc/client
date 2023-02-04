import { keyMsg, win } from "./iframe.js"
import { options } from "./save.js"
import { pause } from "./uis/pauseui.js"
import { ui, hideUI, NONE } from "./ui.js"

onkeydown = e => {
	if(document.activeElement != document.body && e.key != 'Escape')return
	e.preventDefault()
	if(e.repeat) return
	if(cbs[e.key])for(const f of cbs[e.key])f()
	if(win) keyMsg(e.keyCode)
}
onkeyup = e => {
	if(document.activeElement != document.body && e.key != 'Escape')return
	else if(e.key == 'Escape'){
		if(ignoreEsc){ignoreEsc = false; return}
		if(ui.esc) ui.esc()
		return
	}
	if(win) keyMsg(~e.keyCode)
	e.preventDefault()
}
onmousedown = e => win && (!ui || ui == NONE) && keyMsg(e.button)
onmouseup = e => win && keyMsg(~e.button)

const cbs = {}
export function key(key, handler){
	const keyname = key.toLowerCase()
	if(!cbs[keyname])cbs[keyname] = [handler]
	cbs[keyname].push(handler)
}

window.onbeforeunload = () => location.host != '127.0.0.1' && location.host != 'localhost' ? true : undefined

HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
let wasFullscreen = false
let ignoreEsc = false
document.onpointerlockerror = document.onpointerlockchange = function(e){
	if(document.pointerLockElement){
		keyMsg(false)
		if(wasFullscreen)document.documentElement.requestFullscreen()
	}else{
		keyMsg(true)
		wasFullscreen = !!(!ui && document.fullscreenElement)
		if(wasFullscreen)document.exitFullscreen ? document.exitFullscreen().catch(Function.prototype) : document.webkitExitFullscreen()
		if(!ui)pause(), ignoreEsc = true
	}
}