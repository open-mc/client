import { setblock, getblock, map, cam, me, onPlayerLoad, perms, pointer, W2, H2, toBlockExact, mode } from 'world'
import './controls.js'
import { onkey, options, paused, renderUI, drawLayer, onpress } from 'api'
import { Entity, TEX_SIZE, BlockIDs, Blocks } from 'definitions'

export const CAMERA_DYNAMIC = 0, CAMERA_FOLLOW_SMOOTH = 1, CAMERA_FOLLOW_POINTER = 2,
	CAMERA_FOLLOW_PLAYER = 3, CAMERA_PAGE = 4
export let x = 2, y = 0
export let bx = 0, by = 0, bpx = 0, bpy = 0
export const REACH = 10
onPlayerLoad(me => reset(me.f))
let lastPlace = 0
let jrx = 0, jry = 0
drawLayer('none', -1000, () => {
	a: if(options.joy == 0){
		if(cursor.jrx || cursor.jry){
			const sens = 9 ** (options.controllerSensitivity-options.sensitivity)
			pointerMoved(cursor.jrx * 100 * sens, cursor.jry * 100 * sens)
			pointerOpacity = 0.5
		}
	}else if(options.joy == 1){
		if(cursor.jrx || cursor.jry){
			void({jrx, jry} = cursor)
			const ns = hypot(jrx, jry)*REACH
			if(ns < 1) jrx/=ns, jry/=ns
		}else{
			const ns = hypot(jrx, jry)*REACH
			if(ns) jrx/=ns, jry/=ns
			else break a
		}
		x += (jrx * REACH - x) / 3; y += (jry * REACH - y) / 3
	}
	if(options.camera == CAMERA_DYNAMIC){
		if(cam.staticX != cam.staticX) cam.x += (x - oldx) / 3
		if(cam.staticY != cam.staticY) cam.y += (y - oldy) / 3
	}
	oldx = x; oldy = y
	if(x||y) me.f = atan2(x, y)
})
export const DEFAULT_BLOCKSHAPE = [0, 0, 1, 1]
let blockPlacing = null
const invertBlend = Blend(ONE_MINUS_DST, ADD, ONE_MINUS_SRC)
drawLayer('world', 400, c => {
	if(paused) return
	if(cursor.mx||cursor.my) pointerMoved(cursor.mx, cursor.my), pointerOpacity = 1
	if(gesture.dx||gesture.dy) pointerMoved(gesture.dx*W2, gesture.dy*H2, 4), pointerOpacity = 0
	if(renderUI && me.health){
		c.blend = invertBlend
		const v = me.linked ? pointerOpacity : 0.2
		const pX = x + me.x - cam.x, pY = y + me.head + me.y - cam.y
		c.drawRect(pX - .3, pY - .03125, .6, .0625, vec4(v,v,v,0))
		c.drawRect(pX - .03125, pY - .3, .0625, .26875, vec4(v,v,v,0))
		c.drawRect(pX - .03125, pY + .03125, .0625, .26875, vec4(v,v,v,0))
		c.blend = null
	}
	bx = BigInt(floor(me.x))
	by = BigInt(floor(me.y + me.head))
	bpx = NaN, bpy = NaN
	let bppx = NaN, bppy = NaN
	const reach = hypot(x, y)
	let d = 0, px = me.x - Number(bx), py = me.y + me.head - Number(by)
	const dx = sin(me.f), dy = cos(me.f)
	const item = me.inv[me.selected], interactFluid = item?.interactFluid ?? false
	let ch = map.get(bx>>6n,by>>6n)
	a: if(!ch||(ch.flags&1)) bx = by = NaN
	else while(d < reach){
		const chx = bx>>6n, chy = by>>6n
		if(ch.x!=chx||ch.y!=chy){
			ch = map.get(chx, chy)
			if(!ch||(ch.flags&1)){ bx=by=bpx=bpy=NaN; break a }
		}
		const j = Number(bx&63n)|Number(by&63n)<<6, id = ch[j]
		const {solid, blockShape = DEFAULT_BLOCKSHAPE, flows} = id==65535?ch.tileData.get(j):BlockIDs[id]
		if(solid || (interactFluid && flows === false)){
			for(let i = 0; i < blockShape.length; i += 4){
				const x0 = blockShape[i], x1 = blockShape[i+2], y0 = blockShape[i+1], y1 = blockShape[i+3]
				if(dx > 0 && px <= x0){
					const iy = py + (dy / dx) * (x0-px)
					if(iy >= y0 && iy <= y1) break a
				}else if(dx < 0 && px >= x1){
					const iy = py + (dy / dx) * (x1-px)
					if(iy >= y0 && iy <= y1) break a
				}
				if(dy > 0 && py <= y0){
					const ix = px + (dx / dy) * (y0-py)
					if(ix >= x0 && ix <= x1) break a
				}else if(dy < 0 && py >= y1){
					const ix = px + (dx / dy) * (y1-py)
					if(ix >= x0 && ix <= x1) break a
				}
			}
		}
		bppx = bpx; bppy = bpy; bpx = bx; bpy = by
		if(dx > 0){
			const iy = py + dy * (1 - px) / dx
			if(iy >= 0 && iy <= 1){bx++; d += (1 - px) / dx; px = 0; py = iy; continue}
		}else if(dx < 0){
			const iy = py + dy * -px / dx
			if(iy >= 0 && iy <= 1){bx--; d += -px / dx; px = 1; py = iy; continue}
		}
		if(dy > 0){
			const ix = px + dx * (1 - py) / dy
			if(ix >= 0 && ix <= 1){by++; d += (1 - py) / dy; py = 0; px = ix; continue}
		}else if(dy < 0){
			const ix = px + dx * -py / dy
			if(ix >= 0 && ix <= 1){by--; d += -py / dy; py = 1; px = ix; continue}
		}
	}
	if(d >= reach){
		const {targettable, solid} = getblock(bpx, bpy)
		if(targettable && !solid){
			px -= Number(bpx - bx); py -= Number(bpy - by)
			bx = bpx; by = bpy; bpx = bppx; bpy = bppy
			if(bpx > bx) px = 1
			else if(bpx < bx) px = 0
			else if(bpy > by) py = 1
			else if(bpy < by) py = 0
			px -= Number(bpx - bx); py -= Number(bpy - by)
		}else{
			px = ((me.x + x)%1+1)%1; py = ((me.y + me.head + y)%1+1)%1
			bx = by = NaN
		}
	}else if(bpx==bpx) px -= Number(bpx - bx), py -= Number(bpy - by)
	if(bpx == bpx && getblock(bpx, bpy).targettable) bpx = bpy = NaN
	blockPlacing = perms >= 2 && (bx != bx || !getblock(bx, by).interactible || (me.state&2)) ? item?.places?.(px, py, bpx, bpy, bx, by) : undefined
	let up,down,left,right;up=down=left=right=Blocks.air
	if(bpx==bpx) up = getblock(bpx, bpy + 1n), down = getblock(bpx, bpy - 1n), left = getblock(bpx - 1n, bpy), right = getblock(bpx + 1n, bpy)
	if(interactFluid ?
		up.flows === false && down.flows === false && left.flows === false && right.flows === false
		: !(up.targettable||up.solid) && !(down.targettable||down.solid) && !(left.targettable||left.solid) && !(right.targettable||right.solid)
	){
		bpx = bpy = NaN
	}else{
		let x = (bpx - 32n) >> 6n, y = (bpy - 32n) >> 6n, npx = Number(bpy), npy = Number(bpy)
		a: for(const ch of [map.get(x, y), map.get(x+1n, y), map.get(x, y+1n), map.get(x+1n, y+1n)])
			if(ch) for(const e of ch.entities)
				if(e.y < npx + 1 && e.y + e.height > npy && e.x - e.width < npx + 1 && e.x + e.width > npx){
					//Don't allow placing because there is an entity in the way
					if(blockPlacing?.solid===true && !interactFluid) blockPlacing = null, bpx = bpy = NaN
					break a
				}
	}
})

drawLayer('world', 201, (c, w, h) => {
	if(bx != bx) return
	toBlockExact(c, bx, by)
	const block = getblock(bx, by)
	const item = me.inv[me.selected]
	if(renderUI && (block.hover?.(c, item)??true)){
		let {blockShape = DEFAULT_BLOCKSHAPE} = block
		c.shader = Shader.NONE
		c.mask = SET
		if(blockShape.length == 0) blockShape = DEFAULT_BLOCKSHAPE
		for(let i = 0; i < blockShape.length; i += 4){
			const x0 = blockShape[i], x1 = blockShape[i+2], y0 = blockShape[i+1], y1 = blockShape[i+3]
			c.drawRect(x0, y0, x1-x0, y1-y0)
			if(blockPlacing)
			if(bpx > bx){
				c.drawRect(x1, y0, 0.125, 0.0625)
				c.drawRect(x1, y1 - 0.0625, 0.125, 0.0625)
			}else if(bpx < bx){
				c.drawRect(x0 - 0.125, y0, 0.125, 0.0625)
				c.drawRect(x0 - 0.125, y1 - 0.0625, 0.125, 0.0625)
			}else if(bpy > by){
				c.drawRect(x0, y1, 0.0625, 0.125)
				c.drawRect(x1 - 0.0625, y1, 0.0625, 0.125)
			}else if(bpy < by){
				c.drawRect(x0, y0 - 0.125, 0.0625, 0.125)
				c.drawRect(x1 - 0.0625, y0 - 0.125, 0.0625, 0.125)
			}
		}
		c.mask = UNSET
		for(let i = 0; i < blockShape.length; i += 4){
			const x0 = blockShape[i], x1 = blockShape[i+2], y0 = blockShape[i+1], y1 = blockShape[i+3]
			c.drawRect(x0+.0625, y0+.0625, x1-x0-.125, y1-y0-.125)
		}
		c.mask = RGBA | IF_SET | UNSET
		c.shader = null
		c.drawRect(-0.5, -0.5, 2, 2, vec4(0, 0, 0, .5))
	}
})
let didHit = false
export function checkBlockPlacing(buf){
	const hasP = buttons.has(options.click ? LBUTTON : RBUTTON) || buttons.has(options.click ? GAMEPAD.LT : GAMEPAD.RT) || touchPlace
	touchPlace = false
	const hasB = buttons.has(options.click ? RBUTTON : LBUTTON) || buttons.has(options.click ? GAMEPAD.RT : GAMEPAD.LT)
	if(hasP && ((mode == 1 && buttons.has(KEYS.ALT)) || t > lastPlace + .12) && !paused && bpx == bpx){
		if(blockPlacing) setblock(bpx, bpy, blockPlacing)
		buf.byte(me.selected)
		buf.float(x); buf.float(y)
		buf.bigint(bpx); buf.bigint(bpy)
		lastPlace = t
	}else if(hasB && bx == bx && !paused && !(mode == 1 && !buttons.has(KEYS.ALT) && t <= lastPlace + .12)){
		buf.byte(me.selected | 128)
		buf.float(x); buf.float(y)
		blockbreakx = bx; blockbreaky = by
		me.state |= 8; lastPlace = t
	}else{
		buf.byte(me.selected); buf.float(NaN); buf.float(me.f)
		let id = Entity.meid // -1
		const hitBtnDown = hasB && !paused
		if(hitBtnDown && !didHit){
			const xp = me.x + x, yp = me.y + me.head + y
			let xa = BigInt(floor(xp - 32)) >> 6n, ya = BigInt(floor(yp - 32)) >> 6n
			a: for(const ch of [map.get(xa, ya), map.get(xa+1n, ya), map.get(xa, ya+1n), map.get(xa+1n, ya+1n)]) if(ch) for(const e of ch.entities)
				if(e.y < yp && e.y + e.height > yp && e.x - e.width < xp && e.x + e.width > xp){
					// Found entity
					id = e.netId
					break a
				}
			didHit = true
		}else if(!hitBtnDown) didHit = false
		buf.uint32(id|0), buf.short(id/4294967296|0)
		blockbreakx = blockbreaky = NaN
		me.state &= -9
	}
}
export let blockbreakx = NaN, blockbreaky = NaN
onkey(LBUTTON, RBUTTON, GAMEPAD.LT, GAMEPAD.RT, () => {lastPlace = 0})
let oldx = 0, oldy = 0
let pointerOpacity = 1
export function pointerMoved(dx, dy, sens = 9 ** options.sensitivity / 3 / cam.z / TEX_SIZE / 2){
	pointerOpacity = 1
	const _dx = dx, sr = sin(cam.f), cr = cos(cam.f)
	dx = dx*cr-dy*sr; dy = _dx*sr+dy*cr
	jrx = jry = 0
	const s = min(REACH, hypot(x, y))
	x += dx * sens; y += dy * sens
	const ns = hypot(x, y)
	if(!ns) return x = y = 0
	if(ns > s){
		x /= ns
		y /= ns
		const vec = s + (min(ns, REACH) - s) * (1 - (s / REACH) ** 4)
		x *= vec
		y *= vec
	}
}
let touchPlace = false
onpress.bind((tx, ty) => {
	tx = tx*W2*2-W2+cam.x-me.x
	ty = ty*H2*2-H2+cam.y-me.y-me.head
	if(tx*tx+ty*ty>REACH*REACH) return
	x = tx; y = ty; touchPlace = true
})
export const reset = (f) => {
	let r = min(4, REACH)
	x = oldx = sin(f) * r
	y = oldy = cos(f) * r
}
export const set = (_x, _y) => {
	x = _x; y = _y
}
import * as p from './pointer.js'
import { ongesture } from './api.js'
pointer(p)