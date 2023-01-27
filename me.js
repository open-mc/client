import { Blocks, Entities } from "./lib/definitions.js";
import { TEX_SIZE } from "./textures.js";
Object.assign(globalThis, {
	map: new Map(),
	meid: -1, r: 0,
	me: Entities.player({x:0,y:0,_id:-1,dx:0,dy:0,f:0}),
	TPS: 20, ticks: 0,
	world: '',
	cam: {x: 0, y: 0, z: 2},
	gx: 0, gy: 0
})
export function setblock(x, y, b){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	if(!ch)return
	const lx = x & 63
	const ly = y & 63
	ch.tiles[lx + (ly << 6)] = b
	if(ch.ctx){
		ch.ctx.clearRect(lx * TEX_SIZE, (63 - ly) * TEX_SIZE, TEX_SIZE, TEX_SIZE)
		if(b.texture)ch.ctx.drawImage(b.texture, lx * TEX_SIZE, (63 - ly) * TEX_SIZE)
	}
}
export function getblock(x, y){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	return ch ? ch.tiles[(x & 63) + ((y & 63) << 6)] : Blocks.air()
}