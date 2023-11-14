import { renderLayer, options } from 'api'
import { getblock, sound, entityMap, cam, world } from 'world'
import { registerTypes } from '/server/modules/dataproto.js'
import * as pointer from './pointer.js'
import { EPSILON } from './entity.js'

export function foundMe(e){
	if(!me)postMessage(false, '*')
	me = e
	cam.x = me.ix = me.x
	cam.y = me.iy = me.y
	pointer.reset(e.f)
}

export class Block{
	static placeSounds = []; static stepSounds = []
	static solid = true
	static replacable = false
	static texture = null
	static climbable = false
	static viscosity = 0
	static breaktime = 3
	punch(x, y){
		if(this.stepSounds.length)
			sound(this.stepSounds, x, y, 0.1375, 0.5)
		punchParticles(this, x, y)
	}
	walk(x, y, e){
		if(!e.alive || !this.solid) return
		if(this.stepSounds.length)
			sound(this.stepSounds, x, y, 0.15, 1)
		if((e.impactDy < 0 && !(e.state & 0x10000)) || (e.state & 4)) stepParticles(this, e)
	}
	fall(x, y){
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], x, y, 0.5, 0.75)
	}
	trace(c){
		c.beginPath?.()
		let {blockShape} = this
		if(!blockShape || blockShape.length == 0) blockShape = pointer.DEFAULT_BLOCKSHAPE
		for(let i = 0; i < blockShape.length; i += 4){
			const x0 = blockShape[i], x1 = blockShape[i+2], y0 = blockShape[i+1], y1 = blockShape[i+3]
			c.rect(x0, y0, x1-x0, y1-y0)
		}
		c.closePath?.()
	}
}
export class Item{
	constructor(a,n=''){ this.count=a&255; this.name=n }
	breaktime(b){ return b.breaktime }
	static maxStack = 64
	static model = 0
	static decode(buf, target){
		const count = buf.getUint8(buf.i++)
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
		if(buf.i > buf.cur.byteLength - 3)buf.allocnew();
		if(!v || !v.count){buf.cur.setUint8(buf.i++, 0); return}
		buf.cur.setUint8(buf.i++, v.count)
		buf.cur.setUint16(buf.i, v.id); buf.i += 2
		buf.string(v.name)
		if(v.savedata)buf.write(v.savedatahistory[buf.flint()] || v.savedata, v)
	}
}
registerTypes({Item})
//chunk exists
export class Entity{
	ix = 0; x = 0
	iy = 0; y = 0
	dx = 0; dy = 0
	impactDx = 0; impactDy = 0
	chunk = null
	netId = 0
	state = 0
	age = 0
	flags = 0
	f = PI / 2
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
		if(entityMap.has(this.netId)) return false
		entityMap.set(this.netId, this)
		this.ix = this.x; this.iy = this.y
		if(meid === this.netId && me != this) foundMe(this)
		return true
	}
	remove(){
		const a = entityMap.delete(this.netId)
		this.netId = -1
		if(this.chunk) this.chunk.entities.delete(this)
		return a
	}
	sound(a,b=1,c=1){ sound(a, this.ix-.5, this.iy-.5+this.head, b, c) }
	static width = 0.5
	static height = 1
	static head = .5
	static gx = 1
	static gy = 1
	static alive = false
}

export const Blocks = {}, Items = {}, Entities = {}
export const BlockIDs = [], ItemIDs = [], EntityIDs = []

Object.assign(globalThis, {Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs})

export class Particle{
	constructor(physical, lifetime, x, y, dx, dy, ddx = world.gx, ddy = world.gy){
		this.physical = physical; this.lifetime = lifetime
		this.x = x; this.y = y
		this.dx = dx; this.dy = dy
		this.ddx = ddx; this.ddy = ddy
		if(particles.size < options.maxParticles) particles.add(this)
	}
	step(){
		this.dx += this.ddx * dt; this.dy += this.ddy * dt
		this.lifetime -= dt
		if(this.lifetime < 0) return void particles.delete(this)
		if(this.physical){
			let dx = this.dx * dt, dy = this.dy * dt
			const x = floor(this.x)
			y: if(dy > 0){
				const ey = ceil(this.y + dy)
				for(let y = floor(this.y); y < ey; y++){
					const {solid, blockShape} = getblock(x, y)
					if(!solid) continue
					let ys = 2
					if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
						if(blockShape[i]+x > this.x | blockShape[i+2]+x < this.x) continue
						if(blockShape[i+1] <= ys) ys = blockShape[i+1]
					}else ys = 0
					if((y === ey - 1 ? ys + y >= this.y + dy + EPSILON : ys > 1) || ys + y < this.y - EPSILON) continue
					this.y = ys + y - EPSILON
					this.dy = 0
					break y
				}
				this.y += dy
			}else if(dy < 0){
				const ey = floor(this.y + dy) - 1
				for(let y = floor(this.y); y > ey; y--){
					const {solid, blockShape} = getblock(x, y)
					if(!solid) continue
					let ys = -1
					if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
						if(blockShape[i]+x > this.x | blockShape[i+2]+x < this.x) continue
						if(blockShape[i+3] > ys) ys = blockShape[i+3]
					}else ys = 1
					if((y === ey + 1 ? ys + y <= this.y + dy - EPSILON : ys < 0) || ys + y > this.y + EPSILON) continue
					this.y = ys + y + EPSILON
					this.dy = 0
					break y
				}
				this.y += dy
			}
			const y = floor(this.y)
			x: if(dx > 0){
				const ex = ceil(this.x + dx)
				for(let x = floor(this.x); x < ex; x++){
					const {solid, blockShape} = getblock(x, y)
					if(!solid) continue
					let xs = 2
					if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
						if(blockShape[i+1]+y > this.y | blockShape[i+3]+y < this.y) continue
						if(blockShape[i] <= xs) xs = blockShape[i]
					}else xs = 0
					if((x === ex - 1 ? xs + x >= this.x + dx + EPSILON : xs > 1) || xs + x < this.x - EPSILON) continue
					this.x = xs + x - EPSILON
					this.dx = 0
					break x
				}
				this.x += dx
			}else if(dx < 0){
				const ex = floor(this.x + dx) - 1
				for(let x = floor(this.x); x > ex; x--){
					const {solid, blockShape} = getblock(x, y)
					if(!solid) continue
					let xs = -1
					if(blockShape) for(let i = 0; i < blockShape.length; i += 4){
						if(blockShape[i+1]+y > this.y | blockShape[i+3]+y < this.y) continue
						if(blockShape[i+2] > xs) xs = blockShape[i+2]
					}else xs = 1
					if((x === ex + 1 ? xs + x <= this.x + dx - EPSILON : xs < 0) || xs + x > this.x + EPSILON) continue
					this.x = xs + x + EPSILON
					this.dx = 0
					break x
				}
				this.x += dx
			}
		}else this.x += this.dx * dt, this.y += this.dy * dt
	}
	render(c){}
}
export const particles = new Set

renderLayer(300, c => {
	let tx = 0, ty = 0
	for(const particle of particles){
		c.translate(-(tx - (tx = ifloat(particle.x - cam.x))), -(ty - (ty = ifloat(particle.y - cam.y))))
		particle.render(c)
		particle.step()
	}
})

export class BlockParticle extends Particle{
	constructor(block, frac, x, y){
		super(true,
			(random()+.5)/2, x + (frac & 3) / 4 + .125, y + (frac >> 2) / 4 + .125,
			(frac & 3) + random()*2 - 2.5 , 2 + (frac >> 2) + random()*2
		)
		this.block = block
		this.frac = (random() * 16) | 0
	}
	render(c){
		if(!this.block || !this.block.texture) return
		const w = (this.frac&2)+2, h = (this.frac<<1&2)+2
		const {w: tw, h: th} = this.block.texture
		c.image(this.block.texture, -0.1, -0.1, w/20, h/20, (this.frac & 3) << 2, (this.frac & 12) + (world.tick%floor(th/tw))*tw, w, h)
	}
}
export function blockBreak(block, x, y){
	for(let i = 0; i < 16; i++){
		new BlockParticle(block, i, x, y)
	}
}

export function stepParticles(block, e){
	for(let i = 0; i < 4; i++){
		const particle = new BlockParticle(block, i, e.x - .5, e.y)
		particle.dy /= 2; particle.dx -= e.dx / 2; particle.ddx = e.dx / 2; particle.lifetime /= 2
	}
}

export function punchParticles(block, x, y){
	const s = (random() * 256) | 0
	let particle = new BlockParticle(block, s&15, x, y)
	particle.dy /= 2; particle.lifetime /= 2; particle.physical = false; particle.ddy /= 2
	particle = new BlockParticle(block, s>>4, x, y)
	particle.dy /= 2; particle.lifetime /= 2; particle.physical = false; particle.ddy /= 2
}

export const Classes = []

export const ephemeralInterfaces = {}