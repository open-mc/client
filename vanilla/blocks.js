import { audioSet, lava, water } from './effects.js'
import { sound, cam } from 'world'
import { Blocks, Block, Item } from 'definitions'
import { BlockShape, blockShaped, fluidify } from './blockshapes.js'
const {Texture, Audio} = loader(import.meta)

export const terrainPng = Texture("terrain.png")
export const animatedPng = Texture("animated.png")

Blocks.air = class extends Block{ static solid = false; static replacable = true }
Blocks.grass = class extends Block{
	static dirt = true
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
Blocks.cobblestone = class extends Stone{
	static texture = terrainPng.at(0, 1)
}
Blocks.obsidian = class extends Stone{
	static texture = terrainPng.at(5, 2)
	static breaktime = 250
}

Blocks.glowing_obsidian = class extends Blocks.obsidian{
	static breaktime = 500
	static texture = terrainPng.at(5, 4)
}
Blocks.dirt = class extends Block{
	static dirt = true
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
} = fluidify(Water, 'water', animatedPng.at(2, 0, 32), animatedPng.at(5, 0, 64)))

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
} = fluidify(Lava, 'lava', animatedPng.at(3, 0, 38), animatedPng.at(4, 0, 32)))

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

Blocks.chest = class extends Block{
	static texture = terrainPng.at(10, 1)
	static placeSounds = Wood.placeSounds
	static stepSounds = Wood.stepSounds
	items = Array.null(27)
	name = ''
	static tool = 'axe'
}

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
const fireExtinguish = Audio('sound/fire/extinguish.mp3')

Blocks.fire = class extends Block{
	static solid = false
	static replacable = true
	static texture = animatedPng.at(1, 0, 32)
	static placeSounds = [Audio('sound/fire/ignite.mp3')]
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
	const f = cam.z*2
	const a = cos(rot) / f, b = sin(rot) / f
	p.setPatternTransform(a, -b, -b, -a, b*off-x, a*off+y)
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
	static texture = terrainPng.at(14, 2)
}

Blocks.birch_sapling = class extends Sapling{
	static texture = terrainPng.at(15, 4)
}

Blocks.spruce_sapling = class extends Sapling{
	static texture = terrainPng.at(15, 3)
}

Blocks.dark_oak_sapling = class extends Sapling{
	static texture = terrainPng.at(14, 4)
}

Blocks.acacia_sapling = class extends Sapling{
	static texture = terrainPng.at(14, 3)
}

Blocks.jungle_sapling = class extends Sapling{
	static texture = terrainPng.at(15, 2)
}

class Leaves extends Block{
	static placeSounds = Blocks.grass.placeSounds
	static stepSounds = Blocks.grass.stepSounds
}

Blocks.oak_leaves = class extends Leaves{
	static texture = terrainPng.at(0, 12)
}
Blocks.birch_leaves = class extends Leaves{
	static texture = terrainPng.at(2, 12)
}
Blocks.spruce_leaves = class extends Leaves{
	static texture = terrainPng.at(2, 12)
}
Blocks.dark_oak_leaves = class extends Leaves{
	static texture = terrainPng.at(0, 12)
}
Blocks.acacia_leaves = class extends Leaves{
	static texture = terrainPng.at(0, 12)
}
Blocks.jungle_leaves = class extends Leaves{
	static texture = terrainPng.at(4, 12)
}

Blocks.oak_log_leaves = class extends Leaves{
	static texture = terrainPng.at(5, 12)
}
Blocks.birch_log_leaves = class extends Leaves{
	static texture = terrainPng.at(6, 12)
}
Blocks.spruce_log_leaves = class extends Leaves{
	static texture = terrainPng.at(7, 12)
}
Blocks.dark_oak_log_leaves = class extends Leaves{
	static texture = terrainPng.at(8, 12)
}
Blocks.acacia_log_leaves = class extends Leaves{
	static texture = terrainPng.at(9, 12)
}
Blocks.jungle_log_leaves = class extends Leaves{
	static texture = terrainPng.at(10, 12)
}

Blocks.crafting_table = class extends Planks{
	static texture = terrainPng.at(12, 3)
}

Blocks.furnace = class extends Stone{
	static texture = terrainPng.at(12, 2)
}
Blocks.lit_furnace = class extends Blocks.furnace{
	static texture = terrainPng.at(13, 3)
}