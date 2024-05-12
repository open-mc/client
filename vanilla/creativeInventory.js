import { uiButton } from 'api'
import { commandBlockTexs } from './blocks.js'
import { click, renderItem, renderTooltip } from './effects.js'
import './items.js'
import { send } from 'api'

const Category = (name, icon, ...a) => { a.name = name; a.icon = icon; return a }

const categories = [
	Category('Wood', Items.oak_log.texture,
		Items.oak_log, Items.birch_log,
		Items.spruce_log, Items.dark_oak_log,
		Items.acacia_log, Items.jungle_log,
		Items.oak_planks, Items.birch_planks,
		Items.spruce_planks, Items.dark_oak_planks,
		Items.acacia_planks, Items.jungle_planks,
		Items.oak_planks_slab, Items.birch_planks_slab,
		Items.spruce_planks_slab, Items.dark_oak_planks_slab,
		Items.acacia_planks_slab, Items.jungle_planks_slab,
	),

	Category('Building', Items.cobblestone.texture,
		Items.cobblestone, Items.glass,
		Items.oak_planks, Items.birch_planks,
		Items.spruce_planks, Items.dark_oak_planks,
		Items.acacia_planks, Items.jungle_planks,
	),

	Category('Deco', Items.red_wool.texture,
		Items.black_wool, Items.grey_wool, Items.light_grey_wool, Items.white_wool,
		Items.brown_wool, Items.red_wool, Items.orange_wool, Items.yellow_wool,
		Items.lime_wool, Items.green_wool, Items.cyan_wool, Items.light_blue_wool,
		Items.blue_wool, Items.purple_wool, Items.magenta_wool, Items.pink_wool,
		Items.glass
	),

	Category('Forest', Items.oak_sapling.texture,
		Items.oak_log, Items.birch_log,
		Items.spruce_log, Items.dark_oak_log,
		Items.acacia_log, Items.jungle_log,
		Items.oak_leaves, Items.birch_leaves,
		Items.spruce_leaves, Items.dark_oak_leaves,
		Items.acacia_leaves, Items.jungle_leaves,
	),

	Category('Desert', Items.sand.texture,
		Items.sand, Items.sandstone,
		Items.cut_sandstone, Items.smooth_sandstone,
		Items.chiseled_sandstone, Items.red_sandstone,
		Items.cut_red_sandstone, Items.chiseled_red_sandstone,
		Items.smooth_red_sandstone,
	),

	Category('Ground', Items.grass.texture,
		Items.grass, Items.dirt,
		Items.sand, Items.stone,
		Items.sandstone, Items.netherrack,
		Items.endstone, Items.obsidian, Items.bedrock,
		Items.bucket_of_water, Items.bucket_of_lava,
	),

	Category('Slabs', Items.oak_planks_slab.texture,
		Items.oak_planks_slab, Items.birch_planks_slab,
		Items.spruce_planks_slab, Items.dark_oak_planks_slab,
		Items.acacia_planks_slab, Items.jungle_planks_slab,
	),

	Category('Crops', Items.sugar_cane.texture,
		Items.sugar_cane, Items.sand,
		Items.dirt, Items.bucket_of_water,
		Items.oak_sapling, Items.birch_sapling,
		Items.spruce_sapling, Items.dark_oak_sapling,
		Items.acacia_sapling, Items.jungle_sapling,
		Items.bone_meal,
	),

	Category('Food', Items.apple.texture,
		Items.apple
	),

	Category('Tools', Items.diamond_pickaxe.texture,
		Items.diamond_pickaxe, Items.diamond_shovel, Items.diamond_axe,
		Items.flint_and_steel, Items.bucket
	),

	Category('Destructive', Items.tnt.texture,
		Items.tnt, Items.flint_and_steel, Items.end_crystal,
		Items.glowing_obsidian, Items.bucket_of_lava, Items.bucket_of_water
	),

	Category('General', Items.stick.texture,
		Items.stick, Items.eye_of_ender,
		Items.lapis, Items.coal, Items.iron,
		Items.gold, Items.emerald, Items.diamond,
	),

	Category('Special', Items.eye_of_ender.texture,
		Items.eye_of_ender,
	),

	Category('Tool blocks', Items.crafting_table.texture,
		Items.crafting_table, Items.chest, Items.furnace,
	),

	Category('Technical', commandBlockTexs[0].crop(0,0,16,16),
		Items.command_block, Items.end_portal_frame,
		Items.bedrock,
	),
]

let selectedCat = null, catPreview = null
export function renderLeft(c){
	c.textBaseline = 'alphabetic'
	catPreview = null
	for(const cat of categories){
		c.fillStyle = '#0008'
		c.fillRect(1, -21, 150, 20)
		const L = uiButton(c, 0, -21, 152, 21)
		if(L || selectedCat == cat){
			c.strokeStyle = L == 2 || selectedCat == cat ? '#fff' : '#fff8'
			c.lineWidth = 1
			c.strokeRect(1.5, -20.5, 149, 19)
			if(L) catPreview = cat
		}
		if(L == 2){
			if(cat === selectedCat) selectedCat = null
			else selectedCat = cat
			click()
		}
		c.fillStyle = '#fff'
		c.image(cat.icon, 3, -19, 16, 16)
		c.textAlign = 'left'
		c.fillText(cat.name, 23, -15, 10)
		c.textAlign = 'right'
		c.fillStyle = '#fff8'
		c.fillText(cat.length, 147, -15, 10)
		c.translate(0, -21)
	}
}
const ROW_SIZE = 8
export function renderRight(c){
	const cat = catPreview ?? selectedCat
	if(!cat) return
	c.push()
	c.translate(-10, 0)
	c.scale(16, 16)
	c.fillStyle = '#fff3'
	let i = 0
	let sel = null
	for(const item of cat){
		if((i++)%ROW_SIZE) c.translate(1.125, 0)
		else c.translate(-1.125*(ROW_SIZE-1), -1.125)
		renderItem(c, item, false)
		const L = uiButton(c, -0.5, 0, 1, 1)
		if(L){
			c.fillRect(-0.5, 0, 1, 1)
			sel = item
		}
		if(L == 2){
			const d = new DataWriter()
			d.byte(20)
			d.short(item.id)
			d.byte(1)
			send(d)
		}else if(L == 3){
			const d = new DataWriter()
			d.byte(20)
			d.short(item.id)
			d.byte(64)
			send(d)
		}
	}
	c.pop()
	if(sel) renderTooltip(c, sel)
}