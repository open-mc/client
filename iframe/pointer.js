import { getblock, setblock } from './world.js'
import { DataWriter } from '../data.js'
import './controls.js'

export let x = 2, y = 0
export let bx = 0, by = 0, bpx = 0, bpy = 0
export const REACH = 10

export const effectiveReach = () => min(REACH, min(W2, H2) * 1.5 - 1.5)

export function drawPointer(c){
	c.beginPath()
	c.rect(ifloat(x + me.x - cam.x) - .3, ifloat(y + me.head + me.y - cam.y) - .03125, .6, .0625)
	c.rect(ifloat(x + me.x - cam.x) - .03125, ifloat(y + me.head + me.y - cam.y) - .3, .0625, .6)
	c.globalCompositeOperation = 'difference'
	c.fillStyle = '#fff'
	c.fill()
  c.globalCompositeOperation = 'source-over'
	bx = floor(me.x)
	by = floor(me.y + me.head)
	bpx = NaN, bpy = NaN
	const reach = sqrt(x * x + y * y) + 1
	let d = 0, px = me.x - bx, py = me.y + me.head - by
	const dx = sin(me.f), dy = cos(me.f)
	while(d < reach + 1){
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

	if(d > reach){
		bx = bpx = by = bpy = NaN
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
		c.stokeStyle = '#000'
		c.globalAlpha = 0.5
		c.strokeRect(ifloat(bx-cam.x) + 0.03125, ifloat(by-cam.y) + 0.03125, 0.9375, 0.9375)
		c.globalAlpha = 1
	}
	me.f = atan2(x, y)
}
export function onmousemove(mx, my){
	const oldx = x, oldy = y
	const reach = min(10, (min(W2, H2) - 1) * 1.5)
	const s = min(reach, sqrt(x * x + y * y))
	x += mx * 9 ** options.sensitivity / 3 / cam.z / TEX_SIZE
	y += my * 9 ** options.sensitivity / 3 / cam.z / TEX_SIZE
	const ns = sqrt(x * x + y * y)
	if(!ns)return x = y = 0
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
}
export const resetPointer = (f) => {
	let r = min(4, REACH)
	x = sin(f) * r
	y = cos(f) * r
}
button(RBUTTON, () => {
	if(bx != bx)return
	setblock(bx, by, Blocks.air())
	let buf = new DataWriter()
	buf.byte(8)
	buf.int(bx)
	buf.int(by)
	buf.short(0)
	send(buf)
})
button(LBUTTON, () => {
	if(bpx != bpx)return
	let b = me.inv[me.selected]
	if(!b || !b.places)return
	b = b.places()
	if(!b)return
	setblock(bpx, bpy, b)
	let buf = new DataWriter()
	buf.byte(8)
	buf.int(bpx)
	buf.int(bpy)
	buf.short(b.id)
	send(buf)
})