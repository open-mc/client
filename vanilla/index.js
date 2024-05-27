import { uiButtons, icons, renderItem, renderItemCount, click, renderSlot, renderTooltip, resetSlot, slotI, audioSet } from './effects.js'
import './entities.js'
import { onKey, drawLayer, pause, renderUI, quit, onpacket, send, voice, drawText, calcText } from 'api'
import { getblock, gridEvents, sound, entityMap, pointer, cam, world, configLoaded, me, W2, H2 } from 'world'
import { Item, BlockParticle, addParticle, blockBreak, ephemeralInterfaces } from 'definitions'
import { AshParticle, BlastParticle, explode } from './defs.js'
import { terrainPng } from './blocks.js'
import './interfaces.js'
import './voice.js'

const src = loader(import.meta)

const BREAKING = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].mmap(x => terrainPng.sub(x/16, 0, 1/16, 1/16))
const skyPng = await Img(src`sky.png`)
const stars = Img(src`stars.png`, REPEAT)
const sun = skyPng.crop(128, 64, 32, 32), moons = [
	skyPng.crop(128, 0, 32, 32),
	skyPng.crop(160, 0, 32, 32),
	skyPng.crop(192, 0, 32, 32),
	skyPng.crop(224, 0, 32, 32),
	skyPng.crop(128, 32, 32, 32),
	skyPng.crop(160, 32, 32, 32),
	skyPng.crop(192, 32, 32, 32),
	skyPng.crop(224, 32, 32, 32)
]
const cloudMap = Texture(128, 1, 1, REPEAT_X).paste(skyPng, 0, 0, 0, 128, 128, 0, 128, 1, 1)
const endSky = Texture(128, 128, 1, REPEAT).paste(skyPng, 0, 0, 0, 128, 0, 0, 128, 128, 1)
const rain = Texture(64, 256, 1, REPEAT_Y).paste(skyPng, 0, 0, 0, 0, 0, 0, 64, 256, 1)
const gradients = Texture(5, 2, 1, SMOOTH)
gradients.pasteData(Uint8Array.fromHex(`
0a0c14ff c3d2ffff c5563bff 586493ff 2b3046ff
040609ff 78a7ffff 00000000 63718bff 2c2e35ff
`))
const nightGradient = gradients.sub(.1, .25, 0, .5)
const dayGradient = gradients.sub(.3, .25, 0, .5)
const sunsetGradient = gradients.sub(.5, .25, 0, .5)
const rainGradient = gradients.sub(.7, .25, 0, .5)
const rainNightGradient = gradients.sub(.9, .25, 0, .5)

const rainSound = audioSet('misc/rain', 4)
let lastRainPlay = 0
drawLayer('none', -100, c => {
	const w = c.width/pixelRatio, h = c.height/pixelRatio
	if(world.weather && t - lastRainPlay > 0.8333333) lastRainPlay = t, me.sound(rainSound, 0.5)
	if(world.id == 'overworld'){
		const rainyness = min(world.weather&&(1-world.weatherFade/40), 1, (world.weather&0x0FFFFFFF)/40)
		const reach = pointer.effectiveReach()
		const time = world.tick % 24000
		const light = time < 1800 ? time / 1800 : time < 13800 ? 1 : time < 15600 ? (15600 - time) / 1800 : 0
		const orangeness = 1 - abs(time < 1800 ? time - 900 : time >= 13800 && time < 15600 ? time - 14700 : 900)/900
		const wspan = w + 128 + reach/2
		const effx = ifloat(cam.x-me.x)*cam.z/4*pixelRatio, effy = ifloat(cam.y-me.y)*cam.z/4*pixelRatio
		if(light < 1 && rainyness < 1){
			c.draw(nightGradient)
			const fac = ((time + 12600) % 24000 / 8400 - .5)
			const xo = wspan * fac - 50 - reach/4 - effx
			const yo = h/2 - 30 - h/3 * sin(fac * PI) + effy
			c.draw(stars.crop(-xo/2, -yo/2, w/2, h/2), vec4(rainyness))
		}
		if(light && rainyness < 1) c.draw(dayGradient, vec4(1-light))
		const a = min(light, rainyness)
		if(world.weather > 0x10000000){
			if(light) c.draw(rainGradient, vec4(1-light))
			if(a) c.draw(rainNightGradient, vec4(1-a))
		}else if(a) c.draw(rainGradient, vec4(1-a))

		if(orangeness) c.draw(sunsetGradient, vec4(1-orangeness))

		c.blend = Blend.ADD
		
		c.scale(1/w, 1/h)
		if(time < 15600){
			const progress = time / 15600
			c.drawRect(wspan * progress - 128 - reach/4 - effx, h/2 - 32 + h/3 * sin(progress * PI) - effy, 128, 128, sun, vec4(rainyness))
		}else{
			const progress = (time - 15600) / 8400
			c.drawRect(wspan * progress - 128 - reach/4 - effx, h/2 - 32 + h/3 * sin(progress * PI) - effy, 128, 128, moons[world.tick / 24000 & 7], vec4(rainyness))
		}
		c.blend = 0
	}else if(world.id == 'nether'){
		c.draw(vec4(0.1, .015, .015, 1))
	}else if(world.id == 'end'){
		c.draw(endSky.sub(0, 0, w/64, h/64), vec4(.75, .75, .75, 0))
	}
})
drawLayer('none', 500, (c, w, h) => {
	if(world.id == 'nether'){
		c.draw(vec4(.05, 0, 0, .2))
		return
	}
})

const cloudLayers = [
	{y: 64, h: 4, s: 1, a: 1},
	{y: 128, h: 6, s: -0.5, a: 1},
	{y: 256, h: 2, s: 4, a: 0.5},
	{y: 512, h: 7, s: -2, a: 0.4},
	{y: 1024, h: 3, s: 0.5, a: 0.5},
	{y: 2048, h: 1, s: -4, a: 0.6},
	{y: 4096, h: 5, s: 2, a: 0.5},
	{y: 8192, h: 8, s: -1, a: 0.7},
	{y: 69420, h: 21, s: 8, a: 1},
]
const cloudBlend = Blend(ONE, ADD, ONE_MINUS_SRC_ALPHA)
drawLayer('world', 150, c => {
	if(world.id != 'overworld') return
	c.blend = cloudBlend
	for(const {y, h, s, a} of cloudLayers){
		const x = (t * s - cam.x) % (h*128)
		c.drawRect(-W2, (y - cam.y) * 0.7, W2 * 2, h, cloudMap.super(.5+x/(W2*2), 0, 192/W2*h, 0), vec4(1-a*.75))
	}
	c.blend = 0
	const rainyness = min(1-world.weatherFade/40, 1, (world.weather&0x0FFFFFFF)/40)
	if(rainyness && cam.z > .125){
		const col = vec4(1-rainyness/2)
		const end = iceil(cam.x+W2)
		const rainOff = t*30%16
		for(let x = ifloor(cam.x-W2); x != end; x=x+1|0){
			const off = ((x ^ x>>2 ^ x>>4 ^ x>>6) & 3)
			let off2 = imul(x, 0x13F255A7) >> 16
			off2 = ((off2 ^ off2 >> 2 ^ off2 >> 4 ^ off2 >> 6) & 3) << 2
			c.drawRect(ifloat(x-cam.x), -H2, 1, H2*2, rain.sub(off/4,(rainOff+off2)/16,.25,H2/8), col)
		}
	}
})

const hotbar = Img(src`hotbar.png`)
const selected = Img(src`slot.png`)
const inventory = Img(src`inv.png`)

const heart = icons.crop(52,0,9,9), halfHeart = icons.crop(61,0,9,9)
const heartEmpty = icons.crop(16,0,9,9)

const btnW = uiButtons.large.width*uiButtons.large.w

let respawnClicked = false
let hotbarTooltipAlpha = 0, lastSelected = -1
let proximityChatTooltip = 0
configLoaded(CONFIG => proximityChatTooltip = CONFIG.proximitychat ? 10 : 0)
drawLayer('ui', 1000, (c, w, h) => {
	const c2 = c.sub()
	if(renderUI){
		let hotBarLeft = w / 2 - hotbar.width/2
		c2.translate(hotBarLeft, 5)
		c2.drawRect(0, 0, hotbar.width, hotbar.height, hotbar)
		c2.translate(11, 3)
		c2.scale(16, 16)
		for(let i = 0; i < 9; i++){
			renderItem(c2, me.inv[i])
			renderItemCount(c2, me.inv[i])
			if(i == me.selected) c2.drawRect(-0.75, -0.25, 1.5, 1.5, selected)
			c2.translate(1.25, 0)
		}
		if(me.mode < 1){
			c2.resetTo(c)
			c2.translate(hotBarLeft, hotbar.height + 6)
			const wiggle = me.health < 5 ? (t*24&2)-1 : 0
			for(let h = 0; h < 20; h+=2){
				const x = h*4, y = (wiggle * ((h&2)-1) + 1) / 2
				c2.drawRect(x,y,9,9, heartEmpty)
				if(me.health>h+1) c2.drawRect(x,y,9,9,heart)
				else if(me.health>h) c2.drawRect(x,y,9,9,halfHeart)
			}
		}
		c2.resetTo(c)
		if(lastSelected != me.selected) lastSelected = me.selected, hotbarTooltipAlpha = 5
		a: if(hotbarTooltipAlpha > 0){
			hotbarTooltipAlpha -= dt*2
			const item = me.inv[me.selected]
			if(!item) break a
			const name = item.name || item.defaultName
			const arr = calcText(name, _, item.name ? 79 : 15)
			drawText(c2, arr, hotBarLeft + hotbar.width / 2 - arr.width*4, hotbar.height + 24, 8, min(1, max(0, hotbarTooltipAlpha)))
		}
		if(voice.active) proximityChatTooltip = 0
		if(proximityChatTooltip > 0){
			proximityChatTooltip -= dt
			drawText(c2, [265, 'Press Enter to talk with proximity chat'], 5, 5, 8, min(1, proximityChatTooltip/5))
		}
	}
	if(me.health <= 0){
		const h3 = h / 3
		c2.drawRect(0, 0, w, h, vec4(.2, 0, 0, .2))
		const arr = calcText('You died!')
		drawText(c2, arr, w / 2 - arr.width*16, h3*2, 32)
		const {x: mx, y: my} = c2.from(cursor)
		const selectedBtn = mx >= (w - btnW) / 2 && mx < (w + btnW) / 2 ?
			my >= h3 && my < h3 + 20 ? 1
			: my >= h3 - 30 && my < h3 - 10 ? -1
			: 0
		: 0
		if(!respawnClicked){
			pause()
			c2.drawRect((w - btnW) / 2, h3, btnW, 20, selectedBtn == 1 ? uiButtons.largeSelected : uiButtons.large)
			let arr = calcText('Respawn')
			drawText(c2, arr, w / 2 - arr.width*4, h3 + 7, 8)
			
			c2.drawRect((w - btnW) / 2, h3 - 30, btnW, 20, selectedBtn == -1 ? uiButtons.largeSelected : uiButtons.large)
			arr = calcText('Rage quit')
			drawText(c2, arr, w / 2 - arr.width*4, h3 - 23, 8)
			if((changed.has(LBUTTON) && !buttons.has(LBUTTON) && selectedBtn == 1) || (changed.has(GAMEPAD.A) && !buttons.has(GAMEPAD.A) && selectedBtn == 1)){
				click()
				respawnClicked = true
				const buf = new DataWriter()
				buf.byte(5)
				send(buf)
				pause(false)
			}else if((changed.has(LBUTTON) && !buttons.has(LBUTTON) && selectedBtn == -1) || (changed.has(GAMEPAD.MENU) && !buttons.has(GAMEPAD.MENU) && selectedBtn == -1)){
				respawnClicked = true
				quit()
			}
		}else{
			const arr = calcText('Hang on...')
			drawText(c2, arr, w / 2 - arr.width*4, h3, 8)
		}
		return
	}else respawnClicked = false

	const action = invAction
	invAction = 0
	if(!invInterface) return
	pause()
	resetSlot()
	c2.drawRect(0, 0, w, h, vec4(0, 0, 0, .4))
	c2.translate(w / 2, h / 2)
	invInterface.drawInterface?.(interfaceId, c2, (x, y) => {
		const c3 = c2.sub()
		c3.translate(x, y)
		const invH = inventory.height*inventory.h
		c3.drawRect(-88, -invH, 176, invH, inventory)
		c3.translate(-72, 8 - invH)
		c3.scale(16,16)
		for(let i = 0; i < 9; i++){
			renderSlot(c3, me, i)
			c3.translate(1.125,0)
		}
		c3.translate(-10.125, 1.375)
		for(let i = 9; i < 36; i++){
			renderSlot(c3, me, i)
			if(i % 9 == 8) c3.translate(-9, 1.125)
			else c3.translate(1.125,0)
		}
	}, w/2, h/2)
	c2.resetTo(c)
	if(action == 1 && slotI > -1){
		const int = slotI > 127 ? invInterface : me, id = slotI > 127 ? interfaceId : 0
		const r = int.slotClicked(id, slotI&127, me.getItem(2, 0), me)
		if(r !== undefined){
			me.setItem(2, 0, r)
			const buf = new DataWriter()
			buf.byte(32); buf.byte(slotI)
			send(buf)
		}
	}else if(action == 2 && slotI > -1){
		const int = slotI > 127 ? invInterface : me, id = slotI > 127 ? interfaceId : 0
		const r = int.slotAltClicked(id, slotI&127, me.getItem(2, 0), me)
		if(r !== undefined){
			me.setItem(2, 0, r)
			const buf = new DataWriter()
			buf.byte(33); buf.byte(slotI)
			send(buf)
		}
	}
	c2.scale(16,16)
	const {x, y} = c2.from(cursor)
	c2.translate(x, y - .5)
	renderItem(c2, me.inv[36])
	renderItemCount(c2, me.inv[36])
	c2.resetTo(c)
	if(!me.inv[36]) renderTooltip(c2, slotI > 127 ? me.items[slotI & 127] : slotI >= 0 ? me.inv[slotI] : null)
})


let invInterface = null, interfaceId = 0
let invAction = 0
onKey(LBUTTON, () => {invAction = 1})
onKey(RBUTTON, () => {invAction = 2})
onKey(MBUTTON, () => {invAction = 3})

function openInventory(){
	const buf = new DataWriter()
	buf.byte(13)
	send(buf)
}
export function closeInterface(){
	const buf = new DataWriter()
	buf.byte(15)
	send(buf)
}

onpacket(12, buf => {
	const kind = buf.short()
	interfaceId = buf.byte()
	invInterface = new ephemeralInterfaces[kind](buf)
	pause(true)
})
onpacket(13, buf => {
	const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
	if(!e) return
	invInterface = e
	interfaceId = buf.byte()
	pause(true)
})
onpacket(14, buf => {
	const b = getblock(buf.int(), buf.int())
	if(!b) return
	invInterface = b
	interfaceId = buf.byte()
	pause(true)
})
onpacket(15, () => { invInterface = null })

onpacket(32, buf => {
	let i = buf.byte()
	while(buf.left){
		const e = i&2 ? invInterface : i&1 ? getblock(buf.int(), buf.int()) : entityMap.get(buf.uint32() + buf.short() * 4294967296)
		const id = buf.byte()
		while(buf.left&&(i=buf.byte())<128){
			const itm = Item.decode(buf)
			e.setItem?.(id, i, itm)
		}
	}
})

onKey(KEYS.E, GAMEPAD.X, () => {
	if(invInterface) return closeInterface()
	openInventory()
})

onKey(KEYS.Q, GAMEPAD.Y, GAMEPAD.DOWN, () => {
	const buf = new DataWriter()
	buf.byte(34)
	send(buf)
})
const addMultBlend = Blend(DST, ADD, SRC)
gridEvents[4] = (buf, x, y) => {
	let time = 0
	const toBreak = buf.float() / world.tps
	let lastParticle = t
	return c => {
		if(!toBreak) return
		const block = getblock(x, y)
		if(t - lastParticle > .1){
			addParticle(new BlockParticle(block, floor(random() * 16), x, y))
			lastParticle = t
		}
		if(Number.isFinite(toBreak)){
			block.trace(c)
			c.blend = addMultBlend
			c.draw(BREAKING[min(9, floor(time / toBreak * 10)) || 0])
			c.mask = RGBA
			c.blend = 0
		}
		if(floor(time * 5) != floor((time += dt) * 5))
			if(block.punch) block.punch(x, y)
	}
}

gridEvents[1] = (buf, x, y) => {
	const b = getblock(x, y)
	if(b.placeSounds.length)
		sound(b.placeSounds, x, y, 1, 0.8)
}
gridEvents[2] = (buf, x, y) => {
	const b = getblock(x, y)
	if(b.destroyed) return void b.destroyed?.(x, y)
	if(b.placeSounds.length)
		sound(b.placeSounds, x, y, 1, 0.8)
	blockBreak(b, x, y)
}

gridEvents[3] = (_, x, y) => {
	x += .5; y += .5
	sound(explode, x, y)
	for(let i = 0; i < 15; i++) addParticle(new BlastParticle(x, y))
	for(let i = 0; i < 30; i++) addParticle(new AshParticle(x, y))
}

gridEvents[10] = (_, x, y) => {
	x += .5; y += .5
	//for(let i = 0; i < 10; i++) addParticle(new AshParticle(x, y))
}