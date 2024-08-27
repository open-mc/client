import { Particle } from 'definitions'
import './items.js'
import './blocks.js'

const src = loader(import.meta)

export const particlePng = Img(src`particles.png`)
export const explode = [1,2,3,4].mmap(a => Wave(src`sound/misc/explode${a}.mp3`))
export const hurt = [1,2,3].mmap(a => Wave(src`sound/misc/hurt${a}.mp3`))

const explodeParticles = [0,8,16,24,32,40,48,56,64,72,80,88,96,104,112].mmap(a => particlePng.crop(a,80,8,8))
const ashParticles = [0,8,16,24,32,40,48,56].mmap(a => particlePng.crop(a,0,8,8))

export class BlastParticle extends Particle{
	constructor(x, y){
		super(false, random() / 4 + 0.5, x + random() * 4 - 2, y + random() * 4 - 2, 0, 0, 0, 0)
		this.size = random() + 1
		const a = random()*.5+.5
		this.tint = vec4(a, a, a, 1)
	}
	render(c){
		if(this.lifetime >= .5) return
		c.drawRect(-this.size/2, -this.size/2, this.size, this.size, explodeParticles[floor(15 - this.lifetime * 30)], this.tint)
	}
}
const secondCanvas = Texture(8, 8).drawable()
export class AshParticle extends Particle{
	constructor(x, y){
		const rx = random() * 4 - 2, ry = random() * 4 - 2
		super(false, 79.9999, x + rx, y + ry, rx*3, ry*3, 0, 0)
		this.size = random() / 2 + .5
		const a = random()*.5+.5
		this.tint = vec4(a, a, a, 1)
	}
	render(c, tint){
		c.drawRect(secondCanvas.texture, -this.size/2, -this.size/2, this.size, this.size, ashParticles[floor(this.lifetime / 10)], this.tint.times(tint))
		if(random() < dt*10) this.lifetime -= 10
	}
}