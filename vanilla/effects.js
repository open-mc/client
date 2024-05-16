import { music, me, server } from 'world'
import { renderF3, drawText, measureWidth, drawLayer } from 'api'
import { toTex } from 'definitions'
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
	c = c.sub()
	if(item && item.texture >= 0){
		if(!respectModel || item.model == 0){
			c.translate(-0.5, 0)
			c.draw(toTex(item.texture))
			item.render?.(c, 0)
		}else if(item.model == 1){
			c.translate(-0.7,1.2)
			c.rotate(PI * 0.75)
			c.scale(-1.6, 1.6)
			c.translate(-0.5, 0)
			c.draw(toTex(item.texture))
			item.render?.(c, 1)
		}else if(item.model == 2){
			c.translate(-0.75, -0.25)
			c.scale(1.5, 1.5)
			c.draw(toTex(item.texture))
			item.render?.(c, 2)
		}
	}else if(item && item.render){
		if(!respectModel || item.model == 0){
			c.translate(-0.5, 0)
			item.render(c, 0)
		}else if(item.model == 1){
			c.translate(0.5,0)
			c.translate(-1.2,1.2)
			c.rotate(PI * 0.75)
			c.scale(-1.6, 1.6)
			c.translate(-0.5, 0)
			item.render(c, 1)
		}else if(item.model == 2){
			c.translate(-0.75, -0.25)
			c.scale(1.5, 1.5)
			item.render(c, 2)
		}
	}
}
export function renderItemCount(c, item){
	if(!item) return
	if(item.count == 1) return
	const count = (item.count !== (item.count & 255) ? '\\+9' : '') + item.count
	const width = measureWidth(count)*.5
	drawText(c, count, 5/6-width, 0, 0.5)
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

const pingIcons = [0,1,2,3,4].map(i => icons.crop(0,16+i*8,10,7))
const tabMenuBg = vec4(0, 0, 0, .25), tabMenuEntryBg = vec4(.1, .1, .1, 0)
drawLayer('ui', 999, (ctx, w, h) => {
	if(!buttons.has(KEYS.TAB)) return
	const columns = Math.max(1, Math.floor((w - 60) / 82))
	w = w/2-25; ctx.translate(w+25, h-39)
	for(const line of server.title.split('\n')){
		ctx.textAlign = 'center'
		ctx.drawRect(-w, -18, w*2, 32, tabMenuBg)
		drawText(ctx, line, -measureWidth(line)*6, -3, 12)
	}
	ctx.translate(0, -17)
	const playerCount = server.players.length
	const lastRow = playerCount-playerCount%columns
	let i = 0
	for(const {name, skin, health, ping} of server.players){
		const x = ((i % columns) * 2 - columns + (i>=lastRow?lastRow-playerCount+columns:0)) * 41 - 1
		if(!(i%columns)){
			ctx.translate(0, -10)
			ctx.drawRect(-w, -1, w*2, 10, tabMenuBg)
		}
		i++
		ctx.drawRect(x+8, 0, 72, 8, tabMenuEntryBg)
		ctx.drawRect(x, 0, 8, 8, skin)
		drawText(ctx, name, x+9, 1, 6)
		ctx.drawRect(x+70, 0, 10, 7, pingIcons[ping < 25 ? 0 : ping < 60 ? 1 : ping < 300 ? 2 : ping < 1000 ? 3 : 4])
	}
	ctx.drawRect(-w, -13, w*2, 12, tabMenuBg)
	ctx.translate(0, -20)
	for(const line of server.sub.split('\n')){
		ctx.drawRect(-w, -3, w*2, 10, tabMenuBg)
		drawText(ctx, line, -measureWidth(line)*4, 0, 8)
		ctx.translate(0, -10)
	}
})