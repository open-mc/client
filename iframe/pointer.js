import { setblock, onPlayerLoad, getblock, map, cam } from 'world'
import './controls.js'
import { button, onmousemove, onjoypad, W2, H2, options, paused, renderUI } from 'api'

export let x = 2, y = 0
export let bx = 0, by = 0, bpx = 0, bpy = 0
export const REACH = 10

export const effectiveReach = () => max(1, min(REACH, min(W2, H2) * 1.5 - 1.5))
let lastPlace = 0
let jrx = 0, jry = 0
drawPhase(-1000, () => {
	a: if(options.joy == 0){
		if(cursor.jrx || cursor.jry) pointerMoved(cursor.jrx * 100, cursor.jry * 100)
	}else if(options.joy == 1){
		const reach = effectiveReach()
		if(cursor.jrx || cursor.jry){
			void({jrx, jry} = cursor)
			const ns = sqrt(jrx * jrx + jry * jry)*reach
			if(ns < 1) jrx/=ns, jry/=ns
		}else{
			const ns = sqrt(jrx * jrx + jry * jry)*reach
			if(ns) jrx/=ns, jry/=ns
			else break a
		}
		x += (jrx * reach - x) / 3; y += (jry * reach - y) / 3
	}
	if(options.camera == 0){
		cam.x += (x - oldx) / 3
		cam.y += (y - oldy) / 3
	}
	oldx = x; oldy = y
	if(x||y)me.f = atan2(x, y)
})
export function drawPointer(c){
	if(!renderUI) return
	c.beginPath()
	c.rect(ifloat(x + me.x - cam.x) - .3, ifloat(y + me.head + me.y - cam.y) - .03125, .6, .0625)
	c.rect(ifloat(x + me.x - cam.x) - .03125, ifloat(y + me.head + me.y - cam.y) - .3, .0625, .6)
	c.globalCompositeOperation = 'difference'
	c.fillStyle = '#ccc'
	c.fill()
  c.globalCompositeOperation = 'source-over'
	bx = floor(me.x)
	by = floor(me.y + me.head)
	bpx = NaN, bpy = NaN
	const reach = sqrt(x * x + y * y)
	let d = 0, px = me.x - bx, py = me.y + me.head - by
	const dx = sin(me.f), dy = cos(me.f)
	while(d < reach){
		if(getblock(bx, by).solid)break
		bpx = bx
		bpy = by
		if(dx > 0){
			const iy = py + dy * (1 - px) / dx
			if(iy >= 0 && iy <= 1){bx++; d += (1 - px) / dx; px = 0; py = iy; continue}
		}else if(dx < 0){
			const iy = py + dy * -px / dx
			if(iy >= 0 && iy <= 1){bx--; d += -px / dx; px = 1; py = iy; continue}
		}
		if(dy > 0){
			const ix = px + dx * (1 - py) / dy
			if(ix >= 0 && ix <= 1){by++; d += (1 - py) / dy; py = 0; px = ix; continue}
		}else if(dy < 0){
			const ix = px + dx * -py / dy
			if(ix >= 0 && ix <= 1){by--; d += -py / dy; py = 1; px = ix; continue}
		}
	}
	if(d >= reach) bx = by = NaN
	if(!getblock(bpx + 1, bpy).solid && !getblock(bpx - 1, bpy).solid && !getblock(bpx, bpy + 1).solid && !getblock(bpx, bpy - 1).solid){
		bpx = bpy = NaN
	}else{
		let x = bpx - 32 >>> 6, y = bpy - 32 >>> 6, x1 = x + 1 & 0x3FFFFFF, y1 = y + 1 & 0x3FFFFFF
		a: for(const ch of [map.get(x+y*0x4000000), map.get(x1+y*0x4000000), map.get(x+y1*0x4000000), map.get(x1+y1*0x4000000)])
			if(ch)for(const e of ch.entities)
				if(e.y < bpy + 1 && e.y + e.height > bpy && e.x - e.width < bpx + 1 && e.x + e.width > bpx){
					//Don't allow placing because there is an entity in the way
					bpx = bpy = NaN
					break a
				}
		c.lineWidth = 0.0625
		c.strokeStyle = '#000'
		c.fillStyle = '#000'
		c.globalAlpha = 0.5
		const xd = ifloat(bx-cam.x), yd = ifloat(by-cam.y)
		c.strokeRect(xd + 0.03125, yd + 0.03125, 0.9375, 0.9375)
		
		if(bpx > bx){
			c.fillRect(xd + 1, yd, 0.125, 0.0625)
			c.fillRect(xd + 1, yd + 0.9375, 0.125, 0.0625)
		}else if(bpx < bx){
			c.fillRect(xd - 0.125, yd, 0.125, 0.0625)
			c.fillRect(xd - 0.125, yd + 0.9375, 0.125, 0.0625)
		}else if(bpy > by){
			c.fillRect(xd, yd + 1, 0.0625, 0.125)
			c.fillRect(xd + 0.9375, yd + 1, 0.0625, 0.125)
		}else if(bpy < by){
			c.fillRect(xd, yd - 0.125, 0.0625, 0.125)
			c.fillRect(xd + 0.9375, yd - 0.125, 0.0625, 0.125)
		}
		c.globalAlpha = 1
	}
}
let didHit = false
export function checkBlockPlacing(buf){
	const hasP = buttons.has(options.click ? LBUTTON : RBUTTON) || buttons.has(options.click ? GAMEPAD.LT : GAMEPAD.RT)
	const hasB = buttons.has(options.click ? RBUTTON : LBUTTON) || buttons.has(options.click ? GAMEPAD.RT : GAMEPAD.LT)
	if(hasP && t > lastPlace + .12 && !paused){
		let b = me.inv[me.selected]
		if(b && bpx == bpx && b.places && (b = b.places())) setblock(bpx, bpy, b)
		buf.byte(me.selected)
		buf.float(x); buf.float(y)
		lastPlace = t
	}else if(hasB && bx == bx && !paused){
		buf.byte(me.selected | 128)
		buf.float(x); buf.float(y)
		blockbreakx = bx; blockbreaky = by
		me.state |= 8; lastPlace = t
	}else{
		buf.byte(me.selected); buf.float(NaN); buf.float(me.f)
		let id = 281474976710655 // -1
		const hitBtnDown = hasB && !paused
		if(hitBtnDown && !didHit){
			const xp = me.x + x, yp = me.y + me.head + y
			const xa = xp - 32 >>> 6, ya = yp - 32 >>> 6, x1 = xa + 1 & 0x3FFFFFF, y1 = ya + 1 & 0x3FFFFFF
			a: for(const ch of [map.get(xa+ya*0x4000000), map.get(x1+ya*0x4000000), map.get(xa+y1*0x4000000), map.get(x1+y1*0x4000000)]) if(ch)for(const e of ch.entities)
				if(e.y < yp && e.y + e.height > yp && e.x - e.width < xp && e.x + e.width > xp){
					// Found entity
					id = e.netId
					break a
				}
			didHit = true
		}else if(!hitBtnDown) didHit = false
		buf.uint32(id|0), buf.short(id/4294967296|0)
		blockbreakx = blockbreaky = NaN
		me.state &= -9
	}
}
export let blockbreakx = NaN, blockbreaky = NaN
button(LBUTTON, RBUTTON, GAMEPAD.LT, GAMEPAD.RT, () => {lastPlace = 0})
let oldx = 0, oldy = 0
export function pointerMoved(dx, dy){
	jrx = jry = 0
	const reach = effectiveReach()
	const s = min(reach, sqrt(x * x + y * y))
	x += dx * 9 ** options.sensitivity / 3 / cam.z / TEX_SIZE
	y += dy * 9 ** options.sensitivity / 3 / cam.z / TEX_SIZE
	const ns = sqrt(x * x + y * y)
	if(!ns) return x = y = 0
	if(ns > s){
		x /= ns
		y /= ns
		const vec = s + (min(ns, reach) - s) * (1 - (s / reach) ** 4)
		x *= vec
		y *= vec
	}
}
onmousemove(pointerMoved)
export const reset = (f) => {
	let r = min(4, REACH)
	x = oldx = sin(f) * r
	y = oldy = cos(f) * r
}

// I am flabbergasted this is even possible
import * as pointer from './pointer.js'
import { drawPhase } from './api.js'
