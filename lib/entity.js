import { render_slot } from "../me.js"
import { TEX_SIZE } from "../textures.js"
import { resetPointer } from "../ui/pointer.js"
import { queue } from "../ui/sounds.js"
import { hideUI } from "../ui/ui.js"
import { entityTextureProps } from "./definitions.js"

globalThis.entities = new Map()
export function addEntity(e){
	entities.set(e._id, e)
	if(meid === e._id){
		me = e
		cam.x = me.x
		cam.y = me.y
		resetPointer()
		running = true
		hideUI()
		for(let i = 0; i < 36; i++)render_slot(i)
		queue(me.world)
	}
}
export function removeEntity(e){
	if(e.node)e.node.remove()
	entities.delete(e._id)
}
export function render(entity, node){
	node.style.transform = `translate(${(Math.ifloat(entity.x-cam.x) * cam.z - entity.width) * TEX_SIZE + innerWidth/2}px, ${-(Math.ifloat(entity.y-cam.y) * cam.z + entity.height/2 * (cam.z - 1)) * TEX_SIZE - innerHeight/2}px) scale(${cam.z})`
	let j = 0
	for(const fns of entity.renderfns){
		let n = node.children[j++], i = 0
		for(let p of entityTextureProps){
			let fn = fns[i++]
			if(fn)n.style.setProperty('--'+p, fn(entity))
		}
	}
}