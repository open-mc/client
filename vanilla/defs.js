import { audioSet, lava, water } from './effects.js'
import { sound, cam } from 'world'
import { Blocks, Items, Block, Item, Particle } from 'definitions'
import { slabify, upperslabify } from './blockshapes.js'

const {Audio, Texture} = loader(import.meta)

export const terrainPng = Texture("terrain.png")
export const itemsPng = Texture("items.png")
export const particlePng = Texture("particles.png")
export const explode = [1,2,3,4].mutmap(a => Audio(`sound/misc/explode${a}.mp3`))
export const hurt = [1,2,3].mutmap(a => Audio(`sound/misc/hurt${a}.mp3`))

Blocks.air = class extends Block{ static solid = false }
Blocks.grass = class extends Block{
	static texture = terrainPng.at(3, 0)
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
Blocks.oak_log = class extends Wood{
	static texture = terrainPng.at(4, 1)
}
class Planks extends Wood{
	static breaktime = 3
}
Blocks.oak_planks = class extends Planks{
	static texture = terrainPng.at(4, 0)
}
Blocks.birch_planks = class extends Planks{}
Blocks.spruce_planks = class extends Planks{}
Blocks.dark_oak_planks = class extends Planks{}
Blocks.acacia_planks = class extends Planks{}
Blocks.jungle_planks = class extends Planks{}

Blocks.oak_planks_slab = slabify(Blocks.oak_planks)
Blocks.oak_planks_upper_slab = upperslabify(Blocks.oak_planks)

Blocks.birch_planks_slab = slabify(Blocks.birch_planks)
Blocks.birch_planks_upper_slab = upperslabify(Blocks.birch_planks)

Blocks.spruce_planks_slab = slabify(Blocks.spruce_planks)
Blocks.spruce_planks_upper_slab = upperslabify(Blocks.spruce_planks)

Blocks.dark_oak_planks_slab = slabify(Blocks.dark_oak_planks)
Blocks.dark_oak_planks_upper_slab = upperslabify(Blocks.dark_oak_planks)

Blocks.acacia_planks_slab = slabify(Blocks.acacia_planks)
Blocks.acacia_planks_upper_slab = upperslabify(Blocks.acacia_planks)

Blocks.jungle_planks_slab = slabify(Blocks.jungle_planks)
Blocks.jungle_planks_upper_slab = upperslabify(Blocks.jungle_planks)

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
	static texture = terrainPng.at(13, 13)
	static solid = false
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
	static texture = terrainPng.at(13, 15)
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
	static texture = terrainPng.at(0, 12)
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
	static breakSounds = this.stepSounds
}

Blocks.white_wool = class extends Wool{ static texture = terrainPng.at(0, 4) }
Blocks.light_grey_wool = class extends Wool{ static texture = terrainPng.at(1, 14) }
Blocks.grey_wool = class extends Wool{ static texture = terrainPng.at(2, 7) }
Blocks.black_wool = class extends Wool{ static texture = terrainPng.at(1, 7) }
Blocks.red_wool = class extends Wool{ static texture = terrainPng.at(1, 8) }
Blocks.orange_wool = class extends Wool{ static texture = terrainPng.at(2, 13) }
Blocks.yellow_wool = class extends Wool{ static texture = terrainPng.at(2, 10) }
Blocks.lime_wool = class extends Wool{ static texture = terrainPng.at(2, 9) }
Blocks.green_wool = class extends Wool{ static texture = terrainPng.at(1, 9) }
Blocks.cyan_wool = class extends Wool{ static texture = terrainPng.at(1, 13) }
Blocks.light_blue_wool = class extends Wool{ static texture = terrainPng.at(2, 11) }
Blocks.blue_wool = class extends Wool{ static texture = terrainPng.at(1, 11) }
Blocks.purple_wool = class extends Wool{ static texture = terrainPng.at(1, 12) }
Blocks.magenta_wool = class extends Wool{ static texture = terrainPng.at(2, 12) }
Blocks.pink_wool = class extends Wool{ static texture = terrainPng.at(2, 8) }
Blocks.brown_wool = class extends Wool{ static texture = terrainPng.at(1, 10) }

Items.white_wool = class extends Item{
	places(){ return Blocks.white_wool }
	static texture = terrainPng.at(0, 4)
}
Items.light_grey_wool = class extends Item{
	places(){ return Blocks.light_grey_wool }
	static texture = terrainPng.at(1, 14)
}
Items.grey_wool = class extends Item{
	places(){ return Blocks.grey_wool }
	static texture = terrainPng.at(2, 7)
}
Items.black_wool = class extends Item{
	places(){ return Blocks.black_wool }
	static texture = terrainPng.at(1, 7)
}
Items.red_wool = class extends Item{
	places(){ return Blocks.red_wool }
	static texture = terrainPng.at(1, 8)
}
Items.orange_wool = class extends Item{
	places(){ return Blocks.orange_wool }
	static texture = terrainPng.at(2, 13)
}
Items.yellow_wool = class extends Item{
	places(){ return Blocks.yellow_wool }
	static texture = terrainPng.at(2, 10)
}
Items.lime_wool = class extends Item{
	places(){ return Blocks.lime_wool }
	static texture = terrainPng.at(2, 9)
}
Items.green_wool = class extends Item{
	places(){ return Blocks.green_wool }
	static texture = terrainPng.at(1, 9)
}
Items.cyan_wool = class extends Item{
	places(){ return Blocks.cyan_wool }
	static texture = terrainPng.at(1, 13)
}
Items.light_blue_wool = class extends Item{
	places(){ return Blocks.light_blue_wool }
	static texture = terrainPng.at(2, 11)
}
Items.blue_wool = class extends Item{
	places(){ return Blocks.blue_wool }
	static texture = terrainPng.at(1, 11)
}
Items.purple_wool = class extends Item{
	places(){ return Blocks.purple_wool }
	static texture = terrainPng.at(1, 12)
}
Items.magenta_wool = class extends Item{
	places(){ return Blocks.magenta_wool }
	static texture = terrainPng.at(2, 12)
}
Items.pink_wool = class extends Item{
	places(){ return Blocks.pink_wool }
	static texture = terrainPng.at(2, 8)
}
Items.brown_wool = class extends Item{
	places(){ return Blocks.brown_wool }
	static texture = terrainPng.at(1, 10)
}

Blocks.dragon_egg = class extends Block{}

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
	solid = false
	static texture = terrainPng.at(15, 1)
	static placeSounds = [Audio('sound/fire/ignite.mp3')]
	random(x, y){
		sound(fireAmbient, x, y, random() + 1, random() * 0.7 + 0.3)
	}
}

Blocks.portal = class extends Block{
	static solid = false
	static texture = terrainPng.at(14, 1)
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

Items.oak_log = class extends Item{
	places(){ return Blocks.oak_log }
	static texture = Blocks.oak_log.texture
}
Items.oak_planks = class extends Item{
	places(){ return Blocks.oak_planks }
	static texture = Blocks.oak_planks.texture
}
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

const explodeParticles = [0,8,16,24,32,40,48,56,64,72,80,88,96,104,112].mutmap(a => particlePng.crop(a,80,8,8))
const ashParticles = [0,8,16,24,32,40,48,56].mutmap(a => particlePng.crop(a,0,8,8))

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
const secondCanvas = Can(8,8, true)
secondCanvas.setTransform(1,0,0,-1,0,8)
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