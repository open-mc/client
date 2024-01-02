import { Blocks, Items, Item } from 'definitions'
import { itemify, slabifyItem } from './blockshapes.js'
import { chestTop, commandBlockTexs } from './blocks.js'
import { getblock } from 'world'

const {Texture} = loader(import.meta)

export const itemsPng = Texture("items.png")
Items.oak_log = itemify(Blocks.oak_log, 'Oak log')
Items.birch_log = itemify(Blocks.birch_log, 'Birch log')
Items.spruce_log = itemify(Blocks.spruce_log, 'Spruce log')
Items.dark_oak_log = itemify(Blocks.dark_oak_log, 'Dark oak log')
Items.acacia_log = itemify(Blocks.acacia_log, 'Acacia log')
Items.jungle_log = itemify(Blocks.jungle_log, 'Jungle log')

Items.oak_planks = itemify(Blocks.oak_planks, 'Oak planks')
Items.birch_planks = itemify(Blocks.birch_planks, 'Birch planks')
Items.spruce_planks = itemify(Blocks.spruce_planks, 'Spruce planks')
Items.dark_oak_planks = itemify(Blocks.dark_oak_planks, 'Dark oak planks')
Items.acacia_planks = itemify(Blocks.acacia_planks, 'Acacia planks')
Items.jungle_planks = itemify(Blocks.jungle_planks, 'Jungle planks')

Items.oak_planks_slab = slabifyItem(Items.oak_planks, Blocks.oak_planks)
Items.birch_planks_slab = slabifyItem(Items.birch_planks, Blocks.birch_planks)
Items.spruce_planks_slab = slabifyItem(Items.spruce_planks, Blocks.spruce_planks)
Items.dark_oak_planks_slab = slabifyItem(Items.dark_oak_planks, Blocks.dark_oak_planks)
Items.acacia_planks_slab = slabifyItem(Items.acacia_planks, Blocks.acacia_planks)
Items.jungle_planks_slab = slabifyItem(Items.jungle_planks, Blocks.jungle_planks)


Items.sand = itemify(Blocks.sand, 'Sand')
Items.sandstone = itemify(Blocks.sandstone, 'Sandstone')
Items.stone = itemify(Blocks.stone, 'Stone')
Items.cobblestone = itemify(Blocks.cobblestone, 'Cobblestone')
Items.glass = itemify(Blocks.glass, 'Glass')
Items.bedrock = itemify(Blocks.bedrock, 'Bedrock')
Items.obsidian = itemify(Blocks.obsidian, 'Obsidian')
Items.glowing_obsidian = itemify(Blocks.glowing_obsidian, 'Glowing Obsidian')

Items.netherrack = itemify(Blocks.netherrack, 'Netherrack')
Items.grass = itemify(Blocks.grass, 'Grass block')
Items.dirt = itemify(Blocks.dirt, 'Dirt')
Items.sugar_cane = class extends Item{
	places(_, _2, x, y){
		const bl = getblock(x-1, y-1), br = getblock(x+1, y-1), b = getblock(x, y-1)
		if(b == Blocks.sugar_cane | (((bl.flows === false & bl.fluidType === 'water') | (br.flows === false & br.fluidType === 'water')) & b.solid))
			return Blocks.sugar_cane
	}
	static texture = itemsPng.crop(16,256,16,16)
	static defaultName = 'Sugar cane'
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
	static defaultName = 'Diamond pickaxe'
}

Items.diamond_shovel = class extends Tool{
	static for = 'shovel'
	static speed = 25
	static texture = itemsPng.at(3, 8)
	static defaultName = 'Diamond shovel'
}

Items.diamond_axe = class extends Tool{
	static for = 'axe'
	static speed = 25
	static texture = itemsPng.at(14, 7)
	static defaultName = 'Diamond axe'
}

Items.flint_and_steel = class extends Tool{
	static model = 2
	static texture = itemsPng.at(17, 10)
	static defaultName = 'Flint and steel'
}

Items.tnt = itemify(Blocks.tnt, 'TNT')

Items.end_crystal = class extends Item{
	static texture = itemsPng.at(0,10)
	static defaultName = 'End crystal'
}
class Mineral extends Item{}

Items.lapis = Mineral
Items.coal = Mineral
Items.iron = Mineral
Items.gold = Mineral
Items.emerald = Mineral
Items.diamond = Mineral

Items.cut_sandstone = class extends Items.sandstone{
	static defaultName = 'Cut sandstone'
}
Items.smooth_sandstone = class extends Items.sandstone{
	static defaultName = 'Smooth sandstone'
}
Items.chiseled_sandstone = class extends Items.sandstone{
	static defaultName = 'Chiseled sandstone'
}
Items.red_sandstone = class extends Items.sandstone{
	static defaultName = 'Red sandstone'
}
Items.cut_red_sandstone = class extends Items.sandstone{
	static defaultName = 'Cut red sandstone'
}
Items.chiseled_red_sandstone = class extends Items.sandstone{
	static defaultName = 'Chiseled red sandstone'
}
Items.smooth_red_sandstone = class extends Items.sandstone{
	static defaultName = 'Smooth red sandstone'
}

Items.end_portal_frame = itemify(Blocks.end_portal_frame, 'End portal frame')

Items.eye_of_ender = class extends Item{
	static texture = itemsPng.at(1, 10)
	static defaultName = 'Eye of ender'
}

Items.command_block = class extends Item{
	render(c){
		const a = floor(t*2)&3
		const alpha = c.globalAlpha==1
		c.image(commandBlockTexs[0], 0, 0, 1, 1, 0, a<<4, 16, 16)
		if(alpha){
			c.globalAlpha = (t*2)%1
			c.image(commandBlockTexs[0], 0, 0, 1, 1, 0, (a+1&3)<<4, 16, 16)
			c.globalAlpha = 1
		}
	}
	static defaultName = 'Command block'
}

Items.endstone = itemify(Blocks.endstone, 'Endstone')

Items.white_wool = itemify(Blocks.white_wool, 'White wool')
Items.light_grey_wool = itemify(Blocks.light_grey_wool, 'Light grey wool')
Items.grey_wool = itemify(Blocks.grey_wool, 'Grey wool')
Items.black_wool = itemify(Blocks.black_wool, 'Black wool')
Items.red_wool = itemify(Blocks.red_wool, 'Red wool')
Items.orange_wool = itemify(Blocks.orange_wool, 'Orange wool')
Items.yellow_wool = itemify(Blocks.yellow_wool, 'Yellow wool')
Items.lime_wool = itemify(Blocks.lime_wool, 'Lime wool')
Items.green_wool = itemify(Blocks.green_wool, 'Green wool')
Items.cyan_wool = itemify(Blocks.cyan_wool, 'Cyan wool')
Items.light_blue_wool = itemify(Blocks.light_blue_wool, 'Light blue wool')
Items.blue_wool = itemify(Blocks.blue_wool, 'Blue wool')
Items.purple_wool = itemify(Blocks.purple_wool, 'Purple wool')
Items.magenta_wool = itemify(Blocks.magenta_wool, 'Magenta wool')
Items.pink_wool = itemify(Blocks.pink_wool, 'Pink wool')
Items.brown_wool = itemify(Blocks.brown_wool, 'Brown wool')

Items.bucket = class extends Item{
	static texture = itemsPng.at(9, 1)
	static defaultName = 'Bucket'
	static interactFluid = true
}
Items.bucket_of_water = class extends Item{
	static texture = itemsPng.at(12, 1)
	places(){ return Blocks.water }
	static defaultName = 'Bucket of water'
}
Items.bucket_of_lava = class extends Item{
	static texture = itemsPng.at(10, 1)
	places(){ return Blocks.lava }
	static defaultName = 'Bucket of lava'
}

Items.oak_sapling = class extends Item{
	place(_, _2, x, y){ if(getblock(x,y-1).dirt) return Blocks.oak_sapling }
	static texture = Blocks.oak_sapling.texture
	static defaultName = 'Oak sapling'
}

Items.birch_sapling = class extends Item{
	place(_, _2, x, y){ if(getblock(x,y-1).dirt) return Blocks.birch_sapling }
	static texture = Blocks.birch_sapling.texture
	static defaultName = 'Birch sapling'
}

Items.spruce_sapling = class extends Item{
	place(_, _2, x, y){ if(getblock(x,y-1).dirt) return Blocks.spruce_sapling }
	static texture = Blocks.spruce_sapling.texture
	static defaultName = 'Spruce sapling'
}

Items.dark_oak_sapling = class extends Item{
	place(_, _2, x, y){ if(getblock(x,y-1).dirt) return Blocks.dark_oak_sapling }
	static texture = Blocks.dark_oak_sapling.texture
	static defaultName = 'Dark oak sapling'
}

Items.acacia_sapling = class extends Item{
	place(_, _2, x, y){ if(getblock(x,y-1).dirt) return Blocks.acacia_sapling }
	static texture = Blocks.acacia_sapling.texture
	static defaultName = 'Acacia sapling'
}

Items.jungle_sapling = class extends Item{
	place(_, _2, x, y){ if(getblock(x,y-1).dirt) return Blocks.jungle_sapling }
	static texture = Blocks.jungle_sapling.texture
	static defaultName = 'Jungle sapling'
}

Items.bone_meal = class extends Item{
	static texture = itemsPng.at(9, 9)
	static defaultName = 'Bone meal'
}

Items.apple = class extends Item{
	static texture = itemsPng.at(2, 0)
	static defaultName = 'Apple'
}

Items.stick = class extends Item{
	static texture = itemsPng.at(1, 17)
	static defaultName = 'Stick'
}

const leavesItem = (B, B2, n) => class extends itemify(B, n){
	places(_ , _2, _3, _4, x, y){	
		if(getblock(x, y) === B2) return
		return B
	}
}

Items.oak_leaves = leavesItem(Blocks.oak_leaves, Blocks.oak_log, 'Oak Leaves')
Items.birch_leaves = leavesItem(Blocks.birch_leaves, Blocks.birch_log, 'Birch Leaves')
Items.spruce_leaves = leavesItem(Blocks.spruce_leaves, Blocks.spruce_log, 'Spruce Leaves')
Items.dark_oak_leaves = leavesItem(Blocks.dark_oak_leaves, Blocks.dark_oak_log, 'Dark oak Leaves')
Items.acacia_leaves = leavesItem(Blocks.acacia_leaves, Blocks.acacia_log, 'Acacia Leaves')
Items.jungle_leaves = leavesItem(Blocks.jungle_leaves, Blocks.jungle_log, 'Jungle Leaves')

Items.crafting_table = itemify(Blocks.crafting_table, 'Crafting table')

Items.furnace = itemify(Blocks.furnace, 'Furnace')
Items.chest = class extends Item{
	static texture = Blocks.chest.texture
	static defaultName = 'Chest'
	render(c, model){
		//c.transform(-1, 0, 0, 1, 1, 0)
		c.image(chestTop, 0, 0, 1, 1)
	}
}