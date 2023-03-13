import { button, onwheel, buttons } from "api"
import { EPSILON } from "./entity.js"
import { getblock } from 'world'

export const playerControls = () => {
	const R = buttons.has(KEYS.RIGHT) || buttons.has(KEYS.D)
	const L = buttons.has(KEYS.LEFT) || buttons.has(KEYS.A)
	const D = buttons.has(KEYS.DOWN) || buttons.has(KEYS.S)
	if((me.state & 2) || !(L || R)) me.state &= -5
	if(D ^ buttons.has(KEYS.SHIFT) ^ buttons.has(KEYS.CAPSLOCK)) me.state |= 2
	else me.state &= -3
	if((me.state & 0x10003) == 0x10003) me.state &= -2
	if(D && (me.state & 1)) me.dy = -5
	if(R && !L) me.dx = (me.dx + ((me.state & 3) == 2 ? 1.3 : me.state & 4 ? 8 : 6)) / 2
	else if(L && !R) me.dx = (me.dx + ((me.state & 3) == 2 ? -1.3 : me.state & 4 ? -8 : -6)) / 2
	const {climbable} = getblock(floor(me.x), floor(me.dy > 0 ? me.y : me.y + me.height / 4))
	if(buttons.has(KEYS.UP) || buttons.has(KEYS.W) || buttons.has(KEYS.SPACE)){
		if(climbable) me.dy = (me.dy + 3) / 2
		else if((me.state & 1)) me.dy = 5
		else if(me.state & 0x10000)me.dy = 9
	}
	if((me.state & 0x10000) && (me.state & 2)){
		const x = me.x + (me.dx > 0 ? -me.width + EPSILON * 2 : me.width - EPSILON * 2)
		if(getblock(floor(x), floor(me.y - .001)).solid && !getblock(floor(x + me.dx * dt), floor(me.y - .001)).solid){
			me.dx = 0
		}
	}
}
let lastPressUp = 0, lastPressRight = 0, lastPressLeft = 0
button(KEYS.UP, KEYS.W, KEYS.SPACE, () => {
	if(lastPressUp > t - .3){
		me.state ^= 1
		lastPressUp = 0
	}else lastPressUp = t
})
button(KEYS.RIGHT, KEYS.D, () => {
	if(lastPressRight > t - .3){
		me.state ^= 4
		lastPressRight = 0
	}else lastPressRight = t
})
button(KEYS.LEFT, KEYS.A, () => {
	if(lastPressLeft > t - .3){
		me.state ^= 4
		lastPressLeft = 0
	}else lastPressLeft = t
})
export let renderF3 = false, renderBoxes = false, renderUI = true
button(KEYS.F1, () => renderUI = !renderUI)
button(KEYS.F3, () => {
	if(buttons.has(KEYS.ALT) || buttons.has(KEYS.MOD)) renderBoxes = !renderBoxes
	else renderF3 = !renderF3
})

button(KEYS.NUM_1, () => me.selected = 0)
button(KEYS.NUM_2, () => me.selected = 1)
button(KEYS.NUM_3, () => me.selected = 2)
button(KEYS.NUM_4, () => me.selected = 3)
button(KEYS.NUM_5, () => me.selected = 4)
button(KEYS.NUM_6, () => me.selected = 5)
button(KEYS.NUM_7, () => me.selected = 6)
button(KEYS.NUM_8, () => me.selected = 7)
button(KEYS.NUM_9, () => me.selected = 8)

let cummulative = 0
onwheel(dy => {
	cummulative += dy
	if(cummulative > 60) me.selected = (me.selected + 1) % 9, cummulative = 0
	else if(cummulative < -60) me.selected = (me.selected + 8) % 9, cummulative = 0
})