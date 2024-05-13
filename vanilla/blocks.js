import { uiButtons, audioSet, lava, renderSlot, water, click, renderTooltip, renderGenericTooltip } from './effects.js'
import { sound, cam, world } from 'world'
import { Blocks, Block, Items, BlockTexture } from 'definitions'
import { BlockShape, blockShaped, fluidify } from './blockshapes.js'
import { closeInterface } from './index.js'
import { uiButton } from 'api'
const src = loader(import.meta)

export const terrainPng = Img(src`terrain.png`)
export const animatedPng = Img(src`animated.png`)

Blocks.air = class extends Block{
	static solid = false
	static replacable = true
	static translucency = 0
}
Blocks.grass = class extends Block{
	static dirt = true
	static texture = BlockTexture(terrainPng, 0, 0)
	static breaktime = 1.5
	static tool = 'shovel'
	static placeSounds = audioSet('grass/place', 4)
	static stepSounds = audioSet('grass/step', 6)
}
class Stone extends Block{
	static tool = 'pick'
	static texture = BlockTexture(terrainPng, 1, 0)
	static placeSounds = audioSet('stone/place', 4)
	static stepSounds = audioSet('stone/step', 6)
	static breaktime = 7.5
}
Blocks.stone = Stone
Blocks.cobblestone = class extends Stone{
	static texture = BlockTexture(terrainPng, 0, 1)
}
Blocks.obsidian = class extends Stone{
	static texture = BlockTexture(terrainPng, 5, 2)
	static breaktime = 250
}

Blocks.glowing_obsidian = class extends Blocks.obsidian{
	static breaktime = 500
	static texture = BlockTexture(terrainPng, 5, 4)
}
Blocks.dirt = class extends Block{
	static dirt = true
	static texture = BlockTexture(terrainPng, 2, 0)
	static breaktime = 1
	static tool = 'shovel'
	static placeSounds = audioSet('dirt/place', 4)
	static stepSounds = audioSet('dirt/step', 4)
}
Blocks.farmland = class extends Blocks.dirt{
	static texture = BlockTexture(terrainPng, 6, 2)
	static blockShape = [0, 0, 1, 0.9375]
}
Blocks.hydrated_farmland = class extends Blocks.dirt{
	static texture = BlockTexture(terrainPng, 7, 2)
	static blockShape = [0, 0, 1, 0.9375]
}
Blocks.bedrock = class extends Stone{
	static texture = BlockTexture(terrainPng, 1, 1)
	static breaktime = Infinity
	static tool = 'pick'
}
class Wood extends Block{
	static placeSounds = audioSet('wood/place', 4)
	static stepSounds = audioSet('wood/step', 6)
	static tool = 'axe'
	static breaktime = 5
}
Blocks.oak_log = class extends Wood{ static texture = BlockTexture(terrainPng, 0, 13) }
Blocks.birch_log = class extends Wood{ static texture = BlockTexture(terrainPng, 2, 13) }
Blocks.spruce_log = class extends Wood{ static texture = BlockTexture(terrainPng, 4, 13) }
Blocks.dark_oak_log = class extends Wood{ static texture = BlockTexture(terrainPng, 6, 13) }
Blocks.acacia_log = class extends Wood{ static texture = BlockTexture(terrainPng, 8, 13) }
Blocks.jungle_log = class extends Wood{ static texture = BlockTexture(terrainPng, 10, 13) }

class Planks extends Wood{
	static breaktime = 3
}
Blocks.oak_planks = class extends Planks{
	static texture = BlockTexture(terrainPng, 1, 13)
}
Blocks.birch_planks = class extends Planks{
	static texture = BlockTexture(terrainPng, 3, 13)
}
Blocks.spruce_planks = class extends Planks{
	static texture = BlockTexture(terrainPng, 5, 13)
}
Blocks.dark_oak_planks = class extends Planks{
	static texture = BlockTexture(terrainPng, 7, 13)
}
Blocks.acacia_planks = class extends Planks{
	static texture = BlockTexture(terrainPng, 9, 13)
}
Blocks.jungle_planks = class extends Planks{
	static texture = BlockTexture(terrainPng, 11, 13)
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
	static texture = BlockTexture(terrainPng, 2, 1)
	static breaktime = 1
	static placeSounds = audioSet('sand/place', 4)
	static stepSounds = audioSet('sand/step', 5)
}
Blocks.glass = class extends Block{
	static breaktime = 0.6
	static texture = BlockTexture(terrainPng, 1, 3)
	static placeSounds = Blocks.stone.placeSounds
	static stepSounds = Blocks.stone.stepSounds
}

const bucketSounds = {
	fillLava: audioSet('bucket/fill_lava', 3),
	emptyLava: audioSet('bucket/empty_lava', 3),
	fillWater: audioSet('bucket/fill_water', 3),
	emptyWater: audioSet('bucket/empty_water', 3)
}

class Water extends Block{
	static solid = false
	static replacable = true
	static climbable = true
	static viscosity = 0.15
	random(x, y){
		if(this.flows){
			const r = random()
			if(r < .05)
				sound(water.ambient[0], x, y, 1, 1)
			else if(r < .1)
				sound(water.ambient[1], x, y, 1, 1)
		}
	}
	32(buf, x, y){ sound(fireExtinguish, x, y, 0.7, random()*.8+1.2) }
	33(buf, x, y){ sound(bucketSounds.emptyWater, x, y) }
	34(buf, x, y){ sound(bucketSounds.fillWater, x, y) }
}
void({
	filled: Blocks.water,
	top: Blocks.waterTop,
	flowing: Blocks.waterFlowing,
	levels: [, Blocks.waterFlowing1, Blocks.waterFlowing2, Blocks.waterFlowing3, Blocks.waterFlowing4, Blocks.waterFlowing5, Blocks.waterFlowing6, Blocks.waterFlowing7]
} = fluidify(Water, 'water', BlockTexture(animatedPng, 2, 0, 32), BlockTexture(animatedPng, 5, 0, 64)))

class Lava extends Block{
	static solid = false
	static replacable = true
	static climbable = true
	static viscosity = 0.5
	random(x, y){
		const r = random()
		if(r < .015)
			sound(lava.ambient, x, y, 1, 1)
		else if(r < .25)
			sound(lava.pop, x, y, 1, 1)
	}
	32(buf, x, y){ sound(fireExtinguish, x, y, 0.7, random()*.8+1.2) }
	33(buf, x, y){ sound(bucketSounds.emptyLava, x, y) }
	34(buf, x, y){ sound(bucketSounds.fillLava, x, y) }
}
void({
	filled: Blocks.lava,
	top: Blocks.lavaTop,
	flowing: Blocks.lavaFlowing,
	levels: [, Blocks.lavaFlowing1, Blocks.lavaFlowing2, Blocks.lavaFlowing3, Blocks.lavaFlowing4, Blocks.lavaFlowing5, Blocks.lavaFlowing6, Blocks.lavaFlowing7]
} = fluidify(Lava, 'lava', BlockTexture(animatedPng, 3, 0, 38), BlockTexture(animatedPng, 4, 0, 32)))

Blocks.sandstone = class extends Stone{
	static texture = BlockTexture(terrainPng, 1, 11)
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
	static texture = BlockTexture(terrainPng, 2, 4)
	static breaktime = 0.75
}
Blocks.snowy_grass = class extends Blocks.grass{
	static texture = BlockTexture(terrainPng, 4, 4)
}
Blocks.coal_ore = class extends Stone{ static texture = BlockTexture(terrainPng, 2, 2) }
Blocks.iron_ore = class extends Stone{ static texture = BlockTexture(terrainPng, 1, 2) }
Blocks.netherrack = class extends Block{
	static breaktime = 2
	static texture = BlockTexture(terrainPng, 7, 6)
	static tool = 'pick'
	static placeSounds = audioSet('netherrack/place', 6)
	static stepSounds = audioSet('netherrack/step', 6)
}
Blocks.quartz_ore = class extends Blocks.netherrack{
	static texture = BlockTexture(terrainPng, 6, 6)
}

Blocks.tnt = class extends Block{
	static breaktime = 0
	static texture = BlockTexture(terrainPng, 8, 0)
	static stepSounds = Blocks.grass.placeSounds
	static placeSounds = Blocks.grass.placeSounds
}

Blocks.endstone = class extends Block{
	static breaktime = 15
	static texture = BlockTexture(terrainPng, 7, 4)
	static tool = 'pick'
	static placeSounds = Blocks.stone.placeSounds
	static stepSounds = Blocks.stone.stepSounds
}
export const chestTop = terrainPng.crop(9*16, 3*16, 16, 16)
const chestOpen = Audio(src`sound/containers/open_chest.mp3`), chestClose = Audio(src`sound/containers/close_chest.mp3`)
const containerInterface = Img(src`container.png`)
Blocks.chest = class extends Block{
	static blockShape = [1/16, 0, 15/16, 7/8]
	static texture = BlockTexture(terrainPng, 10, 3)
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
		if(id == 0){
			c.image(containerInterface, -88, 0)
			c.push()
			c.translate(-72, 46)
			c.scale(16, 16)
			for(let i = 0; i < 27; i++){
				renderSlot(c, this, i)
				if(i%9==8) c.translate(-9, -1.125)
				else c.translate(1.125, 0)
			}
			c.pop()
			c.textAlign = 'left'
			c.textBaseline = 'alphabetic'
			c.fillStyle = '#505050'
			c.fillText(this.name||Items.chest.defaultName, -80, 65, 10)
			drawInv(0, 0)
			c.textAlign = 'left'
			c.textBaseline = 'alphabetic'
			c.fillStyle = '#505050'
			c.fillText('Inventory', -80, -1, 10)
		}
	}
	name = ''
	state = 0
	opening = 0
	1(buf, x, y){
		const old = this.state
		this.state = buf.byte()
		if((this.state^old)&2){
			this.opening = 1
			sound(this.state&2 ? chestOpen : chestClose, x, y, 0.5, 1 - random()*.1)
		}
	}
	render(c){
		if(this.state&1) c.box(1, 0, -1, 1)
		this.opening = max(this.opening - dt*3, 0)
		const rot = (1-0.5**((this.state & 2 ? 1 - this.opening : this.opening)*4))*16/15
		c.translate(0.0625, 0.625)
		c.rotate(rot*PI/2)
		c.drawRect(-0.0625, -0.625, 1, 1, chestTop)
	}
	static tool = 'axe'
}

class Wool extends Block{
	static tool = 'shears'
	static breaktime = 1.2
	static stepSounds = audioSet('wool/place', 4)
	static placeSounds = this.stepSounds
}

Blocks.white_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 0, 14) }
Blocks.light_grey_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 1, 14) }
Blocks.grey_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 2, 14) }
Blocks.black_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 3, 14) }
Blocks.red_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 4, 14) }
Blocks.orange_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 5, 14) }
Blocks.yellow_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 6, 14) }
Blocks.lime_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 7, 14) }
Blocks.green_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 8, 14) }
Blocks.cyan_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 9, 14) }
Blocks.light_blue_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 10, 14) }
Blocks.blue_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 11, 14) }
Blocks.purple_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 12, 14) }
Blocks.magenta_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 13, 14) }
Blocks.pink_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 14, 14) }
Blocks.brown_wool = class extends Wool{ static texture = BlockTexture(terrainPng, 15, 14) }

Blocks.dragon_egg = class extends Block{
	static texture = BlockTexture(terrainPng, 15, 0)
}

Blocks.ice = class Ice extends Block{}
Blocks.packed_ice = class extends Blocks.ice{}


class MineralBlock extends Block{}
Blocks.lapis_block = MineralBlock
Blocks.coal_block = MineralBlock
Blocks.iron_block = MineralBlock
Blocks.gold_block = MineralBlock
Blocks.emerald_block = MineralBlock
Blocks.diamond_block = MineralBlock

const fireAmbient = Audio(src`sound/fire/ambient.mp3`), portalAmbient = Audio(src`sound/portal/ambient.mp3`)
const fireExtinguish = Audio(src`sound/fire/extinguish.mp3`)

Blocks.fire = class extends Block{
	static solid = false
	static replacable = true
	static texture = BlockTexture(animatedPng, 1, 0, 32)
	static placeSounds = [Audio(src`sound/fire/ignite.mp3`)]
	random(x, y){
		sound(fireAmbient, x, y, random() + 1, random() * 0.7 + 0.3)
	}
	destroyed(x, y){
		sound(fireExtinguish, x, y, 0.5, random() * 1.6 + 1.8)
	}
}

Blocks.portal = class extends Block{
	static solid = false
	static blockShape = [0.375, 0, 0.625, 1]
	static texture = BlockTexture(animatedPng, 0, 0, 32)
	random(x, y){
		sound(portalAmbient, x, y, 0.5, random() * 0.4 + 0.8)
	}
}
const endPortalOverlay = Img(src`endportaloverlay.png`)
const endShader = Shader(`
#define PI 3.1415927
#define ROT_MAT(rot) mat2(cos(rot),-sin(rot),-sin(rot),-cos(rot))
#define MULTIPLY(pos, mat, off) vec3(mod(pos*mat+vec2(0,uni0/100.),vec2(.25,1.))+vec2(off,0),0)
void main(){
	const mat2 PITHIRD = ROT_MAT(PI/3.);
	const mat2 PIHALF = ROT_MAT(PI/2.);
	const mat2 PINQUARTER = ROT_MAT(PI/-4.);
	const mat2 PIONE = ROT_MAT(PI);
	vec2 pos = xy*uni1/1000.;
	color = getCol(arg0, MULTIPLY(pos,PITHIRD,0.));
	color += getCol(arg0, MULTIPLY(pos,PIHALF,.25))*.9;
	color += getCol(arg0, MULTIPLY(pos,PINQUARTER,.5))*.5;
	color += getCol(arg0, MULTIPLY(pos,PIONE,.75))*.4;
}`, TEXTURE, [FLOAT, VEC2])
let endShaderT = -1
Blocks.end_portal = class extends Block{
	static solid = false
	static blockShape = [0, 0, 1, 0.75]
	static softness = 1
	static texture = BlockTexture(terrainPng, 14, 0)
	render(c){
		if(endShaderT != (endShaderT=t)) endShader.uniforms(t, vec2(c.width, c.height))
		c.shader = endShader
		c.drawRect(0, 0, 1, 0.75, endPortalOverlay)
		c.shader = null
	}
}

Blocks.end_portal_frame = class extends Block{
	static texture = BlockTexture(terrainPng, 9, 0)
	static breaktime = Infinity
	static placeSounds = Blocks.stone.placeSounds
	static blockShape = [0, 0, 1, 13/16]
}
Blocks.filled_end_portal_frame = class extends Blocks.end_portal_frame{
	static texture = BlockTexture(terrainPng, 10, 0)
	static placeSounds = audioSet('portal/eye', 3)
}

Blocks.sugar_cane = class extends Block{
	static breaktime = 0
	static solid = false
	static targettable = true
	static placeSounds = Blocks.grass.placeSounds
	static texture = terrainPng.crop(144,64,16,16)
}
Blocks.pumpkin_leaf = class extends Block{
	
}
Blocks.pumpkin_leaf1 = class extends Blocks.pumpkin_leaf{ }
Blocks.pumpkin_leaf2 = class extends Blocks.pumpkin_leaf{ }
Blocks.pumpkin_leaf3 = class extends Blocks.pumpkin_leaf{ }

class Sapling extends Block{
	static solid = false
	static targettable = true
	static placeSounds = Blocks.grass.placeSounds
}

Blocks.oak_sapling = class extends Sapling{
	static texture = BlockTexture(terrainPng, 14, 2)
}

Blocks.birch_sapling = class extends Sapling{
	static texture = BlockTexture(terrainPng, 15, 4)
}

Blocks.spruce_sapling = class extends Sapling{
	static texture = BlockTexture(terrainPng, 15, 3)
}

Blocks.dark_oak_sapling = class extends Sapling{
	static texture = BlockTexture(terrainPng, 14, 4)
}

Blocks.acacia_sapling = class extends Sapling{
	static texture = BlockTexture(terrainPng, 14, 3)
}

Blocks.jungle_sapling = class extends Sapling{
	static texture = BlockTexture(terrainPng, 15, 2)
}

class Leaves extends Block{
	static placeSounds = Blocks.grass.placeSounds
	static stepSounds = Blocks.grass.stepSounds
}

Blocks.oak_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 0, 12)
}
Blocks.birch_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 2, 12)
}
Blocks.spruce_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 2, 12)
}
Blocks.dark_oak_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 0, 12)
}
Blocks.acacia_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 0, 12)
}
Blocks.jungle_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 4, 12)
}

Blocks.oak_log_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 5, 12)
}
Blocks.birch_log_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 6, 12)
}
Blocks.spruce_log_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 7, 12)
}
Blocks.dark_oak_log_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 8, 12)
}
Blocks.acacia_log_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 9, 12)
}
Blocks.jungle_log_leaves = class extends Leaves{
	static texture = BlockTexture(terrainPng, 10, 12)
}
Blocks.crafting_table = class extends Planks{
	static texture = BlockTexture(terrainPng, 12, 3)
	static interactible = true
}
const litFurnaceTex = BlockTexture(terrainPng, 13, 3)
const furnaceInterface = Img(src`furnace.png`)
const furnaceUI = furnaceInterface.crop(0, 0, 176, 80), cookArrow = furnaceInterface.crop(176, 14, 24, 17), fuelIndicator = furnaceInterface.crop(176, 0, 15, 14)
Blocks.furnace = class extends Stone{
	static texture = BlockTexture(terrainPng, 12, 2)
	static interactible = true
	render(c){ if(this.fuelTime>t) c.draw(toTex(litFurnaceTex)) }
	drawInterface(id, c, drawInv){
		if(id == 0){
			c.push()
			c.image(furnaceUI, -88, 0)
			c.translate(-24, 11)
			c.scale(16, 16)
			renderSlot(c, this, 1, 0)
			c.translate(0, 2.25)
			renderSlot(c, this, 0, 0)
			c.translate(3.75, -1.125)
			renderSlot(c, this, 2, 0)
			c.peek()
			const w = max(0, ceil(24-(t>=this.cookTime?10:this.cookTime-t)/10*24))
			c.image(cookArrow, -9, 28, w, 17, 0, 0, w, 17)
			const h = max(0, ceil(((this.fuelTime-t)/this._fuelCap||0)*15))
			c.image(fuelIndicator, -32, 29, 14, h, 0, 15-h, 14, h)
			c.pop()
			drawInv(0, 0)
		}
	}
	10(buf){
		this._cookTime = t+buf.byte()/world.tps
		const time = buf.short(), cap = buf.short()/world.tps
		this._fuelTime = t+time/world.tps
		if(cap) this._fuelCap = cap
	}
	_fuelTime = 0; _cookTime = 0; _fuelCap = 0
	set fuelTime(a){this._fuelTime = t+(this._fuelCap = a/world.tps)}
	get fuelTime(){return this._fuelTime}
	set cookTime(a){this._cookTime = t+a/world.tps}
	get cookTime(){return this._cookTime}
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
		return new o.constructor(1)
	}
}
const commandBlockTex = Img(src`command_blocks.png`)
export const commandBlockTexs = [0,1,2,3,4,5].mmap(a => commandBlockTex.crop(a<<4,0,16,64))
const commandBlockNames = ['Impulse','Impulse (inversed)','Repeating','Repeating (needs redstone)','Callable','Callable (once per tick)']
Blocks.command_block = class extends Stone{
	type = 0
	commands = []
	render(c){
		const a = floor(t*2)&3
		const tex = commandBlockTexs[this.type]
		c.draw(tex.sub(0, a/4, 1, .25))
		c.draw(tex.sub(0, (a+1&3)/4, 1, .25), vec4(1-(t*2)%1))
	}
	get particleTexture(){ return commandBlockTexs[this.type] }
	static breaktime = Infinity
	static tool = 'pick'
	static interactible = true
	drawInterface(id, c){
		if(id == 0){
			const buttonsY = -160
			const btnW = uiButtons.large.w
			const btnH = uiButtons.large.h
			const halfBtnW = btnW / 2
			const halfBtnH = btnH / 2
			c.textAlign = 'center'
			c.textBaseline = 'middle'
			const doneHit = uiButton(c, -halfBtnW, buttonsY, btnW, btnH)
			c.image(doneHit ? uiButtons.largeSelected : uiButtons.large, -halfBtnW, buttonsY)
			c.fillStyle = '#333'
			c.fillText('Done', 1, buttonsY + halfBtnH - 1, 10)
			c.fillStyle = doneHit ? '#fff' : '#999'
			c.fillText('Done', 0, buttonsY + halfBtnH, 10)
			const typeHit = uiButton(c, -halfBtnW - btnH*1.5, buttonsY, btnH, btnH)
			if(typeHit == 2) this.type = (this.type+1)%6, click()
			c.image(typeHit ? uiButtons.tinySelected : uiButtons.tiny, -halfBtnW - btnH*1.5, buttonsY, btnH, btnH)
			c.push()
			c.translate(-halfBtnW - btnH*1.5+4, buttonsY+4)
			c.scale(12, 12)
			this.render(c)
			c.peek()
			if(typeHit) renderGenericTooltip(c, [commandBlockNames[this.type]], [15])
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
}