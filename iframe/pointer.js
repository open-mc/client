import { setblock, onPlayerLoad, getblock, map } from 'world'
import './controls.js'
import { button, onmousemove, W2, H2, options, paused, renderUI } from 'api'

export let x = 2, y = 0
export let bx = 0, by = 0, bpx = 0, bpy = 0
export const REACH = 10

export const effectiveReach = () => max(1, min(REACH, min(W2, H2) * 1.5 - 1.5))
let lastPlace = 0
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
		let x = bpx - 32 >>> 6, y = bpy - 32 >>> 6, x1 = x + 1 & 67108863, y1 = y + 1 & 67108863
		a: for(const ch of [map.get(x+y*67108864), map.get(x1+y*67108864), map.get(x+y1*67108864), map.get(x1+y1*67108864)])
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
	if(buttons.has(options.click ? LBUTTON : RBUTTON) && t > lastPlace + .12 && !paused){
		let b = me.inv[me.selected]
		if(b && bpx == bpx && b.places && (b = b.places())) setblock(bpx, bpy, b)
		buf.byte(me.selected)
		buf.float(x); buf.float(y)
		lastPlace = t
	}else if(buttons.has(options.click ? RBUTTON : LBUTTON) && bx == bx && !paused){
		buf.byte(me.selected | 128)
		buf.float(x); buf.float(y)
		blockbreakx = bx; blockbreaky = by
		me.state |= 8; lastPlace = t
	}else{
		buf.byte(me.selected); buf.float(NaN); buf.float(me.f)
		let id = 281474976710655 // -1
		const hitBtnDown = buttons.has(options.click ? RBUTTON : LBUTTON) && !paused
		if(hitBtnDown && !didHit){
			const xp = me.x + x, yp = me.y + me.head + y
			const xa = xp - 32 >>> 6, ya = yp - 32 >>> 6, x1 = xa + 1 & 67108863, y1 = ya + 1 & 67108863
			a: for(const ch of [map.get(xa+ya*67108864), map.get(x1+ya*67108864), map.get(xa+y1*67108864), map.get(x1+y1*67108864)]) if(ch)for(const e of ch.entities)
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
button(LBUTTON, RBUTTON, () => {lastPlace = 0})
onmousemove((dx, dy) => {
	if(!me) return
	if(paused){
		const upscale = options.guiScale * 2
		mx = dx * devicePixelRatio; my = dy * devicePixelRatio
		return
	}
	const oldx = x, oldy = y
	const reach = pointer.effectiveReach()
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
	if(options.camera == 0){
		cam.x += (x - oldx) / 3
		cam.y += (y - oldy) / 3
	}
	me.f = atan2(x, y)
})
export const reset = (f) => {
	let r = min(4, REACH)
	x = sin(f) * r
	y = cos(f) * r
}

// I am flabbergasted this is even possible
import * as pointer from "./pointer.js"