import { getblock, getselected, setblock } from "../me.js"
import { BlockIDs } from "../lib/definitions.js"
import { TEX_SIZE } from "../textures.js"
import { ui, showUI } from "./ui.js"
import { pause } from "../uis/pauseui.js"
import { DataWriter } from "../lib/data.js"

export let x = 2, y = 0
export const REACH = 10
export function position(){
	pointer.style.transform = `translate(${((Math.ifloat(x+me.x-cam.x)*ZPX)+innerWidth/2) - 10}px, ${-(Math.ifloat(y+me.head+me.y-cam.y)*ZPX) - innerHeight/2 + 1}px)`
	pointer2.style.transform = `translate(${((Math.ifloat(Math.floor(x+me.x)+0.5-cam.x)*ZPX)+Math.floor(innerWidth/2) - ZPX/2)}px, ${(-Math.ifloat(Math.floor(y+me.head+me.y)+0.5-cam.y)*ZPX + Math.ceil(innerHeight/-2) + ZPX/2)}px)`
	me.f = Math.atan2(x, y)
}
chunks.onmousedown = function(e){
	const px = Math.floor(x + me.x)
	const py = Math.floor(y + me.y + me.head)
	let b = me.inv[getselected()]
	b = Blocks[e.button == 2 ? 'air' : b && b.places]
	if(b && (b = b())){
		setblock(px, py, b)
		let buf = new DataWriter()
		buf.byte(8)
		buf.int(px)
		buf.int(py)
		buf.short(b.id)
		buf.pipe(ws)
	}
}
let wasFullscreen = false
HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
document.onpointerlockchange = function(e){
	if(document.pointerLockElement){
		if(wasFullscreen)document.documentElement.requestFullscreen()
		pointer.style.display = pointer2.style.display = 'block'
	}else{
		wasFullscreen = !!(!ui && document.fullscreenElement)
		if(wasFullscreen)document.exitFullscreen ? document.exitFullscreen().catch(Function.prototype) : document.webkitExitFullscreen()
		pointer.style.display = pointer2.style.display = 'none'
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
export const resetPointer = () => {x=2;y=0}