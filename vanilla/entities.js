import { particlePng, explode, AshParticle, BlastParticle, hurt } from "./defs.js"
import { renderItem, renderItemCount } from "./effects.js"
import { Entities, Entity, Item, Blocks } from 'definitions'
import { renderF3 } from 'api'

const meInterface = Texture('/vanilla/meint.png')

class LivingEntity extends Entity{
	health = 20
	hitTimer = 0
	hurtTextures = null
	textures = null
	99(buf){
		const oldHealth = this.health
		this.health = buf.byte()
		if(this.health < oldHealth){
			this.sound(hurt[floor(random()*hurt.length)])
		}
		const fields = buf.byte()
		if(fields & 1){
			if(!this.hitTimer && !this.hurtTextures){
				this.hurtTextures = {...this.textures}
				for(const n in this.hurtTextures){
					const t = this.hurtTextures[n]
					this.hurtTextures[n] = t.crop(0,0,t.w,t.h)
					// TODO
				}
			}
			this.hitTimer = 0.5
		}
	}
	render(c){
		this.hitTimer -= dt
		if(this.hitTimer < 0) this.hitTimer = 0
		if(!this.health) c.scale(0,0)
	}
}

const skinCan = Can(28, 12)
Entities.player = class extends LivingEntity{
	static alive = true
	inv = Array.null(36)
	items = [null, null, null, null, null, null]
	selected = 0
	skin = null
	textures = null
	render(c){
		super.render(c)
		if(!this.textures) return
		const angle = (this.state & 3) == 2 ? sin(t * 4) * this.dx / 5 : sin(t * 12) * this.dx / 10, xs = this.f >= 0 ? 0.9 : -0.9, ys = this.name == 'Dinnerbone' || this.name == 'Grumm' ? -0.9 : 0.9
		const extraAngle = this.state & 8 ? ((-5*t%1+1)%1)*((-5*t%1+1)%1)/3 : 0
		if(this.name && (renderF3 || this != me)){
			c.textAlign = 'center'
			const {width, top, bottom} = c.measureText(this.name, 0.3)
			c.fillStyle = '#000'
			c.globalAlpha = 0.2
			c.fillRect(width * -0.5 - 0.05, this.height + 0.15 - 0.05, width + 0.1, bottom + top + 0.1)
			c.globalAlpha = 1
			c.fillStyle = '#fff'
			c.fillText(this.name, 0, this.height + 0.15 + bottom * 0.3, 0.3)
		}
		if(ys < 0)c.translate(0, this.height)
		c.scale(xs, ys)
		if(this.state & 2){
			c.translate(0.2, 1.2)
			c.rotate(angle - .5)
			c.image(this.textures.arm2, -0.125, -0.625, 0.25, 0.75)
			c.rotate(-angle + .5)
			c.translate(-0.3,-0.45)
			c.rotate(-angle)
			c.image(this.textures.leg2, -0.125, -0.75, 0.25, 0.75)
			c.rotate(angle - .5)
			c.image(this.textures.body, -0.125, -0.125, 0.25, 0.75)
			c.rotate(0.5)
			c.rotate(angle)
			c.image(this.textures.leg1, -0.125, -0.75, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0.3, 0.45)
			c.rotate(-angle - .5 + extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], true)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.image(this.textures.arm1, -0.125, -0.625, 0.25, 0.75)
			c.rotate(angle + .5 - extraAngle)
		}else{
			c.translate(0, 1.375)
			c.rotate(angle)
			c.image(this.textures.arm2, -0.125, -0.625, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0,-0.625)
			c.rotate(-angle)
			c.image(this.textures.leg2, -0.125, -0.75, 0.25, 0.75)
			c.rotate(angle)
			c.image(this.textures.body, -0.125, 0, 0.25, 0.75)
			c.rotate(angle)
			c.image(this.textures.leg1, -0.125, -0.75, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0, 0.625)
			c.rotate(-angle + extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], true)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.image(this.textures.arm1, -0.125, -0.625, 0.25, 0.75)
			c.rotate(angle - extraAngle)
			c.translate(0,0.115)
		}
		c.rotate(PI/2-abs(this.f))
		c.image(this.textures.head, -0.25, 0, 0.5, 0.5)
	}
	place(){
		super.place()
		const can = Can(33, 12)
		const skinUnpacked = new ImageData(28, 12)
		for(let i = 0; i < 336; i++){
			skinUnpacked.data[i << 2] = this.skin[i * 3]
			skinUnpacked.data[(i << 2) + 1] = this.skin[i * 3 + 1]
			skinUnpacked.data[(i << 2) + 2] = this.skin[i * 3 + 2]
			skinUnpacked.data[(i << 2) + 3] = 255
		}
		skinCan.putImageData(skinUnpacked, 0, 0)
		can.drawImage(skinCan.canvas, 0, 0, 4, 12, 0, 0, 4, 12)
		can.drawImage(skinCan.canvas, 4, 0, 4, 12, 5, 0, 4, 12)
		can.drawImage(skinCan.canvas, 8, 0, 4, 12, 10, 0, 4, 12)
		can.drawImage(skinCan.canvas, 12, 0, 4, 12, 15, 0, 4, 12)
		can.drawImage(skinCan.canvas, 16, 0, 4, 12, 20, 0, 4, 12)
		can.drawImage(skinCan.canvas, 20, 4, 8, 8, 25, 0, 8, 8)
		this.textures = {
			head: can.crop(25, 0, 8, 8),
			body: can.crop(0, 0, 4, 12),
			arm1: can.crop(5, 0, 4, 12),
			arm2: can.crop(10, 0, 4, 12),
			leg1: can.crop(15, 0, 4, 12),
			leg2: can.crop(20, 0, 4, 12)
		}
	}
	static width = 0.3
	get height(){return this.state & 2 ? 1.5 : 1.8}
	get head(){return this.state & 2 ? 1.4 : 1.6}
	drawInterface(id, c){
		let slot = -1
		// x=0, y=0 => left middle
		// x=176 => right
		if(id == 0){
			c.image(meInterface, 0, 0)
			c.push()
			c.translate(50,5)
			c.scale(32,32)
			const f = this.f
			const {x, y} = c.mouse()
			this.f = atan2(x, y - me.head)
			this.render(c)
			this.f = f
			c.pop()
			c.translate(16, 2)
			c.scale(16,16)
			for(let i = 1; i < 5; i++){
				renderItem(c, this.items[i])
				renderItemCount(c, this.items[i])
				const {x, y} = c.mouse()
				if(y >= 0 && y < 1 && x >= -0.5 && x < .5){
					c.fillStyle = '#fff'
					c.globalAlpha = 0.2
					c.fillRect(-0.5, 0, 1, 1)
					c.globalAlpha = 1
					slot = i
				}
				c.translate(0, 1.125)
			}
			c.translate(4.3125, -4.5)
			{
				renderItem(c, this.items[5])
				renderItemCount(c, this.items[5])
				const {x, y} = c.mouse()
				if(y >= 0 && y < 1 && x >= -0.5 && x < .5){
					c.fillStyle = '#fff'
					c.globalAlpha = 0.2
					c.fillRect(-0.5, 0, 1, 1)
					c.globalAlpha = 1
					slot = 5
				}
			}
		}
		return slot
	}
}

const pop = Audio('/music/misc/pop.mp3')

Entities.item = class extends Entity{
	item = null
	static width = 0.125
	static height = 0.25
	static head = 0
	static savedata = {item: Item}
	render(c){
		if(!this.item) return
		c.translate(0, sin(t*2)/12+.15)
		c.scale(0.3125, 0.3125)
		renderItem(c, this.item)
		c.push()
		if(this.item.count > 1){
			c.translate(0.4, 0.4)
			renderItem(c, this.item)
		}
		if(this.item.count > 16){
			c.translate(-0.8, -0.2)
			renderItem(c, this.item)
		}
		if(this.item.count > 32){
			c.translate(0.6, -0.4)
			renderItem(c, this.item)
		}
		if(this.item.count > 48){
			c.translate(-0.4, 0.1)
			renderItem(c, this.item)
		}
		c.pop()
		if(renderF3){
			renderItemCount(c, this.item)
		}
	}
	1(buf){
		this.sound(pop,0.2,random()*1.5+0.5)
	}
	2(buf){
		this.item.count = buf.byte()
	}
}

const fuse = Audio('/music/misc/fuse.mp3')


Entities.tnt = class extends Entity{
	static width = 0.49
	static height = 0.98
	fusing = 0
	render(c){
		if(this.fusing){
			c.scale(1.1 - 1/(this.fusing+10), 1.1 - 1/(this.fusing+10))
			this.fusing++
		}
		c.image(Blocks.tnt.texture, -0.5, 0, 1, 1)
		c.globalAlpha = 0.7
		c.fillStyle = t*3&1 ? '#fff' : '#000'
		c.fillRect(-0.5,0,1,1)
		c.globalAlpha = 1
	}
	1(){
		this.sound(fuse)
	}	
	2(){ this.fusing = 1 }
	3(){
		this.sound(explode[floor(random()*explode.length)])
		for(let i = 0; i < 15; i++) new BlastParticle(this.x, this.y)
		for(let i = 0; i < 30; i++) new AshParticle(this.x, this.y)
	}
}
const endercrystal = Texture('/vanilla/endercrystal.png')
const endCrystalWiregrid = endercrystal.crop(32,16,16,16)
const endCrystalCore = endercrystal.crop(96,16,16,16)
Entities.end_crystal = class extends Entity{
	static width = 0.99
	static height = 1.99
	render(c){
		const t = this.age / TPS
		c.push()
		c.translate(0, 1.2 + sin(t * 4) / 3)
		c.rotate(t*-0.5)
		c.image(endCrystalCore, -0.4, -0.4, 0.8, 0.8)
		c.rotate(t)
		c.image(endCrystalWiregrid, -0.53, -0.53, 1.06, 1.06)
		c.rotate(t*-1.5)
		c.image(endCrystalWiregrid, -0.6, -0.6, 1.2, 1.2)
		c.pop()
	}
	3(){
		this.sound(explode[floor(random()*explode.length)])
		for(let i = 0; i < 15; i++) new BlastParticle(this.x, this.y)
		for(let i = 0; i < 30; i++) new AshParticle(this.x, this.y)
	}
	static gx = 0
	static gy = 0
}