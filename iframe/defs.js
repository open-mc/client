import { renderLayer, options } from 'api'
import { getblock, sound } from 'world'
import { registerTypes } from '../data.js'
import * as pointer from './pointer.js'

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
	static texture = null
	static climbable = false
	static gooeyness = 0
	static breaktime = 3
	1(buf, x, y){
		if(this.placeSounds.length)
			sound(this.placeSounds[Math.floor(Math.random() * this.placeSounds.length)], x, y, 1, 0.8)
	}
	2(buf, x, y){
		if(this.placeSounds.length)
			sound(this.placeSounds[Math.floor(Math.random() * this.placeSounds.length)], x, y, 1, 0.8)
		blockBreak(this, x, y)
	}
	punch(x, y){
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], x, y, 0.1375, 0.5)
		punchParticles(this, x, y)
	}
	walk(x, y, e){
		if(!e.alive) return
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], x, y, 0.15, 1)
		if((e.state & 0x1010000) == 0x10000 || (e.state & 4)) stepParticles(this, e)
	}
	fall(x, y){
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], x ,y, 0.5, 0.75)
	}
}
export class Item{
	constructor(a){ this.count=a&255; this.name='' }
	breaktime(b){ return b.breaktime }
	static maxStack = 64
	static model = 0
	static decode(buf, target){
		const count = buf.getUint8(buf.i++)
		if(!count) return null
		const item = ItemIDs[buf.getUint16(buf.i)]
		buf.i += 2
		if(!item) return null
		if(!target)target = item(count)
		else target.count = count, Object.setPrototypeOf(target, Object.getPrototypeOf(item))
		target.name = buf.string()
		if(target.savedata)buf.read(target.savedatahistory[buf.flint()] || target.savedata, target)
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
export class Entity{
	blocksWalked = 0
	ix = 0; x = 0
	iy = 0; y = 0
	dx = 0; dy = 0
	chunk = null
	netId = 0
	state = 0
	age = 0
	f = PI / 2
	prestep(){
		const { gooeyness } = getblock(floor(this.x), floor(this.dy > 0 ? this.y : this.y + this.height / 4))
		if(gooeyness) this.dx *= (1 - gooeyness), this.dy *= (1 - gooeyness)
	}
	step(){
		this.blocksWalked += abs(this.dx * dt)
		if((this.state & 0x10000) && !(this.state & 2)){
			if(this.blocksWalked >= 1.7){
				this.blocksWalked = 0
				const x = floor(this.x + this.dx * dt), y = ceil(this.y) - 1
				const block = getblock(x, y)
				if(block.walk) block.walk(x, y, this)
			}
		}else this.blocksWalked = this.dy < -10 ? 1.7 : 1.68
	}
	place(){
		entityMap.set(this.netId, this)
		this.ix = this.x; this.iy = this.y
		if(meid === this.netId && me != this) foundMe(this)
	}
	remove(){
		entityMap.delete(this.netId)
		this.netId = -1
		if(this.chunk) this.chunk.entities.delete(this)
	}
	sound(a,b=1,c=1){sound(a, this.ix-.5, this.iy-.5+this.head, b, c)}
	static width = 0.5
	static height = 1
	static head = .5
	static gx = 1
	static gy = 1
	static alive = false
}

export const Blocks = {}, Items = {}, Entities = {}
export const BlockIDs = [], ItemIDs = [], EntityIDs = []

export class Particle{
	constructor(physical, lifetime, x, y, dx, dy, ddx = gx, ddy = gy){
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
				const ey = ceil(this.y + dy) + 1
				for(let y = ceil(this.y); y < ey; y++){
					const ys = y - (getblock(x, y - 1).solid || false)
					if(ys == y || ys < this.y)continue
					this.y = min(ys, this.y + dy)
					this.dy = 0
					break y
				}
				this.y += dy
			}else if(dy < 0){
				const ey = floor(this.y + dy) - 1
				for(let y = floor(this.y); y > ey; y--){
					const ys = y + (getblock(x, y).solid || false)
					if(ys == y || ys > this.y)continue
					this.y = max(ys, this.y + dy)
					this.dy = 0
					break y
				}
				this.y += dy
			}
			const y = floor(this.y)
			x: if(dx > 0){
				const ex = ceil(this.x + dx) + 1
				for(let x = ceil(this.x); x < ex; x++){
					const xs = x - (getblock(x - 1, y).solid || false)
					if(xs == x || xs < this.x)continue
					this.x = min(xs, this.x + dx)
					this.dx = 0
					break x
				}
				this.x += dx
			}else if(dx < 0){
				const ex = floor(this.x + dx) - 1
				for(let x = floor(this.x); x > ex; x--){
					const xs = x + (getblock(x, y).solid || false)
					if(xs == x || xs > this.x)continue
					this.x = max(xs, this.x + dx)
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

class BlockParticle extends Particle{
	constructor(block, frac, x, y){
		super(true, (random()+1)/2, x + (frac & 3) / 4 + .125, y + (frac >> 2) / 4 + .125, (frac & 3) + random()*2 - 2.5, 3 + (frac >> 2) + random()*2)
		this.block = block
		this.frac = (random() * 16) | 0
	}
	render(c){
		if(!this.block || !this.block.texture) return
		const w = (this.frac&2)+2, h = (this.frac<<1&2)+2
		c.image(this.block.texture, -0.1, -0.1, w/20, h/20, (this.frac & 3) << 2, this.frac & 12, w, h)
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