import { getblock } from "./world.js"
import { resetPointer } from "./pointer.js"

globalThis.entities = new Map()
export function addEntity(e){
	entities.set(e._id, e)
	if(meid === e._id){
		me = e
		cam.x = me.ix = me.x
		cam.y = me.iy = me.y
		resetPointer(me.f)
	}
}
export function removeEntity(e){
	if(e.node)e.node.remove()
	entities.delete(e._id)
	if(e == me)me = null
}
export function moveEntity(e){
	const ch = map.get((floor(e.ix) >>> 6) + (floor(e.iy) >>> 6) * 67108864) || null
	if(ch != e.chunk)e.chunk&&e.chunk.entities.delete(e), e.chunk = ch, ch&&ch.entities.add(e)
}
export function render(entity, node){
	node.style.transform = `translate(${(ifloat(entity.x-cam.x) * cam.z - entity.width) * TEX_SIZE + visualViewport.width/2}px, ${-(ifloat(entity.y-cam.y) * cam.z + entity.height/2 * (cam.z - 1)) * TEX_SIZE - visualViewport.height/2}px) scale(${cam.z})`
	let j = 0
	for(const fns of entity.renderfns){
		let n = node.children[j++], i = 0
		for(let p of []){
			let fn = fns[i++]
			if(fn)n.style.setProperty('--'+p, fn(entity))
		}
	}
}
const groundDrag = .0000244
const airDrag = 0.667
export let movementFlags = 0
export function stepEntity(e, dt){
	const flags = fastCollision(e, e.dx * dt, e.dy * dt)
	e.dx = e.dx * groundDrag ** dt
	if(e.state & 1)e.dy = 0
	else{
		e.dy -= dt * 32
		e.dy = e.dy * airDrag ** dt
	}
	if(e == me){
		e.ix = e.x
		e.iy = e.y
		movementFlags = flags
	}else{
		//TODO: make interpolation entirely dx/dy based
		e.ix += ifloat(e.x - e.ix) * dt * 20
		e.iy += ifloat(e.y - e.iy) * dt * 20
		//if(tf == tf)e.f = ((e.f+(((tf-e.f)%PI2+PI2+PI)%PI2-PI)*dt*20)%PI2+PI2+PI)%PI2-PI
	}
	moveEntity(e)
}

const EPSILON = .0001
function fastCollision(e, dx, dy){
	let flags = 0
	const x0 = floor(e.x - e.width + EPSILON), x1 = ceil(e.x + e.width - EPSILON)
	y: if(dy > 0){
		const ey = ceil(e.y + e.height + dy - EPSILON) + 1
		for(let y = ceil(e.y + e.height - EPSILON); y < ey; y++){
			for(let x = x0; x < x1; x++){
				const ys = y - (getblock(x, y - 1).solid || false)
				if(ys == y || ys < e.y + e.height - EPSILON)continue
				e.y = min(ys - e.height, e.y + dy)
				e.dy = 0
				break y
			}
		}
		e.y += dy
	}else if(dy < 0){
		const ey = floor(e.y + dy + EPSILON) - 1
		for(let y = floor(e.y + EPSILON); y > ey; y--){
			for(let x = x0; x < x1; x++){
				const ys = y + (getblock(x, y).solid || false)
				if(ys == y || ys > e.y + EPSILON)continue
				e.y = max(ys, e.y + dy)
				e.dy = 0
				flags |= 1
				break y
			}
		}
		e.y += dy
	}
	const y0 = floor(e.y + EPSILON), y1 = ceil(e.y + e.height - EPSILON)
	x: if(dx > 0){
		const ex = ceil(e.x + e.width + dx - EPSILON) + 1
		for(let x = ceil(e.x + e.width - EPSILON); x < ex; x++){
			for(let y = y0; y < y1; y++){
				const xs = x - (getblock(x - 1, y).solid || false)
				if(xs == x || xs < e.x + e.width - EPSILON)continue
				e.x = min(xs - e.width, e.x + dx)
				e.dx = 0
				break x
			}
		}
		e.x += dx
	}else if(dx < 0){
		const ex = floor(e.x - e.width + dx + EPSILON) - 1
		for(let x = floor(e.x - e.width + EPSILON); x > ex; x--){
			for(let y = y0; y < y1; y++){
				const xs = x + (getblock(x, y).solid || false)
				if(xs == x || xs > e.x - e.width + EPSILON)continue
				e.x = max(xs + e.width, e.x + dx)
				e.dx = 0
				break x
			}
		}
		e.x += dx
	}
	e.x = ifloat(e.x)
	e.y = ifloat(e.y)
	return flags
}