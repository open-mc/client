import { music } from 'world'
import { renderF3 } from '../iframe/api.js'
const {Audio, Texture} = loader(import.meta)

export const audioSet = (path, count) => Array.from({length: count}, (_, i) => Audio('sound/'+path+(i+1)+'.mp3'))

export const click = Audio('../img/click.mp3')

export const icons = Texture('icons.png')
const btns = Texture('../img/button.png')
export const uiButtons = {
	large: btns.crop(124,20,200,20),
	largeSelected: btns.crop(124,40,200,20),
	largeDisabled: btns.crop(124,0,200,20)
}

music('overworld',
	Audio("sound/calm1.mp3"),
	Audio("sound/calm2.mp3"),
	Audio("sound/calm3.mp3"),
	Audio("sound/hal1.mp3"),
	Audio("sound/hal2.mp3"),
	Audio("sound/hal3.mp3"),
	Audio("sound/hal4.mp3"),
	Audio("sound/nuance1.mp3"),
	Audio("sound/nuance2.mp3"),
	Audio("sound/piano1.mp3"),
	Audio("sound/piano2.mp3"),
	Audio("sound/piano3.mp3")
)
music('nether',
	Audio('sound/nether1.mp3'),
	Audio('sound/nether2.mp3'),
	Audio('sound/nether3.mp3'),
	Audio('sound/nether4.mp3')
)

music('end', Audio('sound/end.mp3'))

music('void', Audio('sound/deep1.mp3'))

export const lava = {
	ambient: Audio('sound/lava/ambient.mp3'),
	pop: Audio('sound/lava/pop.mp3')
}

export const water = {
	ambient: [Audio('sound/water/ambient1.mp3'), Audio('sound/water/ambient2.mp3')],
}

export function renderItem(c, item, respectModel = false){
	if(item && item.texture){
		if(!respectModel || item.model == 0){
			c.push()
			c.translate(-0.5, 0)
			c.image(item.texture, 0, 0, 1, 1)
			item.render?.(c)
			c.pop()
		}else if(item.model == 1){
			c.push()
			c.translate(0.5,0)
			c.translate(-1.2,1.2)
			c.rotate(PI * -0.75)
			c.scale(-1.6, 1.6)
			c.translate(-0.5, 0)
			c.image(item.texture, 0, 0, 1, 1)
			item.render?.(c)
			c.pop()
		}else if(item.model == 2){
			c.push()
			c.translate(-0.75, -0.25)
			c.scale(1.5, 1.5)
			c.image(item.texture, 0, 0, 1, 1)
			item.render?.(c)
			c.pop()
		}
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

export function renderSlot(c, e, i){
	const item = i > 127 ? e.items[i&127] : me.inv[i]
	renderItem(c, item)
	renderItemCount(c, item)
	const {x, y} = c.mouse()
	if(y >= 0 && y < 1 && x >= -0.5 && x < .5){
		c.fillStyle = '#fff'
		c.globalAlpha = 0.2
		c.fillRect(-0.5, 0, 1, 1)
		c.globalAlpha = 1
		void ({x: slotx, y: sloty} = c.to(1.0625, 1.125))
		slotI = i
	}
}
export function renderTooltip(c, e){
	if(slotI < 0) return
	const item = slotI > 127 ? e.items[slotI & 127] : me.inv[slotI]
	if(!item) return
	const {x, y} = c.mouse()
	const lines = [item.name || item.defaultName], styles = [15]
	if(renderF3) lines.push(`${item.className}*${item.count}${(item.savedata?'+NBT':'')} (${item.id})`), styles.push(8)
	let width = 0
	for(const l of lines) width = max(c.measureText(l, 10).width, width)
	c.translate(x + 12, y + 8)
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