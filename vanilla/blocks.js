import { uiButtons, audioSet, lava, renderSlot, water, renderGenericTooltip } from './effects.js'
import click from '/core/img/click.mp3'
import { cam, world, mode, BlockTexture, toTex, BiomeTint } from 'world'
import { Blocks, Block, Items, BlockFlags } from 'definitions'
import { BlockShape, blockShaped, fluidify } from './blockshapes.js'
import { closeInterface } from './interfaces.js'
import { uiButton, drawLayer, drawText } from 'api'
import { sound, update, redraw } from 'ant'

import blocksPng from './blocks.png'
import itemsPng from './items.png'
import animatedPng from './animated.png'

Blocks.air = class extends Block{
	static flags = BlockFlags.REPLACEABLE
	static opacity = 0
	static minLight = 4
}
Blocks.grass = class extends Block{
	static dirt = true
	static texture = BlockTexture(blocksPng, 0, 0, _, _, BiomeTint.TINT_OVERLAY, false)
	static breaktime = 1.5
	static tool = 'shovel'
	static placeSounds = audioSet('grass/place', 4)
	static stepSounds = audioSet('grass/step', 6)
}
Blocks.tall_grass = class extends Block{
	static texture = BlockTexture(blocksPng, 4, 1, _, _, BiomeTint.TINT)
	static flags = BlockFlags.TARGETTABLE | BlockFlags.REPLACEABLE
	static breaktime = 0
	static opacity = 0
	static placeSounds = Blocks.grass.placeSounds
}

class Wool extends Block{
	static opacity = 1
	static tool = 'shears'
	static breaktime = 1.2
	static stepSounds = audioSet('wool/place', 4)
	static placeSounds = this.stepSounds
}

Blocks.white_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 0, 14) }
Blocks.light_grey_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 1, 14) }
Blocks.grey_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 2, 14) }
Blocks.black_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 3, 14) }
Blocks.red_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 4, 14) }
Blocks.orange_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 5, 14) }
Blocks.yellow_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 6, 14) }
Blocks.lime_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 7, 14) }
Blocks.green_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 8, 14) }
Blocks.cyan_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 9, 14) }
Blocks.light_blue_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 10, 14) }
Blocks.blue_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 11, 14) }
Blocks.purple_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 12, 14) }
Blocks.magenta_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 13, 14) }
Blocks.pink_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 14, 14) }
Blocks.brown_wool = class extends Wool{ static texture = BlockTexture(blocksPng, 15, 14) }

Blocks.cactus = class extends Block{
	static texture = BlockTexture(blocksPng, 6, 4)
	static blockShape = [.0625, 0, .9375, 1]
	static flags = BlockFlags.HARD_TOP | BlockFlags.SOLID_TOP | BlockFlags.TARGETTABLE | BlockFlags.FRAGILE
	static opacity = 0
	static breaktime = .5
	static placeSounds = Wool.placeSounds
}

Blocks.dead_bush = class extends Block{
	static texture = BlockTexture(blocksPng, 13, 4)
	static flags = BlockFlags.TARGETTABLE | BlockFlags.FRAGILE
	static opacity = 0
	static breaktime = 0
	static placeSounds = Blocks.grass.placeSounds
}

class Stone extends Block{
	static tool = 'pick'
	static texture = BlockTexture(blocksPng, 3, 0)
	static placeSounds = audioSet('stone/place', 4)
	static stepSounds = audioSet('stone/step', 6)
	static breaktime = 7.5
}
Blocks.stone = Stone
Blocks.cobblestone = class extends Stone{
	static texture = BlockTexture(blocksPng, 0, 1)
}
Blocks.obsidian = class extends Stone{
	static texture = BlockTexture(blocksPng, 5, 2)
	static breaktime = 250
	static opacity = 8
}

Blocks.glowing_obsidian = class extends Blocks.obsidian{
	static breaktime = 500
	static texture = BlockTexture(blocksPng, 5, 4)
	static opacity = 8
	static brightness = 15
}
Blocks.dirt = class extends Block{
	static dirt = true
	static texture = BlockTexture(blocksPng, 2, 0)
	static breaktime = 1
	static tool = 'shovel'
	static placeSounds = audioSet('dirt/place', 4)
	static stepSounds = audioSet('dirt/step', 4)
}
Blocks.farmland = class extends Blocks.dirt{
	static texture = BlockTexture(blocksPng, 6, 2)
	static blockShape = [0, 0, 1, 0.9375]
}
Blocks.hydrated_farmland = class extends Blocks.dirt{
	static texture = BlockTexture(blocksPng, 7, 2)
	static blockShape = [0, 0, 1, 0.9375]
}
Blocks.bedrock = class extends Stone{
	static texture = BlockTexture(blocksPng, 1, 1)
	static breaktime = Infinity
	static tool = 'pick'
	static opacity = 15
}
class Wood extends Block{
	static placeSounds = audioSet('wood/place', 4)
	static stepSounds = audioSet('wood/step', 6)
	static tool = 'axe'
	static breaktime = 5
}
Blocks.oak_log = class extends Wood{ static texture = BlockTexture(blocksPng, 0, 13) }
Blocks.birch_log = class extends Wood{ static texture = BlockTexture(blocksPng, 2, 13) }
Blocks.spruce_log = class extends Wood{ static texture = BlockTexture(blocksPng, 4, 13) }
Blocks.dark_oak_log = class extends Wood{ static texture = BlockTexture(blocksPng, 6, 13) }
Blocks.acacia_log = class extends Wood{ static texture = BlockTexture(blocksPng, 8, 13) }
Blocks.jungle_log = class extends Wood{ static texture = BlockTexture(blocksPng, 10, 13) }

class Planks extends Wood{
	static breaktime = 3
}
Blocks.oak_planks = class extends Planks{
	static texture = BlockTexture(blocksPng, 1, 13)
}
Blocks.birch_planks = class extends Planks{
	static texture = BlockTexture(blocksPng, 3, 13)
}
Blocks.spruce_planks = class extends Planks{
	static texture = BlockTexture(blocksPng, 5, 13)
}
Blocks.dark_oak_planks = class extends Planks{
	static texture = BlockTexture(blocksPng, 7, 13)
}
Blocks.acacia_planks = class extends Planks{
	static texture = BlockTexture(blocksPng, 9, 13)
}
Blocks.jungle_planks = class extends Planks{
	static texture = BlockTexture(blocksPng, 11, 13)
}

Blocks.oak_planks_slab = blockShaped(Blocks.oak_planks, BlockShape.SLAB)
Blocks.oak_planks_upper_slab = blockShaped(Blocks.oak_planks, BlockShape.UPPER_SLAB)

Blocks.birch_planks_slab = blockShaped(Blocks.birch_planks, BlockShape.SLAB)
Blocks.birch_planks_upper_slab = blockShaped(Blocks.birch_planks, BlockShape.UPPER_SLAB)

Blocks.spruce_planks_slab = blockShaped(Blocks.spruce_planks, BlockShape.SLAB)
Blocks.spruce_planks_upper_slab = blockShaped(Blocks.spruce_planks, BlockShape.UPPER_SLAB)

Blocks.dark_oak_planks_slab = blockShaped(Blocks.dark_oak_planks, BlockShape.SLAB)
Blocks.dark_oak_planks_upper_slab = blockShaped(Blocks.dark_oak_planks, BlockShape.UPPER_SLAB)

Blocks.acacia_planks_slab = blockShaped(Blocks.acacia_planks, BlockShape.SLAB)
Blocks.acacia_planks_upper_slab = blockShaped(Blocks.acacia_planks, BlockShape.UPPER_SLAB)

Blocks.jungle_planks_slab = blockShaped(Blocks.jungle_planks, BlockShape.SLAB)
Blocks.jungle_planks_upper_slab = blockShaped(Blocks.jungle_planks, BlockShape.UPPER_SLAB)

Blocks.sand = class extends Block{
	static texture = BlockTexture(blocksPng, 2, 1)
	static breaktime = 1
	static placeSounds = audioSet('sand/place', 4)
	static stepSounds = audioSet('sand/step', 5)
}
Blocks.gravel = class extends Blocks.sand{
	static texture = BlockTexture(blocksPng, 3, 1)
}
Blocks.glass = class extends Block{
	static opacity = 0
	static breaktime = 0.6
	static breakSounds = audioSet('glass/break', 3)
	static texture = BlockTexture(blocksPng, 1, 3)
	static placeSounds = Blocks.stone.placeSounds
	static stepSounds = Blocks.stone.stepSounds
}

const bucketSounds = {
	fillLava: audioSet('bucket/fill_lava', 3),
	emptyLava: audioSet('bucket/empty_lava', 3),
	fillWater: audioSet('bucket/fill_water', 3),
	emptyWater: audioSet('bucket/empty_water', 3)
}

export class Water extends Block{
	static opacity = 1
	static minLight = 5
	static flags = BlockFlags.REPLACEABLE | BlockFlags.CLIMBABLE
	static viscosity = 0.15
	random(){
		if(this.source === false){
			const r = random()
			if(r < .05)
				sound(water.ambient[0], 1, 1)
			else if(r < .1)
				sound(water.ambient[1], 1, 1)
		}
	}
	32(){ sound(fireExtinguish, 0.7, random()*.8+1.2) }
	33(){ sound(bucketSounds.emptyWater) }
	34(){ sound(bucketSounds.fillWater) }
}
void({
	filled: Blocks.water,
	top: Blocks.waterTop,
	flowing: Blocks.waterFlowing,
	levels: [, Blocks.waterFlowing1, Blocks.waterFlowing2, Blocks.waterFlowing3, Blocks.waterFlowing4, Blocks.waterFlowing5, Blocks.waterFlowing6, Blocks.waterFlowing7]
} = fluidify(Water, 'water', BlockTexture(animatedPng, 2, 0, 32, 1, BiomeTint.TINT), BlockTexture(animatedPng, 5, 0, 64, 1, BiomeTint.TINT)))
export class Lava extends Block{
	static opacity = 0
	static flags = BlockFlags.REPLACEABLE | BlockFlags.CLIMBABLE
	static viscosity = 0.5
	static brightness = 15
	random(){
		const r = random()
		if(r < .015)
			sound(lava.ambient, 1, 1)
		else if(r < .25)
			sound(lava.pop, 1, 1)
	}
	32(){ sound(fireExtinguish, 0.7, random()*.8+1.2) }
	33(){ sound(bucketSounds.emptyLava) }
	34(){ sound(bucketSounds.fillLava) }
}
void({
	filled: Blocks.lava,
	top: Blocks.lavaTop,
	flowing: Blocks.lavaFlowing,
	levels: [, Blocks.lavaFlowing1, Blocks.lavaFlowing2, Blocks.lavaFlowing3, Blocks.lavaFlowing4, Blocks.lavaFlowing5, Blocks.lavaFlowing6, Blocks.lavaFlowing7]
} = fluidify(Lava, 'lava', BlockTexture(animatedPng, 3, 0, 38, 2), BlockTexture(animatedPng, 4, 0, 32, 2)))

Blocks.sandstone = class extends Stone{
	static texture = BlockTexture(blocksPng, 1, 11)
	static breaktime = 4
}
Blocks.cut_sandstone = class extends Blocks.sandstone{}
Blocks.smooth_sandstone = class extends Blocks.sandstone{}
Blocks.chiseled_sandstone = class extends Blocks.sandstone{}
Blocks.red_sandstone = class extends Blocks.sandstone{}
Blocks.cut_red_sandstone = class extends Blocks.sandstone{}
Blocks.chiseled_red_sandstone = class extends Blocks.sandstone{}
Blocks.smooth_red_sandstone = class extends Blocks.sandstone{}
Blocks.snow_block = class extends Block{
	static opacity = 1
	static texture = BlockTexture(blocksPng, 2, 4)
	static breaktime = 0.75
}
Blocks.snowy_grass = class extends Blocks.grass{
	static texture = BlockTexture(blocksPng, 4, 4)
}
Blocks.coal_ore = class extends Stone{
	static breaktime = 15
	static texture = BlockTexture(blocksPng, 2, 2)
}
Blocks.iron_ore = class extends Stone{
	static breaktime = 15
	static texture = BlockTexture(blocksPng, 1, 2)
}
Blocks.netherrack = class extends Block{
	static breaktime = 2
	static texture = BlockTexture(blocksPng, 7, 6)
	static tool = 'pick'
	static placeSounds = audioSet('netherrack/place', 6)
	static stepSounds = audioSet('netherrack/step', 6)
}
Blocks.quartz_ore = class extends Blocks.netherrack{
	static texture = BlockTexture(blocksPng, 6, 6)
}

Blocks.tnt = class extends Block{
	static breaktime = 0
	static minLight = 9
	static texture = BlockTexture(blocksPng, 8, 0)
	static stepSounds = Blocks.grass.placeSounds
	static placeSounds = Blocks.grass.placeSounds
}

Blocks.endstone = class extends Block{
	static breaktime = 15
	static texture = BlockTexture(blocksPng, 7, 4)
	static tool = 'pick'
	static placeSounds = Blocks.stone.placeSounds
	static stepSounds = Blocks.stone.stepSounds
}
export const chestTop = blocksPng.crop(9*16, 3*16, 16, 16)
import chestOpen from './sound/containers/open_chest.mp3'
import chestClose from './sound/containers/close_chest.mp3'
import containerInterface from './container.png'
Blocks.chest = class extends Block{
	static blockShape = [1/16, 0, 15/16, 7/8]
	static texture = BlockTexture(blocksPng, 10, 3)
	static placeSounds = Wood.placeSounds
	static stepSounds = Wood.stepSounds
	static interactible = true
	items = Array.null(27)
	getItem(id, slot){ return id == 0 ? this.items[slot] : undefined}
	setItem(id, slot, item){
		let old = item
		if(id == 0) old = this.items[slot], this.items[slot] = item
		return old
	}
	drawInterface(id, c, drawInv){
		if(id != 0) return
		c.drawRect(-88, 0, 176, containerInterface.subHeight, containerInterface)
		const c2 = c.sub()
		c2.translate(-72, 46)
		c2.scale(16, 16)
		for(let i = 0; i < 27; i++){
			renderSlot(c2, this, i)
			if(i%9==8) c2.translate(-9, -1.125)
			else c2.translate(1.125, 0)
		}
		drawText(c, [8, this.name||Items.chest.defaultName], -80, 65, 8)
		drawInv(0, 0)
		drawText(c, [8, 'Inventory'], -80, -1, 8)
	}
	name = ''
	state = 0
	opening = 0
	1(buf){
		const old = this.state
		this.state = buf.byte()
		if((this.state^old)&2){
			this.opening = 1
			sound(this.state&2 ? chestOpen : chestClose, 0.5, 1 - random()*.1)
		}
	}
	render(c, tint){
		if(this.state&1) c.box(1, 0, -1, 1)
		this.opening = max(this.opening - dt*3, 0)
		const rot = (0.5**((this.state & 2 ? 1 - this.opening : this.opening)*4)-1)*16/15
		c.translate(0.0625, 0.625)
		c.rotate(rot*PI/2)
		c.drawRect(-0.0625, -0.625, 1, 1, chestTop, tint)
	}
	static tool = 'axe'
}

Blocks.dragon_egg = class extends Block{
	static texture = BlockTexture(blocksPng, 15, 0)
	static brightness = 1
}

Blocks.ice = class Ice extends Block{
	static opacity = 1
}
Blocks.packed_ice = class extends Blocks.ice{
	static opacity = 2
}


class MineralBlock extends Block{}
Blocks.lapis_block = MineralBlock
Blocks.coal_block = MineralBlock
Blocks.iron_block = MineralBlock
Blocks.gold_block = MineralBlock
Blocks.emerald_block = MineralBlock
Blocks.diamond_block = MineralBlock

import fireAmbient from './sound/fire/ambient.mp3'
import portalAmbient from './sound/portal/ambient.mp3'
import fireExtinguish from './sound/fire/extinguish.mp3'
import flintIgnite from './sound/fire/ignite.mp3'
import portalEnter from './sound/portal/enter.mp3'

Blocks.fire = class extends Block{
	static flags = BlockFlags.REPLACEABLE | BlockFlags.TARGET_CAPTURE
	static canTarget = false
	static texture = BlockTexture(animatedPng, 1, 0, 32)
	static placeSounds = [flintIgnite]
	static opacity = 0
	static brightness = 14
	random(){
		sound(fireAmbient, random() + 1, random() * 0.7 + 0.3)
	}
	destroyed(){
		sound(fireExtinguish, 0.5, random() * 1.6 + 1.8)
	}
}
let portalEffect = 0, inPortal = false
Blocks.portal = class extends Block{
	static flags = BlockFlags.TARGET_BLOCKING | BlockFlags.FRAGILE
	static blockShape = [0.375, 0, 0.625, 1]
	static texture = BlockTexture(animatedPng, 0, 0, 32)
	static opacity = 0
	static brightness = 11
	random(){
		sound(portalAmbient, 0.5, random() * 0.4 + 0.8)
	}
	touched(e){
		if(e == me && !inPortal){
			if(!portalEffect) me.sound(portalEnter)
			portalEffect += dt
			inPortal = true
		}
	}
}
import portalOverlay from './portal.png'
import endPortalOverlay from './endportaloverlay.png'

drawLayer('none', 400, c => {
	if(!inPortal){ portalEffect = 0; if(!cam.nausea) return }
	inPortal = false
	cam.nausea += (min(1, portalEffect/2)-cam.nausea)*dt
	if(!portalEffect && cam.nausea < 0.1) cam.nausea = max(0, cam.nausea-dt*.2)
	if(cam.nausea) c.draw(portalOverlay.sub(0, (world.animTick%32)/32, 1, 1/32), vec4(cam.nausea))
})
const endShader = Shader(`
#define PI 3.1415927
#define ROT_MAT(rot) mat2(cos(rot),-sin(rot),-sin(rot),-cos(rot))
#define MULTIPLY(pos, mat, off) vec3(mod(pos*mat+vec2(0,uni1/100.),vec2(.25,1.))+vec2(off,0),0)
void main(){
	const mat2 PITHIRD = ROT_MAT(PI/3.);
	const mat2 PIHALF = ROT_MAT(PI/2.);
	const mat2 PINQUARTER = ROT_MAT(PI/-4.);
	const mat2 PIONE = ROT_MAT(PI);
	vec2 pos = xy*uni2/1000.;
	color = getColor(uni0, MULTIPLY(pos,PITHIRD,0.));
	color += getColor(uni0, MULTIPLY(pos,PIHALF,.25))*.9;
	color += getColor(uni0, MULTIPLY(pos,PINQUARTER,.5))*.5;
	color += getColor(uni0, MULTIPLY(pos,PIONE,.75))*.4;
	color *= arg0;
}`, VEC4, vec4.one, [TEXTURE, FLOAT, VEC2])
let endShaderT = -1
Blocks.end_portal = class extends Block{
	static flags = BlockFlags.TARGET_BLOCKING
	static blockShape = [0, 0, 1, 0.75]
	static softness = 1
	static texture = BlockTexture(blocksPng, 14, 0)
	static opacity = 0
	static brightness = 11
	render(c, tint){
		if(endShaderT != (endShaderT=t))
			endShader.uniforms(endPortalOverlay, t, vec2(c.width, c.height))
		c.shader = endShader
		c.drawRect(0, 0, 1, 0.75, tint)
		c.shader = null
	}
}

Blocks.end_portal_frame = class extends Block{
	static texture = BlockTexture(blocksPng, 9, 0)
	static breaktime = Infinity
	static placeSounds = Blocks.stone.placeSounds
	static blockShape = [0, 0, 1, 13/16]
}
Blocks.filled_end_portal_frame = class extends Blocks.end_portal_frame{
	static texture = BlockTexture(blocksPng, 10, 0)
	static placeSounds = audioSet('portal/eye', 3)
}

Blocks.sugar_cane = class extends Block{
	static breaktime = 0
	static opacity = 0
	static flags = BlockFlags.TARGETTABLE
	static placeSounds = Blocks.grass.placeSounds
	static texture = BlockTexture(blocksPng, 9, 4)
}
Blocks.pumpkin_leaf = class extends Block{
	static opacity = 0
}
Blocks.pumpkin_leaf1 = class extends Blocks.pumpkin_leaf{ }
Blocks.pumpkin_leaf2 = class extends Blocks.pumpkin_leaf{ }
Blocks.pumpkin_leaf3 = class extends Blocks.pumpkin_leaf{ }

class Sapling extends Block{
	static flags = BlockFlags.TARGETTABLE
	static opacity = 0
	static placeSounds = Blocks.grass.placeSounds
}

Blocks.oak_sapling = class extends Sapling{
	static texture = BlockTexture(blocksPng, 14, 2)
}

Blocks.birch_sapling = class extends Sapling{
	static texture = BlockTexture(blocksPng, 15, 4)
}

Blocks.spruce_sapling = class extends Sapling{
	static texture = BlockTexture(blocksPng, 15, 3)
}

Blocks.dark_oak_sapling = class extends Sapling{
	static texture = BlockTexture(blocksPng, 14, 4)
}

Blocks.acacia_sapling = class extends Sapling{
	static texture = BlockTexture(blocksPng, 14, 3)
}

Blocks.jungle_sapling = class extends Sapling{
	static texture = BlockTexture(blocksPng, 15, 2)
}

class Leaves extends Block{
	static opacity = 1
	static placeSounds = Blocks.grass.placeSounds
	static stepSounds = Blocks.grass.stepSounds
}

Blocks.oak_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 0, 12)
}
Blocks.birch_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 2, 12)
}
Blocks.spruce_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 2, 12)
}
Blocks.dark_oak_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 0, 12)
}
Blocks.acacia_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 0, 12)
}
Blocks.jungle_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 4, 12)
}

Blocks.oak_log_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 5, 12)
}
Blocks.birch_log_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 6, 12)
}
Blocks.spruce_log_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 7, 12)
}
Blocks.dark_oak_log_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 8, 12)
}
Blocks.acacia_log_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 9, 12)
}
Blocks.jungle_log_leaves = class extends Leaves{
	static texture = BlockTexture(blocksPng, 10, 12)
}
Blocks.crafting_table = class extends Planks{
	static texture = BlockTexture(blocksPng, 12, 3)
	static interactible = true
}
import furnaceInterface from './furnace.png'
const furnaceUI = furnaceInterface.crop(0, 0, 176, 80), cookArrow = furnaceInterface.crop(176, 14, 24, 17), fuelIndicator = furnaceInterface.crop(176, 0, 14, 14)
const furnaceTex = BlockTexture(blocksPng, 12, 2), furnaceLitTex = BlockTexture(blocksPng, 13, 3)
Blocks.furnace = class extends Stone{
	static interactible = true
	static texture = furnaceTex
	brightness = 0; texture = furnaceTex
	drawInterface(id, c, drawInv){
		if(id != 0) return
		const c2 = c.sub()
		c2.drawRect(-88, 0, 176, furnaceUI.subHeight, furnaceUI)
		c2.translate(-24, 11)
		c2.scale(16, 16)
		renderSlot(c2, this, 1, 0)
		c2.translate(0, 2.25)
		renderSlot(c2, this, 0, 0)
		c2.translate(3.75, -1.125)
		renderSlot(c2, this, 2, 0)
		c2.resetTo(c)
		const w = this.cookTime?max(0, ceil(24-this.cookTime*.12)):0
		c2.drawRect(-9, 28, w, 17, cookArrow.sub(0, 0, w/24, 1))
		const h = max(0, ceil((this._fuelTime/this._fuelCap||0)*14))
		c2.drawRect(-32, 29, 14, h, fuelIndicator.sub(0, 0, 1, h/14))
		drawInv(0, 0)
	}
	10(buf){
		this.cookTime = buf.byte()
		this._fuelTime = buf.short()
		const cap = buf.short()
		if(cap) this._fuelCap = cap
		if(!this.brightness&&this._fuelTime) this.brightness = 13, this.texture = furnaceLitTex, update(), redraw(this)
	}
	update(){
		if(this.cookTime) this.cookTime--
		if(this._fuelTime>-10){
			if(--this._fuelTime<=-10) this.brightness = 0, this.texture = furnaceTex, redraw(this)
			else return 0
		}
	}
	_fuelTime = 0; cookTime = 0; _fuelCap = 0
	set fuelTime(a){this._fuelTime=a;this._fuelCap=a}
	get fuelTime(){return this._fuelTime}
	input = null; fuel = null; output = null
	getItem(id, slot){return slot == 0 ? this.input : slot == 1 ? this.fuel : slot == 2 ? this.output : undefined}
	setItem(id, slot, item){
		if(slot == 0) this.input = item
		else if(slot == 1) this.fuel = item
		else if(slot == 2) this.output = item
	}
	slotClicked(id, slot, holding, player){
		if(slot == 1) return holding
		else if(slot < 2) return super.slotClicked(id, slot, holding, player)
		if(holding) return holding
		const o = this.output
		this.output = null
		return o
	}
	slotAltClicked(id, slot, holding, player){
		if(slot == 1) return holding
		else if(slot < 2) return super.slotAltClicked(id, slot, holding, player)
		if(holding || !this.output) return holding
		const o = this.output
		if(!--this.output.count) this.output = null
		return o.copy(1)
	}
	parsed(){
		if(this.fuelTime) return this.brightness = 13, this.texture = furnaceLitTex, 0
	}
}

Blocks.glowstone = class extends Blocks.glass{
	static breaktime = 0.45
	static brightness = 15
	static texture = BlockTexture(blocksPng, 9, 6)
}

import commandBlockTex from './command_blocks.png'
export const commandBlockTexs = [0,1,2,3,4,5].mmap(a => commandBlockTex.crop(a<<4,0,16,64))
const commandBlockNames = ['Impulse','Impulse (inversed)','Repeating','Repeating (needs redstone)','Callable','Callable (once per tick)']
const btnW = uiButtons.large.w
const btnH = uiButtons.large.h
Blocks.command_block = class extends Stone{
	type = 0
	commands = []
	static texture = 0
	static opacity = 0
	render(c, tint){
		const a = floor(t*2)&3
		const tex = commandBlockTexs[this.type]
		c.draw(tex.sub(0, a/4, 1, .25), tint)
		c.draw(tex.sub(0, (a+1&3)/4, 1, .25), tint.times((t*2)%1))
	}
	get particleTexture(){ return commandBlockTexs[this.type] }
	static breaktime = Infinity
	static tool = 'pick'
	static interactible = true
	drawInterface(id, c){
		return
		if(id != 0) return
		const buttonsY = -160
		c.textAlign = 'center'
		c.textBaseline = 'middle'
		const doneHit = uiButton(c, -100, buttonsY, 200, 20)
		c.image(doneHit ? uiButtons.largeSelected : uiButtons.large, -100, buttonsY)
		c.fillStyle = '#333'
		c.fillText('Done', 1, buttonsY + 9, 10)
		c.fillStyle = doneHit ? '#fff' : '#999'
		c.fillText('Done', 0, buttonsY + 10, 10)
		const typeHit = uiButton(c, -130, buttonsY, 20, 20)
		if(typeHit == 2) this.type = (this.type+1)%6, click()
		c.image(typeHit ? uiButtons.tinySelected : uiButtons.tiny, -130, buttonsY, 20, 20)
		c.push()
		c.translate(-126, buttonsY+4)
		c.scale(12, 12)
		this.render(c, vec4.one)
		c.peek()
		if(typeHit) renderGenericTooltip(c, [commandBlockNames[this.type]])
		c.pop()

		if(doneHit == 2){
			closeInterface()
			click()
		}

		c.textAlign = 'center'
		c.textBaseline = 'alphabetic'
		c.fillStyle = '#fff'
		c.fillText('Set console command for block', 0, 150, 10)

		c.textAlign = 'left'
		c.textBaseline = 'alphabetic'
		c.fillStyle = '#000'
		c.strokeStyle = '#a0a0a0'
		c.fillRect(-160, -120, 320, 240)
		c.lineWidth = 1
		c.strokeRect(-160, -120, 320, 240)
	}
}

export const barrierTex = BlockTexture(itemsPng, 5, 0)
globalThis.mode = () => mode
Blocks.barrier = class extends Block{
	static breaktime = Infinity
	static placeSounds = Stone.placeSounds
	get particleTexture(){ return mode == 1 ? barrierTex : -1 }
	static opacity = 0
	render(c){
		if(mode == 1 && me.inv[me.selected]?.constructor == Items.barrier) c.draw(toTex(barrierTex))
	}
	canTarget(c, itm){
		return mode == 1 && itm?.constructor == Items.barrier
	}
}

const torchTex = BlockTexture(blocksPng, 0, 5)
Blocks.torch = class extends Wood{
	static flags = BlockFlags.TARGETTABLE | BlockFlags.FRAGILE
	static opacity = 0
	static brightness = 14
	static tool; static breaktime = 0
	static blockShape = [7/16, 0, 9/16, 10/16]
	static texture = torchTex
}
Blocks.torch_left = class extends Blocks.torch{
	static blockShape = [0, 3/16, 5/16, 13/16]
	static texture = 0
	render(c, tint){
		c.drawMat(1, 0, 0.3, 1, -0.4375, 0.1875, toTex(torchTex), tint)
	}
}
Blocks.torch_right = class extends Blocks.torch{
	static blockShape = [11/16, 3/16, 1, 13/16]
	static texture = 0
	render(c, tint){
		c.drawMat(1, 0, -0.3, 1, 0.4375, 0.1875, toTex(torchTex), tint)
	}
}