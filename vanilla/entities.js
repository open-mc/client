import { particlePng, explode, AshParticle, BlastParticle, hurt } from './defs.js'
import { audioSet, renderItem, renderItemCount, renderSlot } from './effects.js'
import { Entities, Entity, Item, Blocks, BlockIDs } from 'definitions'
import { renderF3, uiLayer } from 'api'
import { getblock, cam, worldEvents, world } from 'world'
import { renderLeft, renderRight } from './creativeInventory.js'

const {Audio, Texture} = loader(import.meta)

const meInterface = Texture('meint.png')

const damageSounds = [
	null, Audio('sound/fire/extinguish.mp3')
]

const enterWaterSounds = [
	Audio('sound/water/enter1.mp3'),
	Audio('sound/water/enter2.mp3'),
	Audio('sound/water/enter3.mp3')
], exitWaterSounds = [
	Audio('sound/water/exit1.mp3'),
	Audio('sound/water/exit2.mp3'),
	Audio('sound/water/exit3.mp3')
], splashSounds = [
	Audio('sound/water/splash1.mp3'),
	Audio('sound/water/splash2.mp3')
]

export class LivingEntity extends Entity{
	health = 20
	hitTimer = 0
	hurtTextures = null
	textures = null
	static stepHeight = 0.5
	99(buf){
		const oldHealth = this.health
		this.health = buf.byte()
		const fields = buf.byte()
		if(this.health < oldHealth){
			if(this == me) cam.f = cam.baseF + 0.15
			this.sound(hurt)
			if(fields & 1){
				if(this.health) this.hitTimer = 0.5
				else this.hitTimer = 1, this.flags = this.flags & -2 | (this.dx>=0)
			}
		}
		const d = damageSounds[fields >> 2]
		if(d) this.sound(d,0.5,2)
	}
	render(c){
		this.hitTimer -= dt
		if(this.hitTimer < 0) this.hitTimer = 0
		if(false && !this.hitTimer) return true
		const xs = this.f >= 0 ? 1 : -1, ys = this.name == 'Dinnerbone' || this.name == 'Grumm' ? -1 : 1
		if(this.name && (renderF3 || this != me)){
			c.textAlign = 'center'
			const {width, top, bottom} = c.measureText(this.name, 0.3)
			c.fillStyle = '#000'
			c.globalAlpha *= 0.2
			c.fillRect(width * -0.5 - 0.05, this.height + 0.15 - 0.05, width + 0.1, bottom + top + 0.1)
			c.globalAlpha /= .2
			c.fillStyle = this.state&0x100?'#f44':'#fff'
			c.fillText(this.name, 0, this.height + 0.15 + bottom * 0.3, 0.3)
		}
		if(ys < 0) c.translate(0, this.height)
		c.scale(xs, ys)
		//if(this.state&0x8000) c.rotate(PI * (this.hitTimer*this.hitTimer - 1) * ((this.flags&1) - .5) * xs)
	}
	blocksWalked = 0
	update(){
		super.update()
		this.blocksWalked += abs(this.dx * dt)
		if((this.impactDy < 0) && !(this.state & 2)){
			if(this.blocksWalked >= 1.7){
				this.blocksWalked = 0
				const x = floor(this.x + this.dx * dt), y = ceil(this.y) - 1
				const block = getblock(x, y)
				if(block.walk) block.walk(x, y, this)
			}
		}else this.blocksWalked = this.dy < -10 ? 1.7 : 1.68

		const l = this.state&0x20000, l2 = this.state&0x40000
		const c = getblock(floor(this.x), floor(this.y+this.head)).fluidType == 'water', c2 = getblock(floor(this.x), floor(this.y+this.height*.25)).fluidType == 'water'
		this.state = this.state&~0x60000|c<<17|c2<<18
		if(l && !c){
			// Left water
			this.sound(exitWaterSounds, .3, 1)
		}else if(c && !l){
			// Entered water
			this.sound(enterWaterSounds, .5, 1)
		}
		if(c2 && !l2){
			this.sound(splashSounds, min(this.dy/20,2), random()*.8+.6)
		}
	}
}

const portalEnter = Audio('sound/portal/enter.mp3'), portalExit = Audio('sound/portal/exit.mp3'), endPortalMake = Audio('sound/portal/end.mp3')
const thunder = audioSet('misc/thunder', 3)

const skinCan = Can(28, 12, true)
Entities.player = class extends LivingEntity{
	static alive = true
	inv = Array.null(37)
	items = [null, null, null, null, null]
	mode = 0
	getItem(id, slot){return id == 0 && slot < 36 ? this.inv[slot] : id == 1 && slot < 5 ? this.items[slot] : id == 2 ? this.inv[36] : null}
	setItem(id, slot, item){
		if(id == 0 && slot < 36) this.inv[slot] = item
		else if(id == 1) this.items[slot] = item
		else if(id == 2) this.inv[36] = item
	}
	selected = 0
	skin = null
	textures = null
	render(c){
		if(super.render(c)) return
		if(!this.textures) return
		const angle = (this.state & 3) == 2 ? sin(t * 4) * this.dx / 5 : sin(t * 12) * this.dx / 10
		const extraAngle = this.state & 8 ? ((-5*t%1+1)%1)*((-5*t%1+1)%1)/3 : 0
		c.scale(0.9,0.9)
		if(this.hitTimer) c.beginPath()
		c.fillStyle = '#0003'
		if(this.state & 2){
			c.translate(0.2, 1.2)
			c.rotate(angle - .5)
			c.imageTrace(this.textures.arm2, -0.125, -0.625, 0.25, 0.75)
			c.fillRect(-0.125, -0.625, 0.25, 0.75)
			c.rotate(-angle + .5)
			c.translate(-0.3,-0.45)
			c.rotate(-angle)
			c.imageTrace(this.textures.leg2, -0.125, -0.75, 0.25, 0.75)
			c.fillRect(-0.125, -0.75, 0.25, 0.75)
			c.rotate(angle - .5)
			c.imageTrace(this.textures.body, -0.125, -0.125, 0.25, 0.75)
			c.rotate(0.5)
			c.rotate(angle)
			c.imageTrace(this.textures.leg1, -0.125, -0.75, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0.3, 0.45)
			c.rotate(-angle - .5 + extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], true)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.imageTrace(this.textures.arm1, -0.125, -0.625, 0.25, 0.75)
			c.rotate(angle + .5 - extraAngle)
		}else{
			c.translate(0, 1.375)
			c.rotate(angle)
			c.imageTrace(this.textures.arm2, -0.125, -0.625, 0.25, 0.75)
			c.fillRect(-0.125, -0.625, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0,-0.625)
			c.rotate(-angle)
			c.imageTrace(this.textures.leg2, -0.125, -0.75, 0.25, 0.75)
			c.fillRect(-0.125, -0.75, 0.25, 0.75)
			c.rotate(angle)
			c.imageTrace(this.textures.body, -0.125, 0, 0.25, 0.75)
			c.rotate(angle)
			c.imageTrace(this.textures.leg1, -0.125, -0.75, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0, 0.625)
			c.rotate(-angle + extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], true)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.imageTrace(this.textures.arm1, -0.125, -0.625, 0.25, 0.75)
			c.rotate(angle - extraAngle)
			c.translate(0,0.115)
		}
		c.rotate(PI/2-abs(this.f))
		c.imageTrace(this.textures.head, -0.25, 0, 0.5, 0.5)

		if(this.hitTimer) c.fillStyle = '#f004', c.fill()
	}
	place(){
		super.place()
		const can = Can(33, 12, true)
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
	update(){
		super.update()
		if(this == me && perms<3)this.state&=-2
	}
	drawInterface(id, c, drawInv, w, h){
		if(id == 1){
			c.image(meInterface, -88, 0)
			c.push()
			c.translate(-38,5)
			c.scale(32,32)
			const f = this.f
			const {x, y} = c.mouse()
			this.f = atan2(x, y - me.head)
			this.render(c)
			this.f = f
			c.peek()
			c.translate(-72, 2)
			c.scale(16,16)
			for(let i = 0; i < 4; i++){
				renderSlot(c, this, i, 1)
				c.translate(0, 1.125)
			}
			c.translate(4.3125, -4.5)
			renderSlot(c, this, 4, 1)
			c.pop()
			drawInv(0, 0)
			if(this.mode == 1){
				c.translate(-w, h)
				c.push()
				renderLeft(c)
				c.pop()
				c.translate(w*2, 0)
				c.push()
				renderRight(c)
			}
		}
	}
	20(buf){ this.mode = buf.byte() }
}

Entity[13] = function(buf){
	const b = buf.byte()
	if(this == me) return
	this.selected = b
}

worldEvents[50] = () => {
	me.sound(portalExit, 0.25, random() * 0.4 + 0.8)
}
worldEvents[52] = () => {
	// Heard portal open
	me.sound(endPortalMake)
}
worldEvents[53] = buf => {
	me.sound(thunder, buf.float(), random()*.2+.8)
}

const pop = Audio('sound/misc/pop.mp3')

Entities.item = class extends Entity{
	item = null
	static width = 0.125
	static height = 0.25
	static head = 0
	static savedata = {item: Item}
	render(c){
		if(!this.item) return
		c.translate(0, sin(t*2)/12+.15)
		c.scale(0.36, 0.36)
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
		const c = buf.byte()
		this.sound(pop,0.2,random()*1.5+0.5)
		if(!this.item) return
		this.item.count = c
	}
	2(buf){
		const c = buf.byte()
		if(!this.item) return
		this.item.count = c
	}
}

Entities.falling_block = class extends Entity{
	static width = 0.49
	static height = 0.98
	block = 0
	render(c){
		const {texture} = BlockIDs[this.block] ?? Blocks.air
		if(texture) c.image(texture, -0.5, 0, 1, 1)
	}
}

const fuse = Audio('sound/misc/fuse.mp3')
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
		this.sound(explode)
		for(let i = 0; i < 15; i++) new BlastParticle(this.x, this.y)
		for(let i = 0; i < 30; i++) new AshParticle(this.x, this.y)
	}
}
const endercrystal = Texture('endercrystal.png')
const endCrystalWiregrid = endercrystal.crop(32,16,16,16)
const endCrystalCore = endercrystal.crop(96,16,16,16)
Entities.end_crystal = class extends Entity{
	static width = 0.99
	static height = 1.99
	render(c){
		const t = this.age / world.tps
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
		this.sound(explode)
		for(let i = 0; i < 15; i++) new BlastParticle(this.x, this.y)
		for(let i = 0; i < 30; i++) new AshParticle(this.x, this.y)
	}
	static gx = 0
	static gy = 0
}

export let lightningBoltCount = 0
uiLayer(50, (c, w, h) => {
	if(!lightningBoltCount) return
	c.fillStyle = '#fff'
	c.globalAlpha = (1-0.8**lightningBoltCount)*(t%.4<.2)
	c.fillRect(0, 0, w, h)
	c.globalAlpha = 1
})
Entities.lightning_bolt = class extends Entity{
	static gx = 0
	static gy = 0
	seed = randint()
	place(){ if(super.place()) lightningBoltCount++ }
	_fillRect(c, h = 32){
		c.globalAlpha = 0.25
		c.fillRect(-1, 0, 2, h)
		c.globalAlpha = 0.5
		c.fillRect(-2/3, 0, 4/3, h)
		c.globalAlpha = 1
		c.fillRect(-1/3, 0, 2/3, h)
	}
	render(c){
		c.fillStyle = '#fff'
		c.push()
		const seed = this.seed >> (this.age > 10 ? 16 : 1)
		let x = ((seed&15)-7.5)/30
		c.transform(1, 0, x, 1, 0, 0)
		this._fillRect(c)
		c.peek()
		let ox = x*32
		c.translate(ox, 32)
		x = ((seed>>4&15)-7.5)/30
		c.transform(1, 0, x, 1, 0, 0)
		this._fillRect(c)
		c.peek()
		ox += x * 32
		c.translate(ox, 32*2)
		x = ((seed>>8&15)-7.5)/30
		c.transform(1, 0, x, 1, 0, 0)
		this._fillRect(c, 192)
		c.pop()
	}
	1(){
		this.sound(explode, 2)
	}
	remove(){ if(super.remove()) lightningBoltCount-- }
}