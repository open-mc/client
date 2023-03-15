import { Blocks } from 'definitions'

export function setblock(x, y, b){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	if(!ch)return
	const lx = x & 63
	const ly = y & 63
	const old = ch.tiles[lx + (ly << 6)]
	ch.tiles[lx + (ly << 6)] = b
	i: if(ch.ctx){
		const t = b.texture
		ch.ctx.clearRect(lx * TEX_SIZE, (63 - ly) * TEX_SIZE, TEX_SIZE, TEX_SIZE)
		if(!t)break i
		if(b.texture)ch.ctx.drawImage(t.canvas,t.x,t.y,t.w,t.h,lx*TEX_SIZE,(63-ly)*TEX_SIZE,TEX_SIZE,TEX_SIZE)
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
		if(!me)postMessage(false, '*')
		me = e
		cam.x = me.ix = me.x
		cam.y = me.iy = me.y
		for(const cb of playerLoadCb) cb(me)
	}
}
export function removeEntity(e){
	if(!e) return
	entities.delete(e._id)
	if(e == me) me._id = -1
	if(e.chunk) e.chunk.entities.delete(e)
	if(e.removed) e.removed()
}

const playerLoadCb = []
export const onPlayerLoad = cb => playerLoadCb.push(cb)
const SPEEDOFSOUND = 340
sound = function(fn, x, y, vol = 1, pitch = 1){
	if(!me) return
	x -= me.x - .5; y -= me.y + me.head - .5
	const dist = sqrt(x * x + y * y)
	// Let's see if I can get the physics right from the top of my head
	// The speed of sound is 340m/s. This means a speed of 340m/s => 2x pitch, -170m/s => 0.5x pitch, -340m/s => 0x pitch
	// The dot product of (x0,y0) . (x1,y1) is x0*x1 + y0*y1
	// "Fix" the inputs x and y by normalizing them with `/ dist`
	const speed = (me.dx * x + me.dy * y) / dist
	// For 2d, the inverse square law becomes the inverse linear law
	fn(vol * 2 / (dist + 1), pitch * max(SPEEDOFSOUND / 100, speed + SPEEDOFSOUND) / SPEEDOFSOUND, min(1, max(-1, x / 16)))
}

export const blockEvents = new Map
export const blockEventDefs = new Array(255)
export const blockEventIfns = new Array(255)
blockevent = (id, r, r2) => (blockEventDefs[id] = r, blockEventIfns[id] = r2)

//export const entityEvents = new Map
//export const entityEventDefs = new Array(255)
//export const entityEventIfns = new Array(255)
//entityevent = (id, r, r2) => (entityEventDefs[id] = r, entityEventIfns[id] = r2)