export function setblock(x, y, b, natural = true){
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
		if(b.texture)ch.ctx.drawImage(t.img,t.x,t.y,t.w,t.h,lx*TEX_SIZE,(63-ly)*TEX_SIZE,TEX_SIZE,TEX_SIZE)
	}
	if(natural && old.constructor != b.constructor){
		if(b.place) b.place(x, y)
		if(old.solid && old.break) old.break(x, y)
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
	entities.delete(e._id)
	if(e == me) me._id = -1
}
export function moveEntity(e){
	const ch = map.get((floor(e.x) >>> 6) + (floor(e.y) >>> 6) * 67108864) || null
	if(ch != e.chunk)e.chunk&&e.chunk.entities.delete(e), e.chunk = ch, ch&&ch.entities.add(e)
}

const playerLoadCb = []
export const onPlayerLoad = cb => playerLoadCb.push(cb)
const SPEEDOFSOUND = 340
sound = function(fn, x, y, vol = 1, pitch = 1){
	x -= me.x - .5; y -= me.y + me.head - .5
	const dist = sqrt(x * x + y * y)
	// Let's see if I can get the physics right from the top of my head
	// The speed of sound is 340m/s. This means a speed of 340m/s => 2x pitch, -170m/s => 0.5x pitch, -340m/s => 0x pitch
	// The dot product of (x0,y0) . (x1,y1) is x0*x1 + y0*y1
	// "Fix" the inputs x and y by normalizing them with `/ dist`
	const speed = (me.dx * x + me.dy * y) / dist
	// For 2d, the inverse square law becomes the inverse linear law
	fn(vol * 2 / (dist + 1), pitch * max(SPEEDOFSOUND / 100, speed + SPEEDOFSOUND) / SPEEDOFSOUND)
}