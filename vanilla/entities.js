import { explode, AshParticle, BlastParticle, hurt } from './defs.js'
import { audioSet, renderItem, renderItemCount, renderSlot } from './effects.js'
import { Entities, Entity, Item, Blocks, BlockIDs, toTex, addParticle } from 'definitions'
import { renderF3, renderUI, drawLayer, drawText, calcText } from 'api'
import { getblock, cam, worldEvents, world, me, perms, getTint } from 'world'
import { renderLeft, renderRight } from './creativeInventory.js'

const src = loader(import.meta)

const meInterface = Img(src`meint.png`)

const damageSounds = [
	null, Wave(src`sound/fire/extinguish.mp3`)
]

const enterWaterSounds = [
	Wave(src`sound/water/enter1.mp3`),
	Wave(src`sound/water/enter2.mp3`),
	Wave(src`sound/water/enter3.mp3`)
], exitWaterSounds = [
	Wave(src`sound/water/exit1.mp3`),
	Wave(src`sound/water/exit2.mp3`),
	Wave(src`sound/water/exit3.mp3`)
], splashSounds = [
	Wave(src`sound/water/splash1.mp3`),
	Wave(src`sound/water/splash2.mp3`)
]
const nameBgCol = vec4(0, 0, 0, .2)
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
		if(this.name && ((renderF3&&renderUI) || this != me)){
			const c2 = c.sub()
			c2.translate(0, this.height+0.15)
			c2.scale(0.25)
			const arr = calcText(this.name, _, this.state&0x100?9:15)
			c2.drawRect(arr.width * -0.5 - .2, -.2, arr.width + 0.4, 1.4, nameBgCol)
			drawText(c2, arr, arr.width * -0.5, 0, 1)
		}
		if(ys < 0) c.translate(0, this.height)
		c.scale(xs, ys)
		if(this.state&0x8000) c.rotate(PI * (this.hitTimer*this.hitTimer - 1) * ((this.flags&1) - .5) * -xs)
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

const portalExit = Wave(src`sound/portal/exit.mp3`), endPortalMake = Wave(src`sound/portal/end.mp3`)
const thunder = audioSet('misc/thunder', 3)

const entityBackTint = vec4(.8, .8, .8, 1), entityHurtTint = vec4(.9, .6, .6, 1), entityBackHurtTint = vec4(.72, .48, .48, 1)
Entities.player = class extends LivingEntity{
	static alive = true
	inv = Array.null(37)
	items = [null, null, null, null, null]
	craftingSlots = [null, null, null, null]
	output = null
	mode = 0
	getItem(id, slot){return id == 0 && slot < 36 ? this.inv[slot] : id == 1 ? slot < 5 ? this.items[slot] : slot < 9 ? this.craftingSlots[slot-5] : slot == 10 ? this.output : undefined : id == 2 && slot == 0 ? this.inv[36] : undefined}
	setItem(id, slot, item){
		if(id == 0 && slot < 36) this.inv[slot] = item
		else if(id == 1){
			if(slot < 5) this.items[slot] = item
			else if(slot < 9) this.craftingSlots[slot-5] = item
			else if(slot == 10) this.output = item
		}else if(id == 2) this.inv[36] = item
	}
	slotClicked(id, slot, holding, player){
		if(id != 1 || slot < 9) return super.slotClicked(id, slot, holding, player)
		return holding
	}
	slotAltClicked(id, slot, holding, player){
		if(id != 1 || slot < 9) return super.slotAltClicked(id, slot, holding, player)
		return holding
	}
	selected = 0
	skin = null
	textures = null
	render(c, tint){
		if(super.render(c)) return
		if(!this.textures) return
		const angle = (this.state & 3) == 2 ? sin(t * 4) * this.dx / 5 : sin(t * 12) * this.dx / 10
		const extraAngle = this.state & 8 ? ((-5*t%1+1)%1)*((-5*t%1+1)%1)/3 : 0
		c.scale(0.9, 0.9)
		let backTint
		if(this.hitTimer) backTint = tint.times(entityBackHurtTint), tint = tint.times(entityHurtTint)
		else backTint = tint.times(entityBackTint)
		if(this.state & 2){
			c.translate(0.2, 1.2)
			c.rotate(.5 - angle)
			c.drawRect(-0.125, -0.625, 0.25, 0.75, this.textures.arm2, backTint)
			c.rotate(angle - .5)
			c.translate(-0.3,-0.45)
			c.rotate(angle)
			c.drawRect(-0.125, -0.75, 0.25, 0.75, this.textures.leg2, backTint)
			c.rotate(-angle + .5)
			c.drawRect(-0.125, -0.125, 0.25, 0.75, this.textures.body, tint)
			c.rotate(-0.5)
			c.rotate(-angle)
			c.drawRect(-0.125, -0.75, 0.25, 0.75, this.textures.leg1, tint)
			c.rotate(angle)
			c.translate(0.3, 0.45)
			c.rotate(angle + .5 - extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], tint, 1)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.drawRect(-0.125, -0.625, 0.25, 0.75, this.textures.arm1, tint)
			c.rotate(-angle - .5 + extraAngle)
		}else{
			c.translate(0, 1.375)
			c.rotate(-angle)
			c.drawRect(-0.125, -0.625, 0.25, 0.75, this.textures.arm2, backTint)
			c.rotate(angle)
			c.translate(0,-0.625)
			c.rotate(angle)
			c.drawRect(-0.125, -0.75, 0.25, 0.75, this.textures.leg2, backTint)
			c.rotate(-angle)
			c.drawRect(-0.125, 0, 0.25, 0.75, this.textures.body, tint)
			c.rotate(-angle)
			c.drawRect(-0.125, -0.75, 0.25, 0.75, this.textures.leg1, tint)
			c.rotate(angle)
			c.translate(0, 0.625)
			c.rotate(angle - extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], tint, 1)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.drawRect(-0.125, -0.625, 0.25, 0.75, this.textures.arm1, tint)
			c.rotate(extraAngle - angle)
			c.translate(0,0.115)
		}
		c.rotate(abs(this.f)-PI/2)
		c.drawRect(-0.25, 0, 0.5, 0.5, this.textures.head, tint)
	}
	place(){
		super.place()
		const can = Texture(28, 12, 1, 0, Formats.RGB)
		can.pasteData(this.skin)
		this.textures = {
			head: can.crop(20, 8, 8, -8),
			body: can.crop(0, 12, 4, -12),
			arm1: can.crop(4, 12, 4, -12),
			arm2: can.crop(8, 12, 4, -12),
			leg1: can.crop(12, 12, 4, -12),
			leg2: can.crop(16, 12, 4, -12)
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
		if(id != 1) return
		c.drawRect(-88, 0, 176, meInterface.subHeight, meInterface)
		const c2 = c.sub()
		c2.translate(-38,5)
		c2.scale(32,32)
		const f = this.f
		const {x, y} = c2.from(cursor)
		this.f = atan2(x, y - me.head)
		this.render(c2, getTint(this.x, this.y))
		this.f = f
		c2.resetTo(c)
		c2.translate(-72, 2)
		c2.scale(16,16)
		for(let i = 0; i < 4; i++){
			renderSlot(c2, this, i, 1)
			c2.translate(0, 1.125)
		}
		c2.translate(4.3125, -4.5)
		renderSlot(c2, this, 4, 1)
		c2.translate(1.3125, 1.625)
		renderSlot(c2, this, 5, 1)
		c2.translate(1.125, 0)
		renderSlot(c2, this, 6, 1)
		c2.translate(-1.125, 1.125)
		renderSlot(c2, this, 7, 1)
		c2.translate(1.125, 0)
		renderSlot(c2, this, 8, 1)
		c2.translate(2.375, -0.625)
		renderSlot(c2, this, 10, 1)
		drawInv(0, 0)
		if(this.mode == 1){
			c.translate(-w, h)
			renderLeft(c.sub())
			c.translate(w*2, 0)
			renderRight(c)
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

const pop = Wave(src`sound/misc/pop.mp3`)

Entities.item = class extends Entity{
	item = null
	static width = 0.125
	static height = 0.25
	static head = 0
	static savedata = {item: Item}
	render(c, tint){
		if(!this.item) return
		c.translate(0, sin(t*2)/12+.15)
		c.scale(0.36, 0.36)
		renderItem(c, this.item, tint)
		const c2 = c.sub()
		if(this.item.count > 1){
			c2.translate(0.4, 0.4)
			renderItem(c2, this.item, tint)
		}
		if(this.item.count > 16){
			c2.translate(-0.8, -0.2)
			renderItem(c2, this.item, tint)
		}
		if(this.item.count > 32){
			c2.translate(0.6, -0.4)
			renderItem(c2, this.item, tint)
		}
		if(this.item.count > 48){
			c2.translate(-0.4, 0.1)
			renderItem(c2, this.item, tint)
		}
		if(renderF3)
			renderItemCount(c, this.item)
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
	render(c, tint){
		const {texture} = BlockIDs[this.block] ?? Blocks.air
		if(texture) c.drawRect(-0.5, 0, 1, 1, toTex(texture), tint)
	}
}

const fuse = Wave(src`sound/misc/fuse.mp3`)
Entities.tnt = class extends Entity{
	static width = 0.49
	static height = 0.98
	fusing = 0
	render(c, tint){
		if(this.fusing){
			c.scale(1.1 - 1/(this.fusing+10), 1.1 - 1/(this.fusing+10))
			this.fusing++
		}
		c.drawRect(-0.5, 0, 1, 1, toTex(Blocks.tnt.texture), tint)
		const a = (t*3&1)&&.7
		c.drawRect(-0.5, 0, 1, 1, vec4(a,a,a,.7), tint)
	}
	1(){ this.sound(fuse) }
	2(){ this.fusing = 1 }
	3(){
		this.sound(explode)
		for(let i = 0; i < 15; i++) addParticle(new BlastParticle(this.x, this.y))
		for(let i = 0; i < 30; i++) addParticle(new AshParticle(this.x, this.y))
	}
}
const endercrystal = Img(src`endercrystal.png`)
const endCrystalWiregrid = endercrystal.crop(32,16,16,16)
const endCrystalCore = endercrystal.crop(96,16,16,16)
Entities.end_crystal = class extends Entity{
	static width = 0.99
	static height = 1.99
	render(c){
		const t = this.age / world.tps
		c.translate(0, 1.2 + sin(t * 4) / 3)
		c.rotate(t*0.5)
		c.drawRect(-0.4, -0.4, 0.8, 0.8, endCrystalCore)
		c.rotate(-t)
		c.drawRect(-0.53, -0.53, 1.06, 1.06, endCrystalWiregrid)
		c.rotate(t*1.5)
		c.drawRect(-0.6, -0.6, 1.2, 1.2, endCrystalWiregrid)
	}
	3(){
		this.sound(explode)
		for(let i = 0; i < 15; i++) addParticle(new BlastParticle(this.x, this.y))
		for(let i = 0; i < 30; i++) addParticle(new AshParticle(this.x, this.y))
	}
	static gx = 0
	static gy = 0
}

export let lightningBoltCount = 0
drawLayer('none', 50, c => {
	if(lightningBoltCount)
		c.draw(vec4((1-0.8**lightningBoltCount)*(t%.4<.2)))
})
const quarterAlpha = vec4(.25), halfAlpha = vec4(.5), fullAlpha = vec4(1)
Entities.lightning_bolt = class extends Entity{
	static gx = 0
	static gy = 0
	seed = randint()
	place(){ if(super.place()) lightningBoltCount++ }
	_fillRect(c, h = 32){
		c.drawRect(-1, 0, 2, h, quarterAlpha)
		c.drawRect(-2/3, 0, 4/3, h, halfAlpha)
		c.drawRect(-1/3, 0, 2/3, h, fullAlpha)
	}
	render(c){
		const seed = this.seed >> (this.age > 10 ? 16 : 1)
		let x = ((seed&15)-7.5)/30
		const c2 = c.sub()
		c2.skew(x, 0)
		this._fillRect(c2)
		c2.resetTo(c)
		let ox = x*32
		c2.translate(ox, 32)
		x = ((seed>>4&15)-7.5)/30
		c2.skew(x, 0)
		this._fillRect(c2)
		c2.resetTo(c)
		ox += x * 32
		c2.translate(ox, 64)
		x = ((seed>>8&15)-7.5)/30
		c2.skew(x, 0)
		this._fillRect(c2, 192)
	}
	1(){ this.sound(explode, 2) }
	remove(){ if(super.remove()) lightningBoltCount-- }
}