import { button, onwheel, paused } from 'api'
import { EPSILON, mePhysics } from './entity.js'
import { getblock } from 'world'
let R=false,L=false,U=false,D=false
let lastPressUp = 0, lastPressRight = 0, lastPressLeft = 0

export const playerControls = () => {
	if(paused) return
	const r = buttons.has(KEYS.RIGHT) || buttons.has(KEYS.D) || cursor.jlx > 0.4
	const l = buttons.has(KEYS.LEFT) || buttons.has(KEYS.A) || cursor.jlx < -0.4
	const u = buttons.has(KEYS.UP) || buttons.has(KEYS.W) || buttons.has(KEYS.SPACE) || buttons.has(GAMEPAD.A) || cursor.jly > 0.4
	const d = buttons.has(KEYS.DOWN) || buttons.has(KEYS.S) || cursor.jly < -0.4
	if(r&&!R){
		if(lastPressRight > t - .3){
			me.state ^= 4
			lastPressRight = 0
		}else lastPressRight = t
	}
	if(l&&!L){
		if(lastPressLeft > t - .3){
			me.state ^= 4
			lastPressLeft = 0
		}else lastPressLeft = t
	}
	if(u&&!U){
		if(lastPressUp > t - .3){
			if(perms>=3)me.state ^= 1
			lastPressUp = 0
		}else lastPressUp = t
	}
	R=r;L=l;U=u;D=d
	if((me.state & 2) || !(L || R)) me.state &= -5
	if(D ^ (buttons.has(KEYS.SHIFT) | buttons.has(GAMEPAD.B)) ^ buttons.has(KEYS.CAPSLOCK)) me.state |= 2
	else me.state &= -3
	if((me.state | ~0x10003) === -1) me.state &= -2
	if(D && (me.state & 1)) me.dy = -5
	if(R && !L) me.dx = (me.dx + ((me.state & 3) == 2 ? 1.3 : me.state & 4 ? 8 : 6)) / 2 * mePhysics.factor
	else if(L && !R) me.dx = (me.dx + ((me.state & 3) == 2 ? -1.3 : me.state & 4 ? -8 : -6)) / 2 * mePhysics.factor
	if(U){
		if(mePhysics.climbable) me.dy = (me.dy + 4*mePhysics.factor) / 2
		else if((me.state & 1)) me.dy = 5
		else if(me.impactDy < 0)me.dy = 9*mePhysics.factor
	}
	if((me.impactDy < 0) && (me.state & 2)){
		const x = me.x + (me.dx > 0 ? -me.width + EPSILON * 2 : me.width - EPSILON * 2)
		if(getblock(floor(x), floor(me.y - .001)).solid && !getblock(floor(x + me.dx * dt + sign(me.dx)*.125), floor(me.y - .001)).solid){
			me.dx = 0
		}
	}
}

button(KEYS.NUM_1, () => {me.selected = 0})
button(KEYS.NUM_2, () => {me.selected = 1})
button(KEYS.NUM_3, () => {me.selected = 2})
button(KEYS.NUM_4, () => {me.selected = 3})
button(KEYS.NUM_5, () => {me.selected = 4})
button(KEYS.NUM_6, () => {me.selected = 5})
button(KEYS.NUM_7, () => {me.selected = 6})
button(KEYS.NUM_8, () => {me.selected = 7})
button(KEYS.NUM_9, () => {me.selected = 8})

let cummulative = 0
onwheel(dy => {
	cummulative += dy
	if(cummulative > 60)
		me.selected = (me.selected + 1) % 9, cummulative = 0
	else if(cummulative < -60)
		me.selected = (me.selected + 8) % 9, cummulative = 0
})
button(GAMEPAD.LB, () => me.selected = (me.selected + 8) % 9)
button(GAMEPAD.RB, () => me.selected = (me.selected + 1) % 9)