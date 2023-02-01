export function setblock(x, y, b){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	if(!ch)return
	const lx = x & 63
	const ly = y & 63
	ch.tiles[lx + (ly << 6)] = b
	if(ch.ctx){
		ch.ctx.clearRect(lx * TEX_SIZE, (63 - ly) * TEX_SIZE, TEX_SIZE, TEX_SIZE)
		if(b.texture)ch.ctx.image(b.texture, lx * TEX_SIZE, (63 - ly) * TEX_SIZE)
	}
}
export function getblock(x, y){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	return ch ? ch.tiles[(x & 63) + ((y & 63) << 6)] : Blocks.air()
}

export function addEntity(e){
	entities.set(e._id, e)
	if(meid === e._id){
		if(!me)postMessage(null, '*')
		me = e
		cam.x = me.ix = me.x
		cam.y = me.iy = me.y
		for(const cb of playerLoadCb) cb(me)
	}
}
export function removeEntity(e){
	if(e.node)e.node.remove()
	entities.delete(e._id)
	if(e == me) me._id = -1
}
export function moveEntity(e){
	const ch = map.get((floor(e.x) >>> 6) + (floor(e.y) >>> 6) * 67108864) || null
	if(ch != e.chunk)e.chunk&&e.chunk.entities.delete(e), e.chunk = ch, ch&&ch.entities.add(e)
}

const playerLoadCb = []
export const onPlayerLoad = cb => playerLoadCb.push(cb)