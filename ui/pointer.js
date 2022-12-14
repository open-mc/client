import { getblock, getselected, setblock } from "../me.js"
import { BlockIDs } from "../lib/definitions.js"
import { TEX_SIZE } from "../textures.js"
import { ui, showUI } from "./ui.js"
import { pause } from "../uis/pauseui.js"
import { DataWriter } from "../lib/data.js"

export let x = 2, y = 0
export let bx = 0, by = 0, bpx = 0, bpy = 0
export const REACH = 10
export function position(){
	pointer.style.transform = `translate(${((Math.ifloat(x+me.x-cam.x)*ZPX)+visualViewport.width/2) - 10}px, ${-(Math.ifloat(y+me.head+me.y-cam.y)*ZPX) - visualViewport.height/2 + 1}px)`
	bx = Math.floor(me.x)
	by = Math.floor(me.y + me.head)
	bpx = NaN, bpy = NaN
	const reach = Math.sqrt(x * x + y * y) + 1
	let d = 0, px = me.x - bx, py = me.y + me.head - by
	const dx = Math.sin(me.f), dy = Math.cos(me.f)
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
			if(ix > 0 && ix < 1){by++; d += (1 - py) / dy; py = 0; px = ix; continue}
		}else if(dy < 0){
			const ix = px + dx * -py / dy
			if(ix > 0 && ix < 1){by--; d += -py / dy; py = 1; px = ix; continue}
		}
	}
	pointer2.hidden = d > reach
	if(d > reach)bx = bpx = by = bpy = NaN
	else{
		let x = bpx - 32 >>> 6, y = bpy - 32 >>> 6, x1 = x + 1 & 67108863, y1 = y + 1 & 67108863
		a: for(const ch of [map.get(x+y*67108864), map.get(x1+y*67108864), map.get(x+y1*67108864), map.get(x1+y1*67108864)])
			if(ch)for(const e of ch.entities)
				if(e.y < bpy + 1 && e.y + e.height > bpy && e.x - e.width < bpx + 1 && e.x + e.width > bpx){
					//Don't allow placing because there is an entity in the way
					bpx = bpy = NaN
					break a
				}
	}
	pointer2.style.transform = `translate(${((Math.ifloat(bx+0.5-cam.x)*ZPX)+Math.floor(visualViewport.width/2) - ZPX/2)}px, ${(-Math.ifloat(by+0.5-cam.y)*ZPX + Math.ceil(visualViewport.height/-2) + ZPX/2)}px)`
	me.f = Math.atan2(x, y)
}
chunks.onmousedown = function(e){
	if(e.button == 2){
		if(bx != bx)return
		setblock(bx, by, Blocks.air())
		let buf = new DataWriter()
		buf.byte(8)
		buf.int(bx)
		buf.int(by)
		buf.short(0)
		buf.pipe(ws)
	}else{
		if(bpx != bpx)return
		let b = me.inv[getselected()]
		b && (b = Blocks[b.places])
		b && (b = b())
		if(!b)return
		setblock(bpx, bpy, b)
		let buf = new DataWriter()
		buf.byte(8)
		buf.int(bpx)
		buf.int(bpy)
		buf.short(b.id)
		buf.pipe(ws)
	}
}
let wasFullscreen = false
HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
document.onpointerlockerror = document.onpointerlockchange = function(e){
	if(document.pointerLockElement){
		if(wasFullscreen)document.documentElement.requestFullscreen()
		pointer.hidden = pointer2.hidden = false
	}else{
		wasFullscreen = !!(!ui && document.fullscreenElement)
		if(wasFullscreen)document.exitFullscreen ? document.exitFullscreen().catch(Function.prototype) : document.webkitExitFullscreen()
		pointer.hidden = pointer2.hidden = true
		if(!ui)pause()
	}
}

chunks.onmousemove = function({movementX, movementY}){
	if(!document.pointerLockElement)return
	const oldx = x, oldy = y
	const reach = Math.min(REACH, (Math.min(W2, H2) - 1) * 1.5)
	const s = Math.min(reach, Math.sqrt(x * x + y * y))
	x += movementX / cam.z / TEX_SIZE
	y += -movementY / cam.z / TEX_SIZE
	const ns = Math.sqrt(x * x + y * y)
	if(!ns)return x = y = 0
	if(ns > s){
		x /= ns
		y /= ns
		const vec = s + (Math.min(ns, reach) - s) * (1 - (s / reach) ** 4)
		x *= vec
		y *= vec
	}
	cam.x += (x - oldx) / 3
	cam.y += (y - oldy) / 3
}
export const resetPointer = (f) => {
	let r = Math.min(4, REACH)
	x = Math.sin(f) * r
	y = Math.cos(f) * r
}