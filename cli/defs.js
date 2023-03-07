import { audioSet, lava, water } from "./effects.js"
export const terrainPng = Texture("/cli/terrain.png")
export const itemsPng = Texture("/cli/items.png")
export const particlePng = Texture("/cli/particles.png")


Blocks.air = class extends Block{ static solid = false }
Blocks.grass = class extends Block{
	static texture = terrainPng.at(3, 0)
	static breaktime = 1.5
	static placeSounds = audioSet('grass', 'place', 4)
	static stepSounds = audioSet('grass', 'step', 6)
}
class Stone extends Block{
	static tool = 'pick'
	static texture = terrainPng.at(1, 0)
	static placeSounds = audioSet('stone', 'place', 4)
	static stepSounds = audioSet('stone', 'step', 6)
	static breaktime = 7.5
}
Blocks.stone = Stone
Blocks.obsidian = class extends Stone{
	static texture = terrainPng.at(5, 2)
	static breaktime = 250
}
Blocks.dirt = class extends Block{
	static texture = terrainPng.at(2, 0)
	static breaktime = 1.5
	static placeSounds = audioSet('dirt', 'place', 4)
	static stepSounds = audioSet('dirt', 'step', 4)
}
Blocks.bedrock = class extends Stone{
	static texture = terrainPng.at(1, 1)
	static tool = 'pick'
}
class Wood extends Block{
	static placeSounds = audioSet('wood', 'place', 4)
	static stepSounds = audioSet('wood', 'step', 6)
	static tool = 'axe'
}
Blocks.oak_log = class extends Wood{
	static texture = terrainPng.at(4, 1)
	static breaktime = 5
}
Blocks.oak_planks = class extends Wood{
	static texture = terrainPng.at(4, 0)
	static breaktime = 3
}
Blocks.sand = class extends Block{
	static texture = terrainPng.at(2, 1)
	static placeSounds = audioSet('sand', 'place', 4)
	static stepSounds = audioSet('sand', 'step', 5)
}
Blocks.water = class extends Block{
	static texture = terrainPng.at(13, 12)
	static solid = false
	static climbable = true
	static gooeyness = 0.07
	random(x, y){
		const r = random()
		if(r < .1)
			sound(water.ambient[0], x, y, 1, 1)
		else if(r < .2)
			sound(water.ambient[1], x, y, 1, 1)	
	}
}
Blocks.lava = class extends Blocks.water{
	static texture = terrainPng.at(13, 14)
	static gooeyness = 0.5
	random(x, y){
		sound(random() < .05 ? lava.ambient : lava.pop, x, y, 1, 1)
	}
}
Blocks.sandstone = class extends Stone{
	static texture = terrainPng.at(0, 12)
	static breaktime = 4
}
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
	static placeSounds = audioSet('netherrack', 'place', 6)
	static stepSounds = audioSet('netherrack', 'step', 6)
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
Items.obsidian = class extends Item{
	places(){ return Blocks.obsidian }
	static texture = Blocks.obsidian.texture
}
Items.netherrack = class extends Item{
	places(){ return Blocks.netherrack }
	static texture = Blocks.netherrack.texture
}
Items.grass = class extends Item{
	places(){ return Blocks.grass }
	static texture = Blocks.grass.texture
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