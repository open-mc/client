import { TEX_SIZE } from "../textures.js"
import { entityTextureProps } from "./definitions.js"
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