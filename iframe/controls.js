import { movementFlags } from "./entity.js"
import "./ipc.js"

let lastPressUp = 0

export function playerControls(){
	const R = buttons.has(KEY_RIGHT) || buttons.has(KEY_D)
	const L = buttons.has(KEY_LEFT) || buttons.has(KEY_A)
	if(R && !L) me.dx = 5; else if(L) me.dx = -5
	if(buttons.has(KEY_UP) || buttons.has(KEY_W) || buttons.has(KEY_SPACE)){
		if(me.state & 1){
			me.dy = 5
			return
		}
		else if(movementFlags & 1)me.dy = 9
	}
	if(buttons.has(KEY_DOWN) || buttons.has(KEY_S) || buttons.has(KEY_SHIFT)){
		me.state |= 2
		if(me.state & 1){
			me.dy = -5
			return
		}
	}else me.state &= -3
}
button(KEY_UP, KEY_W, KEY_SPACE, () => {
	if(lastPressUp > t - .3){
		me.state ^= 1
		lastPressUp = 0
	}else lastPressUp = t
})
export let renderF3 = false, renderBoxes = false
let renderBoxes_o = true
button(KEY_F3, () => {
	if(buttons.has(KEY_ALT) || buttons.has(KEY_MOD)) renderBoxes = !renderBoxes
	else{
		renderF3 = !renderF3
		let r = renderBoxes
		renderBoxes = renderBoxes_o
		renderBoxes_o = r
	}
})

button(KEY_1, () => me.selected = 0)
button(KEY_2, () => me.selected = 1)
button(KEY_3, () => me.selected = 2)
button(KEY_4, () => me.selected = 3)
button(KEY_5, () => me.selected = 4)
button(KEY_6, () => me.selected = 5)
button(KEY_7, () => me.selected = 6)
button(KEY_8, () => me.selected = 7)
button(KEY_9, () => me.selected = 8)

//button(KEY_F11, e => document.body.requestFullscreen())
/*
button('f1', () => document.body.classList.toggle('f1'))

button('f2', () => {
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
button('123456789'.split(""), e => me.selected = e.key - 1)
button('e', () => {showInventory()})

HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
let wasFullscreen = false
let ignoreEsc = false
button('escape', () => {if(ignoreEsc){ignoreEsc = false; return}; hideUI()}, true)*/

onwheel = e => {
	if(e.wheelDeltaY === (e.deltaY * -3) || e.deltaMode == 0){
		
	}else if(e.deltaY > 0) me.selected = (me.selected + 1) % 9
	else me.selected = (me.selected + 8) % 9
}