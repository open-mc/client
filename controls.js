import { alt, bind, ctrl, key } from "./ui/events.js";
import { setselected, getselected } from "./uis/inventory.js";
import { hideUI, ui } from "./ui/ui.js";
import { showInventory } from "./uis/inventory.js";
import { movementFlags } from "./lib/entity.js";

let lastPressUp = 0
bind(['arrowright', 'd'], function(){
	me.dx = 5
})
bind(['arrowleft', 'a'], function(){
	me.dx = -5
})
bind(['arrowup', 'w', ' '], function(){
	if(me.state & 1){
		me.dy = 5
		return
	}
	else if(movementFlags & 1)me.dy = 9
})
bind(['arrowdown', 's'], function(){
	//crouch
	if(me.state & 1){
		me.dy = -5
		return
	}
})
key(['arrowup', 'w', ' '], () => {
	if(lastPressUp > t - .3){
		me.state ^= 1
		lastPressUp = 0
	}else lastPressUp = t
})
alt(['f3', 'tab'], () => chunks.classList.toggle('f3b'))

key(['f3', 'tab'], () => document.body.classList.toggle('f3'))
key('f1', () => document.body.classList.toggle('f1'))
key('f11', e => {console.log('f11');e.preventDefault(); document.body.requestFullscreen()})
key('f2', () => {
	const canvas = document.createElement('canvas')
	canvas.width = visualViewport.width * devicePixelRatio, canvas.height = visualViewport.height * devicePixelRatio
	canvas.getContext('2d').imageSmoothingEnabled = false
	if(!globalThis.html2canvas){
		//lazy load library
		let args = []
		globalThis.html2canvas = async (...a) => new Promise(r => args.push(r, a))
		import("/ext/html2canvas.min.js").then(() => {let r,a;while(a=args.pop(),r=args.pop())html2canvas.apply(undefined, a).then(r)})
	}
	html2canvas(document.body, {canvas}).then(a=>a.toBlob(blob => {
		let d = new Date()
		const a = document.createElement("a")
		a.href = URL.createObjectURL(blob)
		a.download = `screenshot-${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDay()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
		a.click()
		URL.revokeObjectURL(a.href)
	}))
})
ctrl('dypsfgl,[]-='.split(""), () => {})
key('123456789'.split(""), e => setselected(e.key - 1))
key('e', () => {showInventory()})

HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
let wasFullscreen = false
let ignoreEsc = false
key('escape', () => {if(ignoreEsc){ignoreEsc = false; return}; hideUI()}, true)
document.onpointerlockerror = document.onpointerlockchange = function(e){
	if(document.pointerLockElement){
		if(wasFullscreen)document.documentElement.requestFullscreen()
		pointer.hidden = pointer2.hidden = false
	}else{
		wasFullscreen = !!(!ui && document.fullscreenElement)
		if(wasFullscreen)document.exitFullscreen ? document.exitFullscreen().catch(Function.prototype) : document.webkitExitFullscreen()
		pointer.hidden = pointer2.hidden = true
		if(!ui)pause(), ignoreEsc = true
	}
}

chunks.onwheel = e => {
	if(e.wheelDeltaY === (e.deltaY * -3) || e.deltaMode == 0){
	}else{
		if(e.deltaY > 0){
			setselected((getselected() + 1) % 9)
		}else{
			setselected((getselected() + 8) % 9)
		}
	}
}