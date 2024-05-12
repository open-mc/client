import { music, me } from 'world'
import { renderF3 } from 'api'
const src = loader(import.meta)

export const audioSet = (path, count) => Array.from({length: count}, (_, i) => Audio(src`sound/${path+(i+1)}.mp3`))

export const click = Audio(src`../img/click.mp3`)

export const icons = Img(src`icons.png`)
const btns = Img(src`../img/button.png`)
export const uiButtons = {
	large: btns.crop(124,20,200,20),
	largeSelected: btns.crop(124,40,200,20),
	largeDisabled: btns.crop(124,0,200,20),
	tiny: btns.crop(8,20,20,20),
	tinySelected: btns.crop(8,40,20,20),
	tinyDisabled: btns.crop(8,0,20,20),
}

music('overworld',
	Audio(src`sound/calm1.mp3`),
	Audio(src`sound/calm2.mp3`),
	Audio(src`sound/calm3.mp3`),
	Audio(src`sound/hal1.mp3`),
	Audio(src`sound/hal2.mp3`),
	Audio(src`sound/hal3.mp3`),
	Audio(src`sound/hal4.mp3`),
	Audio(src`sound/nuance1.mp3`),
	Audio(src`sound/nuance2.mp3`),
	Audio(src`sound/piano1.mp3`),
	Audio(src`sound/piano2.mp3`),
	Audio(src`sound/piano3.mp3`)
)
music('nether',
	Audio(src`sound/nether1.mp3`),
	Audio(src`sound/nether2.mp3`),
	Audio(src`sound/nether3.mp3`),
	Audio(src`sound/nether4.mp3`)
)

music('end', Audio(src`sound/end.mp3`))

music('void', Audio(src`sound/deep1.mp3`))

export const lava = {
	ambient: Audio(src`sound/lava/ambient.mp3`),
	pop: Audio(src`sound/lava/pop.mp3`)
}

export const water = {
	ambient: [Audio(src`sound/water/ambient1.mp3`), Audio(src`sound/water/ambient2.mp3`)],
}

export function renderItem(c, item, respectModel = false){
	if(item && item.texture){
		const h = floor(t*20)%(item.texture.h>>4)<<4
		if(!respectModel || item.model == 0){
			c.push()
			c.translate(-0.5, 0)
			c.image(item.texture, 0, 0, 1, 1, 0, h, 16, 16)
			item.render?.(c, 0)
			c.pop()
		}else if(item.model == 1){
			c.push()
			c.translate(-0.7,1.2)
			c.rotate(PI * -0.75)
			c.scale(-1.6, 1.6)
			c.translate(-0.5, 0)
			c.image(item.texture, 0, 0, 1, 1, 0, h, 16, 16)
			item.render?.(c, 1)
			c.pop()
		}else if(item.model == 2){
			c.push()
			c.translate(-0.75, -0.25)
			c.scale(1.5, 1.5)
			c.image(item.texture, 0, 0, 1, 1, 0, h, 16, 16)
			item.render?.(c, 2)
			c.pop()
		}
	}else if(item && item.render){
		c.push()
		if(!respectModel || item.model == 0){
			c.translate(-0.5, 0)
			item.render(c, 0)
		}else if(item.model == 1){
			c.translate(0.5,0)
			c.translate(-1.2,1.2)
			c.rotate(PI * -0.75)
			c.scale(-1.6, 1.6)
			c.translate(-0.5, 0)
			item.render(c, 1)
		}else if(item.model == 2){
			c.translate(-0.75, -0.25)
			c.scale(1.5, 1.5)
			item.render(c, 2)
		}
		c.pop()
	}
}

export function renderItemCount(c, item){
	if(!item) return
	const count = item.count
	if(count != 1){
		c.textBaseline = 'alphabetic'
		c.textAlign = 'right'
		c.fillStyle = '#000'
		c.fillText(count + '', 0.56, -0.06, 0.6)
		c.fillStyle = count === (count & 255) ? '#fff' : '#e44'
		c.fillText(count + '', 0.5, 0, 0.6)
	}
}
let slotx = NaN, sloty = NaN
export let slotI = -1

export function resetSlot(){
	slotx = sloty = NaN
	slotI = -1
}

export function renderSlot(c, e, i, id=0){
	const item = e.getItem(id, i)
	renderItem(c, item)
	renderItemCount(c, item)
	const {x, y} = c.from(cursor)
	if(y >= 0 && y < 1 && x >= -0.5 && x < .5){
		c.fillStyle = '#fff'
		c.globalAlpha = 0.2
		c.fillRect(-0.5, 0, 1, 1)
		c.globalAlpha = 1
		void ({x: slotx, y: sloty} = c.to(1.0625, 1.125))
		slotI = e == me && id == 0 ? i : i|128
	}
}
export function renderTooltip(c, item){
	if(!item) return
	const lines = [item.name || item.defaultName], styles = [15]
	if(renderF3) lines.push(`${item.className}*${item.count}${(item.savedata?'+NBT':'')} (${item.id})`), styles.push(8)
	renderGenericTooltip(c, lines, styles)
}
export function renderGenericTooltip(c, lines, styles){
	const {x, y} = c.from(cursor)
	let width = 0
	for(const l of lines) width = max(c.measureText(l, 10).width, width)
	if(x+width+20 >= c.width || y+(lines.length+1)*12 >= c.height) c.translate(x - width - 12, y)
	else c.translate(x + 12, y + 8)
	c.fillStyle = '#110010e4'
	c.fillRect(-1, lines.length*-12-2, width+8, lines.length*12+2)
	c.fillRect(0, lines.length*-12-3, width+6, lines.length*12+4)
	c.strokeStyle = '#22004b'
	c.lineWidth = 1
	c.strokeRect(0.5, lines.length*-12-1.5, width+5, lines.length*12+1)
	c.textAlign = 'left'; c.textBaseline = 'middle'
	let i = -1
	for(const l of lines) c.styledText(styles[++i], l, 3, -7-i*12, 10)
}