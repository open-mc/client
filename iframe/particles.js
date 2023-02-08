import './index.js'
import './world.js'

Particle = class{
	constructor(physical, lifetime, x, y, dx, dy, ddx = gx, ddy = gy){
		this.physical = physical; this.lifetime = lifetime
		this.x = x; this.y = y
		this.dx = dx; this.dy = dy
		this.ddx = ddx; this.ddy = ddy
		particles.add(this)
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
const particles = new Set

renderLayer(300, c => {
	let tx = 0, ty = 0
	for(const p of particles){
		p.step()
		c.translate(-(tx - (tx = ifloat(p.x - cam.x))), -(ty - (ty = ifloat(p.y - cam.y))))
		p.render(c)
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
		const p = new BlockParticle(block, i, e.x - .5, e.y)
		p.dy /= 2; p.dx -= e.dx / 2; p.ddx = e.dx / 2; p.lifetime /= 2
	}
}

export function punchParticles(block, x, y){
	const s = (random() * 256) | 0
	let p = new BlockParticle(block, s&15, x, y)
	p.dy /= 2; p.lifetime /= 2; p.physical = false; p.ddy /= 2
	p = new BlockParticle(block, s>>4, x, y)
	p.dy /= 2; p.lifetime /= 2; p.physical = false; p.ddy /= 2
}