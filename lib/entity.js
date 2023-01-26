import { fly } from "../controls.js"
import { getblock } from "../me.js"
import { TEX_SIZE } from "../textures.js"
import { resetPointer } from "../ui/pointer.js"
import { render_slot } from "../uis/inventory.js"
import { hideUI } from "../ui/ui.js"
import { entityTextureProps } from "./definitions.js"
import { fire } from "./prototype.js"

globalThis.entities = new Map()
export function addEntity(e){
	entities.set(e._id, e)
	if(meid === e._id){
		me = e
		cam.x = me.x = me.tx
		cam.y = me.y = me.ty
		resetPointer(me.f)
		fire('me')
		hideUI()
		for(let i = 0; i < 36; i++)render_slot(i)
	}
}
export function removeEntity(e){
	if(e.node)e.node.remove()
	entities.delete(e._id)
	if(e == me)me._id = -1
}
export function moveEntity(e){
	const ch = map.get((floor(e.tx) >>> 6) + (floor(e.ty) >>> 6) * 67108864) || null
	if(ch != e.chunk)e.chunk&&e.chunk.entities.delete(e), e.chunk = ch, ch&&ch.entities.add(e)
}
export function render(entity, node){
	node.style.transform = `translate(${(Math.ifloat(entity.x-cam.x) * cam.z - entity.width) * TEX_SIZE + visualViewport.width/2}px, ${-(Math.ifloat(entity.y-cam.y) * cam.z + entity.height/2 * (cam.z - 1)) * TEX_SIZE - visualViewport.height/2}px) scale(${cam.z})`
	let j = 0
	for(const fns of entity.renderfns){
		let n = node.children[j++], i = 0
		for(let p of entityTextureProps){
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
	if(e == me){
		e.tx = e.x
		e.ty = e.y
		movementFlags = flags
		e.dx = e.dx * groundDrag ** dt
		if(fly)e.dy = 0
		else{
			e.dy -= dt * 32
			e.dy = e.dy * airDrag ** dt
		}
		moveEntity(e)
	}else{
		e.dx = e.dx * groundDrag ** dt
		e.dy = e.dy * airDrag ** dt
		e.dy -= dt * 32
		const {tx, ty} = e
		//TODO: make interpolation entirely dx/dy based
		e.x += Math.ifloat(tx - e.x) * dt * 20
		e.y += Math.ifloat(ty - e.y) * dt * 20
	}
	//if(tf == tf)e.f = ((e.f+(((tf-e.f)%PI2+PI2+PI)%PI2-PI)*dt*20)%PI2+PI2+PI)%PI2-PI
}
const {floor, ceil, min, max} = Math
//Deprecated because of overcomplication with non-full blocks and also it's a bit slower
/*function fastRhombusCollision(e, dx, dy){
	let retx = e.x + dx, rety = e.y + dy
	let d = sqrt(dx * dx + dy * dy)
	dx /= d; dy /= d
	let px, bx, py, by
	let flags = 0
	const u = dy > 0, r = dx >= 0
	if(r) bx = floor(e.x + e.width), px = e.x + e.width - bx
	else bx = floor(e.x - e.width), px = e.x - e.width - bx
	if(u) by = floor(e.y + e.height), py = e.y + e.height - by
	else by = floor(e.y), py = e.y - by
	while(d > 0){
		if(dx){
			let ly = floor(u ? by + py - e.height : by + py) - 1
			let end = -floor(-(u ? by + py : by + py + e.height))
			while(dx && ++ly < end)if(getblock(bx, ly).solid) dx = 0, dy = sign(dy), retx = r ? bx + px - e.width : bx + px + e.width, e.dx = 0
		}
		if(dy){
			let lx = floor(r ? bx + px - e.width * 2 : bx + px) - 1
			let end = -floor(-(r ? bx + px : bx + px + e.width * 2))
			while(dy && ++lx < end)if(getblock(lx, by).solid) flags |= dy < 0, dy = 0, dx = sign(dx), rety = by + py - u * e.height, e.dy = 0
		}
		if(dy > 0){
			const ix = px + dx * (1 - py) / dy
			if(ix >= 0 && ix <= 1){by++; d -= (1 - py) / dy; py = 0; px = ix; continue}
		}else if(dy < 0){
			const ix = px + dx * -py / dy
			if(ix >= 0 && ix <= 1){by--; d -= -py / dy; py = 1; px = ix; continue}
		}
		if(dx > 0){
			const iy = py + dy * (1 - px) / dx
			if(iy >= 0 && iy <= 1){bx++; d -= (1 - px) / dx; px = 0; py = iy; continue}
		}else if(dx < 0){
			const iy = py + dy * -px / dx
			if(iy >= 0 && iy <= 1){bx--; d -= -px / dx; px = 1; py = iy; continue}
		}
		break
	}
	e.x = Math.ifloat(retx)
	e.y = Math.ifloat(rety)
	return flags
}*/
//In favor of this
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
	e.x = Math.ifloat(e.x)
	e.y = Math.ifloat(e.y)
	return flags
}