import { getblock, map } from 'world'

const groundDrag = .0000244
const airDrag = 0.06
const yDrag = 0.667

export function stepEntity(e){
	if(e != me && !e.shouldSimulate()) return
	e.preupdate?.()
	e.state = (e.state & 0xFFFEFFFF) | (e.impactDy<0)<<16
	fastCollision(e)
	if(e != me && !e.shouldSimulate()) return
	if(e.state & 1)e.dy = 0
	else{
		e.dy += dt * gy * e.gy
		e.dy = e.dy * yDrag ** dt
		e.dx += dt * gx * e.gx
	}
	e.dx = e.dx * (e.impactDy < 0 ? groundDrag : airDrag) ** dt
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
	const ch = map.get((floor(e.x) >>> 6) + (floor(e.y) >>> 6) * 0x4000000) || null
	if(ch != e.chunk)e.chunk&&e.chunk.entities.delete(e), e.chunk = ch, ch&&ch.entities.add(e)
}
export let meImpact = {dx: 0, dy: 0}
export const EPSILON = .0001

function solidCheck(x0, y0, x1, y1){
	const ex = floor(x1 - EPSILON), ey = floor(y1 - EPSILON), sx = floor(x0 + EPSILON), sy = floor(y0 + EPSILON)
	for(let x = sx; x <= ex; x++) for(let y = sy; y <= ey; y++){
		const {solid, blockShape} = getblock(x, y)
		if(!solid) continue
		if(!blockShape) return true
		for(let i = 0; i < blockShape.length; i+=4){
			if(blockShape[i]+x>=x1 | blockShape[i+2]+x<=x0) continue
			if(blockShape[i+1]+y>=y1 | blockShape[i+3]+y<=y0) continue
			return true
		}
	}
	return false
}

function fastCollision(e){
	const dx = e.dx * dt, dy = e.dy * dt
	const x0 = floor(e.x - e.width + EPSILON)
	let y0 = floor(e.y + EPSILON)
	const CLIMB = (e.impactDy < 0 ? e.stepHeight ?? 0.01 : 0.01)
	e.impactDx = e.impactDy = 0
	const xw = e.x + e.width - EPSILON - x0
	y: if(dy > 0){
		const ey = ceil(e.y + e.height + dy - EPSILON) - y0
		for(let y = ceil(e.y + e.height - EPSILON) - y0 - 1; y < ey; y++){
			let ys = 2, ex0 = e.x - e.width + EPSILON - x0 + 1, ex1 = e.x + e.width - x0 - EPSILON + 1
			for(let x = 0; x < xw; x++){
				ex0 -= 1; ex1 -= 1
				const {solid, blockShape} = getblock(x0 + x, y0 + y)
				if(!solid) continue
				if(!blockShape){ ys = 0; break }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ex0 >= blockShape[i+2] | ex1 <= blockShape[i]) continue
					if(blockShape[i + 1] <= ys) ys = blockShape[i + 1]
				}
			}
			const ty = ys + y + y0 - e.height
			if((y === ey - 1 ? ty >= e.y + dy + EPSILON : ys > 1) || ty < e.y - EPSILON) continue
			e.y = ty
			e.impactDy = e.dy
			if(e == me && abs(meImpact.dy) < e.dy) meImpact.dy = e.dy
			e.dy = 0
			break y
		}
		e.y = ifloat(e.y + dy)
	}else if(dy < 0){
		const ey = floor(e.y + dy + EPSILON) - 1 - y0
		for(let y = 0; y > ey; y--){
			let ys = -1, ex0 = e.x - e.width + EPSILON - x0 + 1, ex1 = e.x + e.width - x0 - EPSILON + 1
			for(let x = 0; x < xw; x++){
				ex0 -= 1; ex1 -= 1
				const {solid, blockShape} = getblock(x0 + x, y0 + y)
				if(!solid) continue
				if(!blockShape){ ys = 1; break }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ex0 >= blockShape[i+2] | ex1 <= blockShape[i]) continue
					if(blockShape[i + 3] > ys) ys = blockShape[i + 3]
				}
			}
			const ty = ys + y + y0
			if((y === ey + 1 ? ty <= e.y + dy - EPSILON : ys < 0) || ty > e.y + EPSILON) continue
			e.y = ty
			e.impactDy = e.dy
			if(e == me && abs(meImpact.dy) < -e.dy) meImpact.dy = e.dy
			e.dy = 0
			break y
		}
		e.y = ifloat(e.y + dy)
	}
	y0 = floor(e.y + EPSILON)
	x: if(dx > 0){
		const ex = ceil(e.x + e.width + dx - EPSILON) - x0
		for(let x = ceil(e.x + e.width - EPSILON) - x0 - 1; x < ex; x++){
			let xs = 2, ey0 = e.y + EPSILON - y0 + 1
			let climb = 0
			const yh = e.y + e.height - EPSILON - y0
			for(let y = 0; y < yh; y++){
				ey0 -= 1
				const {solid, blockShape} = getblock(x0 + x, y0 + y)
				if(!solid) continue
				if(!blockShape){ xs = 0; if(1-ey0>climb)climb=1-ey0-climb>CLIMB?Infinity:1-ey0; continue }
				for(let i = 0; i < blockShape.length; i += 4){
					const c = blockShape[i+3] - ey0
					if(c > climb) climb = c-climb>CLIMB?Infinity:c
					if(c <= 0 || ey0+e.height-EPSILON-EPSILON <= blockShape[i+1]) continue
					if(blockShape[i] <= xs) xs = blockShape[i]
				}
			}
			if(climb > 0 && climb < Infinity && !solidCheck(xs + x + x0 - e.width - e.width, e.y + e.height, x === ex - 1 ? e.x + dx + e.width + EPSILON : x + x0 + 1, e.y + e.height + climb)){
				e.y += climb
				y0 = floor(e.y + EPSILON)
				continue
			}
			const tx = xs + x + x0 - e.width
			if((x === ex - 1 ? tx >= e.x + dx + EPSILON : xs > 1) || tx < e.x - EPSILON) continue
			e.x = tx
			e.impactDx = e.dx
			if(e == me && abs(meImpact.dx) < e.dx) meImpact.dx = e.dx
			e.dx = 0
			break x
		}
		e.x = ifloat(e.x + dx)
	}else if(dx < 0){
		const ex = floor(e.x - e.width + dx + EPSILON) - 1 - x0
		for(let x = 0; x > ex; x--){
			let xs = -1, ey0 = e.y + EPSILON - y0 + 1
			let climb = 0
			const yh = e.y + e.height - EPSILON - y0
			for(let y = 0; y < yh; y++){
				ey0 -= 1
				const {solid, blockShape} = getblock(x0 + x, y0 + y)
				if(!solid) continue
				if(!blockShape){ xs = 1; if(1-ey0>climb)climb=1-ey0-climb>CLIMB?Infinity:1-ey0; continue }
				for(let i = 0; i < blockShape.length; i += 4){
					const c = blockShape[i+3] - ey0
					if(c > climb) climb = c-climb>CLIMB?Infinity:c
					if(c <= 0 || ey0+e.height-EPSILON-EPSILON <= blockShape[i+1]) continue
					if(blockShape[i+2] >= xs) xs = blockShape[i+2]
				}
			}
			if(climb > 0 && climb < Infinity && !solidCheck(x === ex + 1 ? e.x + dx - e.width - EPSILON : x + x0, e.y + e.height, xs + x + x0 + e.width + e.width, e.y + e.height + climb)){
				e.y += climb
				y0 = floor(e.y + EPSILON)
				continue
			}
			const tx = xs + x + x0 + e.width
			if((x === ex + 1 ? tx <= e.x + dx - EPSILON : xs < 0) || tx > e.x + EPSILON) continue
			e.x = tx
			e.impactDx = e.dx
			if(e == me && abs(meImpact.dx) < -e.dx) meImpact.dx = e.dx
			e.dx = 0
			break x
		}
		e.x = ifloat(e.x + dx)
	}
	e.x = ifloat(e.x)
	e.y = ifloat(e.y)
}