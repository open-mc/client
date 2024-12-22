import { drawLayer, options } from 'api'
import { soundAt, entityMap, cam, world, me, foundMe, BlockIDs, _setDims, getTint } from 'world'
import { goto, peek, right, up, left, down, sound, getX, getY } from 'ant'
import { registerTypes } from '/server/modules/dataproto.js'
import * as pointer from './pointer.js'
import {EPS} from './entity.js'

export const TEX_SIZE = 16

export function _recalcDimensions(camZ){
	const SCALE = camZ * TEX_SIZE * pixelRatio
	_setDims((ctx.width+1&-2)/ctx.width*.5, (ctx.height+1&-2)/ctx.height*.5, ctx.width / SCALE / 2, ctx.height / SCALE / 2, SCALE)
	ctxSupersample = 2**(options.supersample*6-3) || 1
}

export class EphemeralInterface{
	getItem(id, slot){}
	setItem(id, slot, item){}
	slotClicked(id, slot, holding, player){
		const t = this.getItem(id, slot)
		if(t === undefined) return holding
		if(!t && !holding) return
		if(t&&holding&&!t.stackableWith(holding)){
			this.setItem(id, slot, holding)
		}else if(t && !holding){
			this.setItem(id, slot, null)
		}else{
			if(!t){
				this.setItem(id, slot, holding)
				return null
			}
			if(!t.stackableWith(holding)) return holding
			const c = min(holding.count, t.maxStack - t.count)
			holding.count -= c
			t.count += c
			return holding.count ? holding : null
		}
		return t
	}
	slotAltClicked(id, slot, holding, player){
		const t = this.getItem(id, slot)
		if(t === undefined) return holding
		if(!t && !holding) return
		if(t && !holding){
			const count = t.count>>1
			if(!count) return null
			t.count -= count
			if(!t.count) this.setItem(id, slot, null)
			return t.copy(count)
		}else if(t&&holding&&!t.stackableWith(holding)){
			this.setItem(id, slot, holding)
			return t
		}else{
			if(!t){
				const stack = holding.copy(1)
				this.setItem(id, slot, stack)
			}else if(t.stackableWith(holding) && t.count < t.maxStack){
				t.count++
			}else return holding
			return --holding.count ? holding : null
		}
	}
	mapItems(id, cb){

	}
}

export class Block{
	static placeSounds = []; static stepSounds = []
	static breakSounds = null
	static solid = true
	static replaceable = false
	static texture = -1
	static climbable = false
	static viscosity = 0
	static breaktime = 3
	static opacity = 2
	static brightness = 0
	punch(){
		if(this.stepSounds.length)
			sound(this.stepSounds, 0.1375, 0.5)
		punchParticles(this)
	}
	walk(e){
		if(!e.alive || !this.solid) return
		if(this.stepSounds.length)
			sound(this.stepSounds, 0.15, 1)
		if((e.impactDy < 0 && !(e.state & 0x10000)) || (e.state & 4)) stepParticles(this, e)
	}
	fall(){
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], 0.5, 0.75)
	}
	trace(c){
		let {blockShape} = this
		c.mask = SET
		if(!blockShape || blockShape.length == 0) blockShape = pointer.DEFAULT_BLOCKSHAPE
		for(let i = 0; i < blockShape.length; i += 4){
			const x0 = blockShape[i], x1 = blockShape[i+2], y0 = blockShape[i+1], y1 = blockShape[i+3]
			c.drawRect(x0, y0, x1-x0, y1-y0)
		}
		c.mask = RGBA | IF_SET | UNSET
	}
	getItem(id, slot){}
	setItem(id, slot, item){}
	static slotClicked = EphemeralInterface.prototype.slotClicked
	static slotAltClicked = EphemeralInterface.prototype.slotAltClicked
	static mapItems = EphemeralInterface.prototype.mapItems
}
export class Item{
	constructor(a,n=''){ this.count=a&255; this.name=n }
	breaktime(b){ return b.breaktime }
	static maxStack = 64
	static model = 0
	static useTint = true
	static decode(buf, target){
		const count = buf.flint2()
		if(!count) return null
		const item = ItemIDs[buf.getUint16(buf.i)]
		buf.i += 2
		if(!item) return null
		if(!target) target = new item(count)
		else target.count = count, Object.setPrototypeOf(target, Object.getPrototypeOf(item))
		target.name = buf.string()
		if(target.savedata) buf.read(target.savedatahistory[buf.flint()] || target.savedata, target)
		return target
	}
	static encode(buf, v){
		if(buf.i > buf.cur.byteLength - 3) buf.allocnew();
		if(!v || !v.count){buf.cur.setUint8(buf.i++, 0); return}
		buf.flint2(v.count)
		buf.cur.setUint16(buf.i, v.id); buf.i += 2
		buf.string(v.name)
		if(v.savedata) buf.write(v.savedatahistory[buf.flint()] || v.savedata, v)
	}
	stackableWith(other){
		if(this.constructor != other.constructor || this.name != other.name) return false
		if(!this.savedata) return true
		deepCompare(this.savedata, this, other)
	}
	copy(count = this.count, name = this.name){
		const other = new this.constructor(count, name)
		if(this.savedata) deepAssign(this.savedata, this, other)
		return other
	}
}
function deepCompare(T, a, b){
	for(const k in T){
		const v1 = a[k], v2 = b[k]
		if(v1 instanceof Item || Array.isArray(v1)) return false
		if(v1 == null) return v2 == null
		if(v2 == null) return false
		if(typeof v1 == 'object'){ if(!deepCompare(T[k], v1, v2)) return false }
		else if(v1 != v2) return false
	}
	return true
}
function deepAssign(T, a, b){
	if(Array.isArray(T)){let i=0;for(const v of a){
		if(v instanceof Item) b[i++] = v.copy()
		else if(typeof v == 'object' && v) deepAssign(T[0], v, b[i++] ??= Array.isArray(v) ? [] : {})
		else b[i++] = v
	}}else for(const k in T){
		const v = a[k]
		if(v instanceof Item) b[k] = v.copy()
		else if(typeof v == 'object' && v) deepAssign(T[k], v, b[k] ??= Array.isArray(v) ? [] : {})
		else b[k] = v
	}
}
registerTypes({Item})
//chunk exists
export class Entity{
	static meid = -1
	ix = 0; x = 0
	iy = 0; y = 0
	dx = 0; dy = 0
	impactDx = 0; impactDy = 0
	chunk = null
	netId = -1
	state = 0
	age = 0
	flags = 0
	f = PI / 2
	get linked(){return this.netId>=0}
	shouldSimulate(){
		const x = floor(this.x)>>6, y = floor(this.y)>>6
		if(!map.has((x&0x3FFFFFF)+(y&0x3FFFFFF)*0x4000000)) return false
		const ox = (floor(this.x)>>>4&2)-1, oy = (floor(this.y)>>>4&2)-1
		return map.has((x+ox&0x3FFFFFF)+(y&0x3FFFFFF)*0x4000000)
			&& map.has((x&0x3FFFFFF)+(y+oy&0x3FFFFFF)*0x4000000)
			&& map.has((x+ox&0x3FFFFFF)+(y+oy&0x3FFFFFF)*0x4000000)
	}
	update(){}
	place(){
		const s = entityMap.size
		entityMap.set(this.netId, this)
		if(entityMap.size == s) return false
		this.ix = this.x; this.iy = this.y
		if(Entity.meid === this.netId && me != this) foundMe(this)
		return true
	}
	remove(){
		const a = entityMap.delete(this.netId)
		this.netId = -1
		if(this.chunk) this.chunk.entities.delete(this)
		return a
	}
	sound(a,b=1,c=1){ soundAt(a, this.ix-.5, this.iy-.5+this.head, b, c) }
	static width = 0.5
	static height = 1
	static head = .5
	static gx = 1
	static gy = 1
	static alive = false
	static groundDrag = .0000244
	static airDrag = 0.06
	static yDrag = 0.667
	getItem(id, slot){}
	setItem(id, slot, item){}
	static slotClicked = EphemeralInterface.prototype.slotClicked
	static slotAltClicked = EphemeralInterface.prototype.slotAltClicked
	static mapItems = EphemeralInterface.prototype.mapItems
}

export const Blocks = {}
export const Items = {}
export const Entities = {}
export { BlockIDs }
export const ItemIDs = []
export const EntityIDs = []

export class Particle{
	constructor(physical, lifetime, x, y, dx, dy, ddx = world.gx, ddy = world.gy){
		this.physical = physical; this.lifetime = lifetime
		this.x = x; this.y = y
		this.dx = dx; this.dy = dy
		this.ddx = ddx; this.ddy = ddy
	}
	step(){
		this.dx += this.ddx * dt; this.dy += this.ddy * dt
		this.lifetime -= dt
		if(this.lifetime < 0) return void particles.delete(this)
		let dx = this.dx * dt, dy = this.dy * dt
		let x = floor(this.x), y = floor(this.y)
		goto(x, y)
		y: if(dy > 0){
			const ey = ceil(this.y + dy)
			for(let y1 = y; y1 < ey; y1++, up()){
				const {solid, blockShape} = peek()
				if(!solid) continue
				let ys = 2
				if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
					if(blockShape[i]+x > this.x | blockShape[i+2]+x < this.x) continue
					if(blockShape[i+1] <= ys) ys = blockShape[i+1]
				}else ys = 0
				if((y1 === ey - 1 ? ys + y1 >= this.y + dy + EPS : ys > 1) || ys + y1 < this.y - EPS) continue
				this.y = ys + y1 - EPS
				this.dy = 0
				break y
			}
			this.y += dy
		}else if(dy < 0){
			const ey = floor(this.y + dy) - 1
			for(let y1 = y; y1 > ey; y1--, down()){
				const {solid, blockShape} = peek()
				if(!solid) continue
				let ys = -1
				if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
					if(blockShape[i]+x > this.x | blockShape[i+2]+x < this.x) continue
					if(blockShape[i+3] > ys) ys = blockShape[i+3]
				}else ys = 1
				if((y1 === ey + 1 ? ys + y1 <= this.y + dy - EPS : ys < 0) || ys + y1 > this.y + EPS) continue
				this.y = ys + y1 + EPS
				this.dy = 0
				break y
			}
			this.y += dy
		}
		goto(x, y = floor(this.y))
		x: if(dx > 0){
			const ex = ceil(this.x + dx)
			for(let x1 = floor(this.x1); x1 < ex; x1++, right()){
				const {solid, blockShape} = peek()
				if(!solid) continue
				let xs = 2
				if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
					if(blockShape[i+1]+y > this.y | blockShape[i+3]+y < this.y) continue
					if(blockShape[i] <= xs) xs = blockShape[i]
				}else xs = 0
				if((x1 === ex - 1 ? xs + x1 >= this.x + dx + EPS : xs > 1) || xs + x1 < this.x - EPS) continue
				this.x = xs + x1 - EPS
				this.dx = 0
				break x
			}
			this.x += dx
		}else if(dx < 0){
			const ex = floor(this.x + dx) - 1
			for(let x1 = floor(this.x1); x1 > ex; x1--, left()){
				const {solid, blockShape} = peek()
				if(!solid) continue
				let xs = -1
				if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
					if(blockShape[i+1]+y > this.y | blockShape[i+3]+y < this.y) continue
					if(blockShape[i+2] > xs) xs = blockShape[i+2]
				}else xs = 1
				if((x1 === ex + 1 ? xs + x1 <= this.x + dx - EPS : xs < 0) || xs + x1 > this.x + EPS) continue
				this.x = xs + x1 + EPS
				this.dx = 0
				break x
			}
			this.x += dx
		}else this.x += this.dx * dt, this.y += this.dy * dt
	}
	render(_){}
}
export function addParticle(p){
	if(particles.size < options.maxParticles) particles.add(p)
}
export const particles = new Set()
"world"

drawLayer('world', 300, globalThis.x=c => {
	let tx = 0, ty = 0
	for(const particle of particles){
		c.translate(-(tx - (tx = ifloat(particle.x - cam.x))), -(ty - (ty = ifloat(particle.y - cam.y))))
		particle.render(c, getTint(particle.x, particle.y))
		particle.step()
	}
})

export class BlockParticle extends Particle{
	constructor(block, frac, x, y){
		super(true,
			(random()+.5)/2, x + (frac & 3) / 4 + .125, y + (frac >> 2) / 4 + .125,
			(frac & 3) + random()*2 - 2.5 , 2 + (frac >> 2) + random()*2
		)
		this.frac = (random() * 16) | 0
		if(!block) return
		let p = block.particleTexture??block.texture
		if(p==-1) p = block.texture
		if(typeof p == 'number') p = toTex(p)
		this.tex = p.crop((this.frac & 3) << 2, (this.frac & 12), (this.frac&2)+2, (this.frac<<1&2)+2)
	}
	render(c, tint){
		if(!this.tex) return
		const w = (this.frac&2)/40+.05, h = (this.frac<<1&2)/40+.05
		c.drawRect(-w, -h, w*2, h*2, this.tex, tint)
	}
}
export function blockBreak(block){
	const x = getX(), y = getY()
	for(let i = 0; i < 16; i++)
		addParticle(new BlockParticle(block, i, x, y))
}

export function stepParticles(block, e){
	for(let i = 0; i < 4; i++){
		const particle = new BlockParticle(block, i, e.x - .5, e.y)
		particle.dy /= 2; particle.dx -= e.dx / 2; particle.ddx = e.dx / 2; particle.lifetime /= 2
		addParticle(particle)
	}
}

export function punchParticles(block){
	const x = getX(), y = getY()
	const s = (random() * 256) | 0
	let particle = new BlockParticle(block, s&15, x, y)
	particle.dy /= 2; particle.lifetime /= 2; particle.physical = false; particle.ddy /= 2
	addParticle(particle)
	particle = new BlockParticle(block, s>>4, x, y)
	particle.dy /= 2; particle.lifetime /= 2; particle.physical = false; particle.ddy /= 2
	addParticle(particle)
}

export const Classes = []

export const ephemeralInterfaces = {}

let bai = 0, bac = 256
export let blockAtlas = Texture(4096, min(4096, bac/16), 1, _, _, 5)

const loading = new Map()

export function BlockTexture(img=0, x=0, y=0, frames = 0){
	if(typeof img == 'number') frames = img, img = null
	frames = abs(frames||1)
	const i = bai; bai += frames
	while(i >= bac){
		bac <<= 1
		const ba2 = bac < 65536 ? Texture(4096, bac>>4, 1, _, _, 5) : Texture(4096, 4096, bac>>16, _, _, 5)
		ba2.paste(blockAtlas)
		blockAtlas = ba2
	}
	const j = i|frames-1<<24
	if(!img) loading.set(j, [])
	else if(img.then) img.then(img => _putImg(img, j, x, y)), loading.set(j, [])
	else if(img) _putImg(img, j, x, y)
	return j
}
let blocksMipmapped = true
function _putImg(img, j, x, y){
	let frames = (j>>>24)+1, i = j&16777215
	if(frames>0) for(let ry=y;ry<y+frames;ry++) blockAtlas.paste(img, (i&255)<<4, (i>>8&255)<<4, i>>16, x<<4, img.height-(ry<<4)-16, 0, 16, 16, 1),i++
	else for(let rx=x;rx<x-frames;rx++) blockAtlas.paste(img, (i&255)<<4, (i>>8&255)<<4, i>>16, rx<<4, img.height-(y<<4)-16, 0, 16, 16, 1),i++
	blocksMipmapped = false
	const arr = loading.get(j)
	if(arr){
		loading.delete(j)
		for(const f of arr) f(j)
	}
}

export function editBlockTexture(j, img, x=0, y=0){
	_putImg(img, j, x, y)
	const arr = loading.get(j)
	if(arr){
		loading.delete(j)
		for(const f of arr) f(j)
	}
}

export function awaitLoad(j){
	const arr = loading.get(j)
	if(!arr) return Promise.resolve(j)
	return new Promise(r => arr.push(r))
}

export const toTex = i => {
	if(i<0) i = bai
	const baH = blockAtlas.height>>4
	i += world.animTick%((i>>>24)+1)
	blockAtlas.x = (i&255)/256
	blockAtlas.y = (i>>8&255)/baH
	blockAtlas.w = 0.00390586 // 1/256
	blockAtlas.h = .9999/baH
	blockAtlas.l = i>>16&255
	return blockAtlas
}

export function prep(){
	if(!blocksMipmapped){
		blockAtlas.genMipmaps()
		blocksMipmapped = true
	}
}