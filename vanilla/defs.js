import { audioSet, lava, water } from './effects.js'
import { sound, cam } from 'world'
import { Blocks, Items, Block, Item, Particle } from 'definitions'
import { BlockShape, blockShaped, itemify, slabifyItem } from './blockshapes.js'

const {Audio, Texture} = loader(import.meta)

export const terrainPng = Texture("terrain.png")
export const itemsPng = Texture("items.png")
export const particlePng = Texture("particles.png")
export const animatedPng = Texture("animated.png")
export const explode = [1,2,3,4].mmap(a => Audio(`sound/misc/explode${a}.mp3`))
export const hurt = [1,2,3].mmap(a => Audio(`sound/misc/hurt${a}.mp3`))

Blocks.air = class extends Block{ static solid = false; static replacable = true }
Blocks.grass = class extends Block{
	static texture = terrainPng.at(0, 0)
	static breaktime = 1.5
	static tool = 'shovel'
	static placeSounds = audioSet('grass/place', 4)
	static stepSounds = audioSet('grass/step', 6)
}
class Stone extends Block{
	static tool = 'pick'
	static texture = terrainPng.at(1, 0)
	static placeSounds = audioSet('stone/place', 4)
	static stepSounds = audioSet('stone/step', 6)
	static breaktime = 7.5
}
Blocks.stone = Stone
Blocks.obsidian = class extends Stone{
	static texture = terrainPng.at(5, 2)
	static breaktime = 250
}

Blocks.glowing_obsidian = class extends Blocks.obsidian{
	static breaktime = 500
	static texture = terrainPng.at(5, 4)
}
Blocks.dirt = class extends Block{
	static texture = terrainPng.at(2, 0)
	static breaktime = 1
	static tool = 'shovel'
	static placeSounds = audioSet('dirt/place', 4)
	static stepSounds = audioSet('dirt/step', 4)
}
Blocks.farmland = class extends Blocks.dirt{
	static blockShape = [0, 0, 1, 0.9375]
}
Blocks.hydrated_farmland = class extends Blocks.dirt{
	static blockShape = [0, 0, 1, 0.9375]
}
Blocks.bedrock = class extends Stone{
	static texture = terrainPng.at(1, 1)
	static breaktime = Infinity
	static tool = 'pick'
}
class Wood extends Block{
	static placeSounds = audioSet('wood/place', 4)
	static stepSounds = audioSet('wood/step', 6)
	static tool = 'axe'
	static breaktime = 5
}
Blocks.oak_log = class extends Wood{ static texture = terrainPng.at(0, 13) }
Blocks.birch_log = class extends Wood{ static texture = terrainPng.at(2, 13) }
Blocks.spruce_log = class extends Wood{ static texture = terrainPng.at(4, 13) }
Blocks.dark_oak_log = class extends Wood{ static texture = terrainPng.at(6, 13) }
Blocks.acacia_log = class extends Wood{ static texture = terrainPng.at(8, 13) }
Blocks.jungle_log = class extends Wood{ static texture = terrainPng.at(10, 13) }

class Planks extends Wood{
	static breaktime = 3
}
Blocks.oak_planks = class extends Planks{
	static texture = terrainPng.at(1, 13)
}
Blocks.birch_planks = class extends Planks{
	static texture = terrainPng.at(3, 13)
}
Blocks.spruce_planks = class extends Planks{
	static texture = terrainPng.at(5, 13)
}
Blocks.dark_oak_planks = class extends Planks{
	static texture = terrainPng.at(7, 13)
}
Blocks.acacia_planks = class extends Planks{
	static texture = terrainPng.at(9, 13)
}
Blocks.jungle_planks = class extends Planks{
	static texture = terrainPng.at(11, 13)
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
	static texture = terrainPng.at(2, 1)
	static breaktime = 1
	static placeSounds = audioSet('sand/place', 4)
	static stepSounds = audioSet('sand/step', 5)
}
Blocks.glass = class extends Block{
	static breaktime = 0.6
	static texture = terrainPng.at(1, 3)
	static placeSounds = Blocks.stone.placeSounds
	static stepSounds = Blocks.stone.stepSounds
}
Blocks.water = class extends Block{
	static texture = animatedPng.at(2, 0, 32)
	static solid = false
	static replacable = true
	static climbable = true
	static gooeyness = 0.15
	random(x, y){
		const r = random()
		if(r < .025)
			sound(water.ambient[0], x, y, 1, 1)
		else if(r < .05)
			sound(water.ambient[1], x, y, 1, 1)
	}
}
Blocks.lava = class extends Blocks.water{
	static texture = animatedPng.at(3, 0, 38)
	static gooeyness = 0.5
	random(x, y){
		const r = random()
		if(r < .015)
			sound(lava.ambient, x, y, 1, 1)
		else if(r < .25)
			sound(lava.pop, x, y, 1, 1)
	}
}
Blocks.sandstone = class extends Stone{
	static texture = terrainPng.at(1, 11)
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
	static texture = terrainPng.at(2, 4)
	static breaktime = 0.75
}
Blocks.snowy_grass = class extends Blocks.grass{
	static texture = terrainPng.at(4, 4)
}
Blocks.coal_ore = class extends Stone{ static texture = terrainPng.at(2, 2) }
Blocks.iron_ore = class extends Stone{ static texture = terrainPng.at(1, 2) }
Blocks.netherrack = class extends Block{
	static breaktime = 2
	static texture = terrainPng.at(7, 6)
	static tool = 'pick'
	static placeSounds = audioSet('netherrack/place', 6)
	static stepSounds = audioSet('netherrack/step', 6)
}
Blocks.quartz_ore = class extends Blocks.netherrack{
	static texture = terrainPng.at(6, 6)
}

Blocks.tnt = class extends Block{
	static breaktime = 0
	static texture = terrainPng.at(8, 0)
	static stepSounds = Blocks.grass.placeSounds
	static placeSounds = Blocks.grass.placeSounds
}

Blocks.endstone = class extends Block{
	static breaktime = 15
	static texture = terrainPng.at(7, 4)
	static tool = 'pick'
	static placeSounds = Blocks.stone.placeSounds
	static stepSounds = Blocks.stone.stepSounds
}

Blocks.chest = class extends Block{}

class Wool extends Block{
	static tool = 'shears'
	static breaktime = 1.2
	static stepSounds = audioSet('wool/place', 4)
	static placeSounds = this.stepSounds
}

Blocks.white_wool = class extends Wool{ static texture = terrainPng.at(0, 14) }
Blocks.light_grey_wool = class extends Wool{ static texture = terrainPng.at(1, 14) }
Blocks.grey_wool = class extends Wool{ static texture = terrainPng.at(2, 14) }
Blocks.black_wool = class extends Wool{ static texture = terrainPng.at(3, 14) }
Blocks.red_wool = class extends Wool{ static texture = terrainPng.at(4, 14) }
Blocks.orange_wool = class extends Wool{ static texture = terrainPng.at(5, 14) }
Blocks.yellow_wool = class extends Wool{ static texture = terrainPng.at(6, 14) }
Blocks.lime_wool = class extends Wool{ static texture = terrainPng.at(7, 14) }
Blocks.green_wool = class extends Wool{ static texture = terrainPng.at(8, 14) }
Blocks.cyan_wool = class extends Wool{ static texture = terrainPng.at(9, 14) }
Blocks.light_blue_wool = class extends Wool{ static texture = terrainPng.at(10, 14) }
Blocks.blue_wool = class extends Wool{ static texture = terrainPng.at(11, 14) }
Blocks.purple_wool = class extends Wool{ static texture = terrainPng.at(12, 14) }
Blocks.magenta_wool = class extends Wool{ static texture = terrainPng.at(13, 14) }
Blocks.pink_wool = class extends Wool{ static texture = terrainPng.at(14, 14) }
Blocks.brown_wool = class extends Wool{ static texture = terrainPng.at(15, 14) }

Items.white_wool = itemify(Blocks.white_wool)
Items.light_grey_wool = itemify(Blocks.light_grey_wool)
Items.grey_wool = itemify(Blocks.grey_wool)
Items.black_wool = itemify(Blocks.black_wool)
Items.red_wool = itemify(Blocks.red_wool)
Items.orange_wool = itemify(Blocks.orange_wool)
Items.yellow_wool = itemify(Blocks.yellow_wool)
Items.lime_wool = itemify(Blocks.lime_wool)
Items.green_wool = itemify(Blocks.green_wool)
Items.cyan_wool = itemify(Blocks.cyan_wool)
Items.light_blue_wool = itemify(Blocks.light_blue_wool)
Items.blue_wool = itemify(Blocks.blue_wool)
Items.purple_wool = itemify(Blocks.purple_wool)
Items.magenta_wool = itemify(Blocks.magenta_wool)
Items.pink_wool = itemify(Blocks.pink_wool)
Items.brown_wool = itemify(Blocks.brown_wool)

Blocks.dragon_egg = class extends Block{
	static texture = terrainPng.at(15, 0)
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

const fireAmbient = Audio('sound/fire/ambient.mp3'), portalAmbient = Audio('sound/portal/ambient.mp3')

Blocks.fire = class extends Block{
	static solid = false
	static replacable = true
	static texture = animatedPng.at(1, 0, 32)
	static placeSounds = [Audio('sound/fire/ignite.mp3')]
	random(x, y){
		sound(fireAmbient, x, y, random() + 1, random() * 0.7 + 0.3)
	}
}

Blocks.portal = class extends Block{
	static solid = false
	static texture = animatedPng.at(0, 0, 32)
	random(x, y){
		sound(portalAmbient, x, y, 0.5, random() * 0.4 + 0.8)
	}
}
const epo = Texture('endportaloverlay.png')
const endPortalOverlays = [
	epo.crop(0,0,64,256),
	epo.crop(64,0,64,256),
	epo.crop(128,0,64,256),
	epo.crop(192,0,64,256)
]
function rot_off_transform(p, rot, off, x, y){
	const a = cos(rot) / 16, b = sin(rot) / 16
	p.setPatternTransform(a, b, -b, a, b*off-x, -a*off-y)
}
Blocks.end_portal = class extends Block{
	static solid = false
	static blockShape = [0, 0, 1, 0.75]
	static softness = 1
	static texture = terrainPng.at(14, 0)
	render(c, x, y){
		x -= cam.x; y -= cam.y
		c.globalCompositeOperation = 'lighter'
		rot_off_transform(endPortalOverlays[0], PI/3, t, x, y)
		c.fillPattern(endPortalOverlays[0])
		c.fillRect(0,0,1,0.75)
		c.globalAlpha = 0.9
		rot_off_transform(endPortalOverlays[1], PI/2, t, x, y)
		c.fillPattern(endPortalOverlays[1])
		c.fillRect(0,0,1,0.75)
		c.globalAlpha = 0.5
		rot_off_transform(endPortalOverlays[2], -PI/4, t, x, y)
		c.fillPattern(endPortalOverlays[2])
		c.fillRect(0,0,1,0.75)
		c.globalAlpha = 0.4
		rot_off_transform(endPortalOverlays[3], PI, t, x, y)
		c.fillPattern(endPortalOverlays[3])
		c.fillRect(0,0,1,0.75)
		c.globalAlpha = 1
		c.globalCompositeOperation = 'source-over'
	}
}

Blocks.end_portal_frame = class extends Block{
	static texture = terrainPng.at(9, 0)
	static breaktime = Infinity
	static placeSounds = Blocks.stone.placeSounds
	static blockShape = [0, 0, 1, 13/16]
}
Blocks.filled_end_portal_frame = class extends Blocks.end_portal_frame{
	static texture = terrainPng.at(10, 0)
	static placeSounds = audioSet('portal/eye', 3)
}

Blocks.sugar_cane = class extends Block{
	static breaktime = 0
	static blockShape = []
	static placeSounds = Blocks.grass.placeSounds
	static texture = terrainPng.crop(144,64,16,16)
}
Blocks.pumpkin_leaf = class extends Block{
	
}
Blocks.pumpkin_leaf1 = class extends Blocks.pumpkin_leaf{ }
Blocks.pumpkin_leaf2 = class extends Blocks.pumpkin_leaf{ }
Blocks.pumpkin_leaf3 = class extends Blocks.pumpkin_leaf{ }

Items.sand = class extends Item{
	places(){ return Blocks.sand }
	static texture = Blocks.sand.texture
}

Items.oak_log = class extends Item{
	places(){ return Blocks.oak_log }
	static texture = Blocks.oak_log.texture
}
Items.birch_log = class extends Item{
	places(){ return Blocks.birch_log }
	static texture = Blocks.birch_log.texture
}
Items.spruce_log = class extends Item{
	places(){ return Blocks.spruce_log }
	static texture = Blocks.spruce_log.texture
}
Items.dark_oak_log = class extends Item{
	places(){ return Blocks.dark_oak_log }
	static texture = Blocks.dark_oak_log.texture
}
Items.acacia_log = class extends Item{
	places(){ return Blocks.acacia_log }
	static texture = Blocks.acacia_log.texture
}
Items.jungle_log = class extends Item{
	places(){ return Blocks.jungle_log }
	static texture = Blocks.jungle_log.texture
}

Items.oak_planks = class extends Item{
	places(){ return Blocks.oak_planks }
	static texture = Blocks.oak_planks.texture
}
Items.birch_planks = class extends Item{
	places(){ return Blocks.birch_planks }
	static texture = Blocks.birch_planks.texture
}
Items.spruce_planks = class extends Item{
	places(){ return Blocks.spruce_planks }
	static texture = Blocks.spruce_planks.texture
}
Items.dark_oak_planks = class extends Item{
	places(){ return Blocks.dark_oak_planks }
	static texture = Blocks.dark_oak_planks.texture
}
Items.acacia_planks = class extends Item{
	places(){ return Blocks.acacia_planks }
	static texture = Blocks.acacia_planks.texture
}
Items.jungle_planks = class extends Item{
	places(){ return Blocks.jungle_planks }
	static texture = Blocks.jungle_planks.texture
}

Items.oak_planks_slab = slabifyItem(Items.oak_planks, Blocks.oak_planks)
Items.birch_planks_slab = slabifyItem(Items.birch_planks, Blocks.birch_planks)
Items.spruce_planks_slab = slabifyItem(Items.spruce_planks, Blocks.spruce_planks)
Items.dark_oak_planks_slab = slabifyItem(Items.dark_oak_planks, Blocks.dark_oak_planks)
Items.acacia_planks_slab = slabifyItem(Items.acacia_planks, Blocks.acacia_planks)
Items.jungle_planks_slab = slabifyItem(Items.jungle_planks, Blocks.jungle_planks)

Items.sandstone = class extends Item{
	places(){ return Blocks.sandstone }
	static texture = Blocks.sandstone.texture
}
Items.stone = class extends Item{
	places(){ return Blocks.stone }
	static texture = Blocks.stone.texture
}
Items.glass = class extends Item{
	places(){ return Blocks.glass }
	static texture = terrainPng.at(1, 3)
}
Items.bedrock = class extends Item{
	places(){ return Blocks.bedrock }
	static texture = Blocks.bedrock.texture
}
Items.obsidian = class extends Item{
	places(){ return Blocks.obsidian }
	static texture = Blocks.obsidian.texture
}
Items.glowing_obsidian = class extends Items.obsidian{
	places(){ return Blocks.glowing_obsidian }
	static texture = Blocks.glowing_obsidian.texture
}
Items.netherrack = class extends Item{
	places(){ return Blocks.netherrack }
	static texture = Blocks.netherrack.texture
}
Items.grass = class extends Item{
	places(){ return Blocks.grass }
	static texture = Blocks.grass.texture
}
Items.dirt = class extends Item{
	places(){ return Blocks.dirt }
	static texture = Blocks.dirt.texture
}
Items.sugar_cane = class extends Item{
	places(){ return Blocks.sugar_cane }
	static texture = itemsPng.crop(16,256,16,16)
}

class Tool extends Item{
	static maxStack = 1
	static model = 1
	static for = ''
	static speed = 10
	breaktime(block){
		return block.tool == this.for ? block.breaktime / this.speed : block.breaktime
	}
}

Items.diamond_pickaxe = class extends Tool{
	static for = 'pick'
	static speed = 25
	static texture = itemsPng.at(2, 8)
}

Items.diamond_shovel = class extends Tool{
	static for = 'shovel'
	static speed = 25
	static texture = itemsPng.at(3, 8)
}

Items.diamond_axe = class extends Tool{
	static for = 'axe'
	static speed = 25
	static texture = itemsPng.at(14, 7)
}

Items.flint_and_steel = class extends Tool{
	static model = 2
	static texture = itemsPng.at(17, 10)
}

Items.tnt = class extends Item{
	static texture = Blocks.tnt.texture
	places(){ return Blocks.tnt }
}

Items.end_crystal = class extends Item{
	static texture = itemsPng.at(0,10)
}
class Mineral extends Item{}

Items.lapis = Mineral
Items.coal = Mineral
Items.iron = Mineral
Items.gold = Mineral
Items.emerald = Mineral
Items.diamond = Mineral

Items.cut_sandstone = class extends Items.sandstone{}
Items.smooth_sandstone = class extends Items.sandstone{}
Items.chiseled_sandstone = class extends Items.sandstone{}
Items.red_sandstone = class extends Items.sandstone{}
Items.cut_red_sandstone = class extends Items.sandstone{}
Items.chiseled_red_sandstone = class extends Items.sandstone{}
Items.smooth_red_sandstone = class extends Items.sandstone{}

Items.end_portal_frame = class extends Item{
	static texture = terrainPng.at(9, 0)
	places(){ return Blocks.end_portal_frame }
}

Items.eye_of_ender = class extends Item{
	static texture = itemsPng.at(1, 10)
}

Items.endstone = class extends Item{
	static texture = terrainPng.at(7, 4)
	places(){ return Blocks.endstone }
}

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