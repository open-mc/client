import { uiButton, drawText, calcText, send } from 'api'
import { commandBlockTexs } from './blocks.js'
import { renderItem, renderTooltip, slotHighlightColor } from './effects.js'
import click from "../img/click.mp3"
import { toTex } from 'definitions'
import './items.js'

const Category = (name, icon, ...a) => { a.name = name; a.icon = icon; return a }

const categories = [
	Category('Building', Items.cobblestone,
		Items.cobblestone, Items.glass,
		Items.oak_planks, Items.birch_planks,
		Items.spruce_planks, Items.dark_oak_planks,
		Items.acacia_planks, Items.jungle_planks,
	),

	Category('Wood', Items.oak_log,
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

	Category('Stone', Items.stone,
		Items.stone, Items.cobblestone
	),

	Category('Deco', Items.red_wool,
		Items.black_wool, Items.grey_wool, Items.light_grey_wool, Items.white_wool,
		Items.brown_wool, Items.red_wool, Items.orange_wool, Items.yellow_wool,
		Items.lime_wool, Items.green_wool, Items.cyan_wool, Items.light_blue_wool,
		Items.blue_wool, Items.purple_wool, Items.magenta_wool, Items.pink_wool,
		Items.glass, Items.glowstone
	),

	Category('Lighting', Items.torch,
		Items.torch, Items.glass, Items.glowstone, Items.glowing_obsidian, Items.bucket_of_lava, Items.flint_and_steel
	),

	Category('Shaped blocks', Items.oak_planks_slab,
		Items.oak_planks_slab, Items.birch_planks_slab,
		Items.spruce_planks_slab, Items.dark_oak_planks_slab,
		Items.acacia_planks_slab, Items.jungle_planks_slab,
	),

	Category('Natural', Items.oak_sapling,
		Items.grass, Items.dirt,
		Items.stone, Items.netherrack,
		Items.endstone, Items.obsidian, Items.bedrock,
		Items.bucket_of_water, Items.bucket_of_lava,
		Items.oak_log, Items.birch_log,
		Items.spruce_log, Items.dark_oak_log,
		Items.acacia_log, Items.jungle_log,
		Items.oak_leaves, Items.birch_leaves,
		Items.spruce_leaves, Items.dark_oak_leaves,
		Items.acacia_leaves, Items.jungle_leaves,
		Items.sand, Items.sandstone,
		Items.cut_sandstone, Items.smooth_sandstone,
		Items.chiseled_sandstone, Items.red_sandstone,
		Items.cut_red_sandstone, Items.chiseled_red_sandstone,
		Items.smooth_red_sandstone,
	),

	Category('General', Items.iron,
		Items.stick, Items.coal,
		Items.iron, Items.lapis,
		Items.gold, Items.diamond,  Items.emerald,
		Items.eye_of_ender
	),

	Category('Crops & food', Items.apple,
		Items.sugar_cane, Items.sand,
		Items.dirt, Items.bucket_of_water,
		Items.oak_sapling, Items.birch_sapling,
		Items.spruce_sapling, Items.dark_oak_sapling,
		Items.acacia_sapling, Items.jungle_sapling,
		Items.bone_meal, Items.apple
	),

	Category('Tools', Items.diamond_pickaxe,
		Items.diamond_pickaxe, Items.diamond_shovel, Items.diamond_axe,
		Items.flint_and_steel, Items.bucket
	),

	Category('Destructive', Items.tnt,
		Items.tnt, Items.flint_and_steel, Items.end_crystal,
		Items.glowing_obsidian, Items.bucket_of_lava, Items.bucket_of_water
	),

	Category('Special', Items.end_crystal,
		Items.end_crystal, Items.eye_of_ender,
	),

	Category('Functional', Items.crafting_table,
		Items.crafting_table, Items.chest, Items.furnace,
	),

	Category('Technical', Items.command_block,
		Items.command_block, Items.end_portal_frame,
		Items.bedrock, Items.barrier
	),
]

let catBgFill = vec4(0, 0, 0, .5)
let selectedCat = null, catPreview = null
export function renderLeft(c){
	catPreview = null
	for(const cat of categories){
		c.drawRect(1, -21, 150, 20, catBgFill)
		const L = uiButton(c, 0, -21, 152, 21)
		if(L || selectedCat == cat){
			const col = L == 2 || selectedCat == cat ? vec4.one : vec4(.5)
			c.drawRect(1, -20, 1, 18, col)
			c.drawRect(1, -21, 150, 1, col)
			c.drawRect(151, -20, -1, 18, col)
			c.drawRect(1, -1, 150, -1, col)
			if(L) catPreview = cat
		}
		if(L == 2){
			if(cat === selectedCat) selectedCat = null
			else selectedCat = cat
			click()
		}
		const c2 = c.sub()
		c2.box(11, -19, 16, 16)
		renderItem(c2, cat.icon)
		c.textAlign = 'left'
		drawText(c, cat.name, 23, -15, 8)
		c.textAlign = 'right'
		const arr = calcText('\\+7'+cat.length)
		drawText(c, arr, 147 - arr.width*8, -15, 8)
		c.translate(0, -21)
	}
}
const ROW_SIZE = 8
export function renderRight(c){
	const cat = catPreview ?? selectedCat
	if(!cat) return
	const c2 = c.sub()
	c2.translate(-10, 0)
	c2.scale(16, 16)
	let i = 0
	let sel = null
	for(const item of cat){
		if((i++)%ROW_SIZE) c2.translate(1.125, 0)
		else c2.translate(-1.125*(ROW_SIZE-1), -1.125)
		renderItem(c2, item, _, 0)
		const L = uiButton(c2, -0.5, 0, 1, 1)
		if(L){
			c2.drawRect(-0.5, 0, 1, 1, slotHighlightColor)
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
	if(sel) renderTooltip(c, sel)
}