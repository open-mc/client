import { EPSILON, movementFlags } from "./entity.js"
import { getblock } from "./world.js"

export const cbs = []
export const mouseMoveCb = []
export const wheelCb = []
export const pauseCb = []

onwheel = cb => wheelCb.push(cb)
onpause = cb => pauseCb.push(cb)
onmousemove = cb => mouseMoveCb.push(cb)

button = (...keys) => {
	const cb = keys.pop()
	for(const key of keys)
		(cbs[key] || (cbs[key] = [])).push(cb)
}


export const playerControls = () => {
	const R = buttons.has(KEY_RIGHT) || buttons.has(KEY_D)
	const L = buttons.has(KEY_LEFT) || buttons.has(KEY_A)
	const D = buttons.has(KEY_DOWN) || buttons.has(KEY_S)
	if(D ^ buttons.has(KEY_SHIFT) ^ buttons.has(KEY_CAPSLOCK)) me.state |= 2
	else me.state &= -3
	if(D && (me.state & 1)) me.dy = -5
	if(R && !L) me.dx = (me.state & 3) == 2 ? 1 : 5; else if(L && !R) me.dx = (me.state & 3) == 2 ? -1 : -5
	if(buttons.has(KEY_UP) || buttons.has(KEY_W) || buttons.has(KEY_SPACE)){
		if(me.state & 1){
			me.dy = 5
		}else if(movementFlags & 1)me.dy = 9
	}
	if((movementFlags & 1) && (me.state & 2)){
		const x = me.x + (me.dx > 0 ? -me.width + EPSILON * 2 : me.width - EPSILON * 2)
		if(getblock(floor(x), floor(me.y - .001)).solid && !getblock(floor(x + me.dx * dt), floor(me.y - .001)).solid){
			me.dx = 0
		}
	}
}
let lastPressUp = 0
button(KEY_UP, KEY_W, KEY_SPACE, () => {
	if(lastPressUp > t - .3){
		me.state ^= 1
		lastPressUp = 0
	}else lastPressUp = t
})
export let renderF3 = false, renderBoxes = false
let renderBoxes_o = false
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

ctrl('dypsfgl,[]-='.split(""), () => {})
button('123456789'.split(""), e => me.selected = e.key - 1)
button('e', () => {showInventory()})

HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
let wasFullscreen = false
let ignoreEsc = false
button('escape', () => {if(ignoreEsc){ignoreEsc = false; return}; hideUI()}, true)*/

let cummulative = 0
onwheel(dy => {
	cummulative += dy
	if(cummulative > 60) me.selected = (me.selected + 1) % 9, cummulative = 0
	else if(cummulative < -60) me.selected = (me.selected + 8) % 9, cummulative = 0
})