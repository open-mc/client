import { getblock, map } from 'world'

const groundDrag = .0000244
const airDrag = 0.06
const yDrag = 0.667

export function stepEntity(e){
	e.preupdate?.()
	e.state = (e.state & 0xffff) | (e.state << 8 & 0xff000000) | fastCollision(e, e.dx * dt, e.dy * dt) << 16
	if(e.state & 1)e.dy = 0
	else{
		e.dy += dt * gy * e.gy
		e.dy = e.dy * yDrag ** dt
		e.dx += dt * gx * e.gx
	}
	e.dx = e.dx * (e.state & 0x10000 ? groundDrag : airDrag) ** dt
	if(e == me || dt > 1/30)e.ix = e.x, e.iy = e.y
	else{
		e.ix += ifloat(e.x - e.ix) * dt * 20
		e.iy += ifloat(e.y - e.iy) * dt * 20
	}
	moveEntity(e)
	e.age += dt * TPS
	e.update?.()
}
export function moveEntity(e){
	const ch = map.get((floor(e.x) >>> 6) + (floor(e.y) >>> 6) * 67108864) || null
	if(ch != e.chunk)e.chunk&&e.chunk.entities.delete(e), e.chunk = ch, ch&&ch.entities.add(e)
}

export const EPSILON = .0001
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