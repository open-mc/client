import { Particle } from 'definitions'
import './items.js'
import './blocks.js'

const {Audio, Texture} = loader(import.meta)

export const particlePng = Texture("particles.png")
export const explode = [1,2,3,4].mmap(a => Audio(`sound/misc/explode${a}.mp3`))
export const hurt = [1,2,3].mmap(a => Audio(`sound/misc/hurt${a}.mp3`))

const explodeParticles = [0,8,16,24,32,40,48,56,64,72,80,88,96,104,112].mmap(a => particlePng.crop(a,80,8,8))
const ashParticles = [0,8,16,24,32,40,48,56].mmap(a => particlePng.crop(a,0,8,8))

export class BlastParticle extends Particle{
	constructor(x, y){
		super(false, random() / 4 + 0.5, x + random() * 4 - 2, y + random() * 4 - 2, 0, 0, 0, 0)
		this.size = random() + 1
		const a = floor(random() * 128 + 128)
		this.fillStyle = `rgb(${a}, ${a}, ${a})`
	}
	render(c){
		if(this.lifetime >= .5) return
		secondCanvas.globalCompositeOperation = 'destination-atop'
		secondCanvas.fillStyle = this.fillStyle
		secondCanvas.fillRect(0,0,8,8)
		secondCanvas.image(explodeParticles[floor(15 - this.lifetime * 30)], 0, 0, 8, 8)
		c.image(secondCanvas, -this.size/2, -this.size/2, this.size, this.size)
	}
}
const secondCanvas = Can(8,8,true)
secondCanvas.defaultTransform()
export class AshParticle extends Particle{
	constructor(x, y){
		const rx = random() * 4 - 2, ry = random() * 4 - 2
		super(false, 79.9999, x + rx, y + ry, rx*3, ry*3, 0, 0)
		this.size = random() / 2 + .5
		const a = floor(random() * 128 + 128)
		this.fillStyle = `rgb(${a}, ${a}, ${a})`
	}
	render(c){
		secondCanvas.globalCompositeOperation = 'destination-atop'
		secondCanvas.fillStyle = this.fillStyle
		secondCanvas.fillRect(0,0,8,8)
		secondCanvas.image(ashParticles[floor(this.lifetime / 10)], 0, 0, 8, 8)
		c.image(secondCanvas, -this.size/2, -this.size/2, this.size, this.size)
		if(random() < dt*10) this.lifetime -= 10
	}
}