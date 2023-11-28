import { uiButtons, icons, renderItem, renderItemCount, click, renderSlot, renderTooltip, resetSlot, slotI, audioSet } from './effects.js'
import "./entities.js"
import { button, W2, H2, uiLayer, renderLayer, onpause, pause, paused, renderUI, customPause, quit, onpacket, send } from 'api'
import { getblock, gridEvents, sound, entityMap, pointer, cam, world, configLoaded } from 'world'
import { Item, BlockParticle, blockBreak } from 'definitions'
import { AshParticle, BlastParticle, explode } from './defs.js'
import { terrainPng } from './blocks.js'
import { ephemeralInterfaces } from '../iframe/definitions.js'
import "./interfaces.js"
import "./voice.js"
const { Texture } = loader(import.meta)

const BREAKING = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].mmap(x => terrainPng.at(x, 15))
const skyPng = Texture('sky.png')
const stars = Texture('stars.png')
const sun = skyPng.crop(128, 64, 32, 32), moons = [
	skyPng.crop(128, 0, 32, 32),
	skyPng.crop(160, 0, 32, 32),
	skyPng.crop(192, 0, 32, 32),
	skyPng.crop(224, 0, 32, 32),
	skyPng.crop(128, 32, 32, 32),
	skyPng.crop(160, 32, 32, 32),
	skyPng.crop(192, 32, 32, 32),
	skyPng.crop(224, 32, 32, 32)
], cloudMap = skyPng.crop(128, 127, 128, 1)
const endSky = skyPng.crop(128,128,128,128)
const rain = skyPng.crop(0, 0, 64, 256)

const gradients = Can(0, 0)
function makeGradients(h){
	gradients.resize(5, h)
	gradients.defaultTransform()

	let gradient = gradients.createLinearGradient(0, 0, 0, h)
	gradient.addColorStop(0.3, '#0a0c14')
	gradient.addColorStop(0.7, '#040609')
	gradients.fillStyle = gradient
	gradients.fillRect(0, 0, 1, h)

	gradient = gradients.createLinearGradient(0, 0, 0, h)
	gradient.addColorStop(0.3, '#c3d2ff')
	gradient.addColorStop(0.7, '#78a7ff')
	gradients.fillStyle = gradient
	gradients.fillRect(1, 0, 1, h)

	gradient = gradients.createLinearGradient(0, 0, 0, h)
	gradient.addColorStop(0.3, '#c5563b')
	gradient.addColorStop(0.7, 'transparent')
	gradients.fillStyle = gradient
	gradients.fillRect(2, 0, 1, h)

	gradient = gradients.createLinearGradient(0, 0, 0, h)
	gradient.addColorStop(0.3, '#586493')
	gradient.addColorStop(0.7, '#63718b')
	gradients.fillStyle = gradient
	gradients.fillRect(3, 0, 1, h)

	gradient = gradients.createLinearGradient(0, 0, 0, h)
	gradient.addColorStop(0.3, '#2b3046')
	gradient.addColorStop(0.7, '#2c2e35')
	gradients.fillStyle = gradient
	gradients.fillRect(4, 0, 1, h)
}
const rainSound = audioSet('misc/rain', 4)
let lastRainPlay = 0
setInterval(() => {
	if(world.weather && t - lastRainPlay > 0.8333333) lastRainPlay = t, me.sound(rainSound, 0.5)
})

uiLayer(-100, (c, w, h) => {
	if(gradients.h != h) makeGradients(h)
	if(world.id == 'overworld'){
		const rainyness = min(world.weather&&(1-world.weatherFade/40), 1, (world.weather&0x0FFFFFFF)/40)
		const reach = pointer.effectiveReach()
		const time = world.tick % 24000
		const light = time < 1800 ? time / 1800 : time < 13800 ? 1 : time < 15600 ? (15600 - time) / 1800 : 0
		let orangeness = 0
		if(time < 1800) orangeness = 1 - abs(time - 900)/900
		else if(time >= 13800 && time < 15600) orangeness = 1 - abs(time - 14700)/900
		const wspan = w + 64 + reach/2
		if(light < 1 && rainyness < 1){
			c.image(gradients, 0, 0, w, h, 0, 0, 1, h)
			c.rect(0, 0, w, h)
			const xo = wspan * ((time + 12600) % 24000 / 8400 - .5) - 20 - reach/4 - ifloat(cam.x-me.x)*cam.z/16
			const yo = h/2 + 6 + h/3 * sin(((time + 12600) % 24000 / 8400 - .5) * PI) - ifloat(cam.y-me.y)*cam.z/16
			c.translate(xo, yo)
			c.globalAlpha = 1-rainyness
			c.fillPattern(stars)
			c.fill()
			c.translate(-xo, -yo)
		}
		c.globalAlpha = light
		if(light && rainyness < 1) c.image(gradients, 0, 0, w, h, 1, 0, 1, h)
		if(world.weather > 0x10000000){
			c.globalAlpha = light
			if(c.globalAlpha) c.image(gradients, 0, 0, w, h, 3, 0, 1, h)
			c.globalAlpha = min(light, rainyness)
			if(c.globalAlpha) c.image(gradients, 0, 0, w, h, 4, 0, 1, h)
		}else{
			c.globalAlpha = min(light, rainyness)
			if(c.globalAlpha) c.image(gradients, 0, 0, w, h, 3, 0, 1, h)
		}

		c.globalAlpha = orangeness
		if(orangeness) c.image(gradients, 0, 0, w, h, 2, 0, 1, h)

		c.globalAlpha = 1
		c.globalCompositeOperation = 'lighter'
		c.globalAlpha = 1 - rainyness
		if(time < 15600){
			const progress = time / 15600
			c.image(sun, wspan * progress - 64 - reach/4 - ifloat(cam.x-me.x)*cam.z/16, h/2 - 32 + h/3 * sin(progress * PI) - ifloat(cam.y-me.y)*cam.z/16, 64, 64)
		}else{
			const progress = (time - 15600) / 8400
			c.image(moons[world.tick / 24000 & 7], wspan * progress - 64 - reach/4 - ifloat(cam.x-me.x)*cam.z/16, h/2 - 32 + h/3 * sin(progress * PI) - ifloat(cam.y-me.y)*cam.z/16, 64, 64)
		}
		c.globalCompositeOperation = 'source-over'
		c.globalAlpha = 1
	}else if(world.id == 'nether'){
		c.fillStyle = '#190404'
		c.fillRect(0, 0, w, h)
	}else if(world.id == 'end'){
		c.globalAlpha = 0.15
		c.fillPattern(endSky)
		c.fillRect(0, 0, w, h)
		c.globalAlpha = 1
	}
})
renderLayer(500, (c, w, h) => {
	if(world.id == 'nether'){
		c.fillStyle = '#40000033'
		c.fillRect(-W2, -H2, W2*2, H2*2)
		return
	}
})

const cloudLayers = [
	{y: 64, h: 4, s: 1, o: 'soft-light', a: 1},
	{y: 128, h: 6, s: -0.5, o: 'soft-light', a: 1},
	{y: 256, h: 2, s: 4, o: 'hard-light', a: 0.5},
	{y: 512, h: 7, s: -2, o: 'hard-light', a: 0.4},
	{y: 1024, h: 3, s: 0.5, o: 'soft-light', a: 0.5},
	{y: 2048, h: 1, s: -4, o: 'soft-light', a: 0.6},
	{y: 4096, h: 5, s: 2, o: 'hard-light', a: 0.5},
	{y: 8192, h: 8, s: -1, o: 'hard-light', a: 0.7},
	{y: 69420, h: 21, s: 8, o: 'soft-light', a: 1},
]

renderLayer(150, c => {
	if(world.id != 'overworld') return
	for(const {y, h, s, o, a} of cloudLayers){
		c.globalCompositeOperation = o
		c.globalAlpha = a
		c.beginPath()
		c.rect(-W2, (y - cam.y) * 0.7, W2 * 2, h)
		const x = (t * s - cam.x) % (384 * h)
		c.translate(x, 0)
		c.scale(h * 3, h * 3)
		c.fillPattern(cloudMap)
		c.fill()
		c.scale(1 / (h * 3), 1 / (h * 3))
		c.translate(-x, 0)
	}
	c.globalCompositeOperation = 'source-over'
	const rainyness = min(1-world.weatherFade/40, 1, (world.weather&0x0FFFFFFF)/40)
	if(rainyness && cam.z > .125){
		c.globalAlpha = rainyness/2
		c.fillPattern(rain)
		rain.setPatternTransform(.0625, 0, 0, .0625, 0, t*30%16)
		const end = iceil(cam.x+W2)
		for(let x = ifloor(cam.x-W2); x != end; x=x+1|0){
			const off = ifloat(x-cam.x)%4 + ((x ^ x>>2 ^ x>>4 ^ x>>6) & 3)
			let off2 = imul(x, 0x13F255A7) >> 16
			off2 = ((off2 ^ off2 >> 2 ^ off2 >> 4 ^ off2 >> 6) & 3) << 2
			c.beginPath()
			c.rect(ifloat(x-cam.x), -H2, 1, H2*2)
			c.closePath()
			c.translate(off, off2)
			c.fill()
			c.translate(-off, -off2)
		}
	}
	c.globalAlpha = 1
})

const hotbar = Texture('hotbar.png')
const selected = Texture('slot.png')
const inventory = Texture('inv.png')

const heart = icons.crop(52,0,9,9), halfHeart = icons.crop(61,0,9,9)
const heartEmpty = icons.crop(16,0,9,9)

const btnW = uiButtons.large.w

let respawnClicked = false
let hotbarTooltipAlpha = 0, lastSelected = -1
let proximityChatTooltip = 0
configLoaded(CONFIG => proximityChatTooltip = CONFIG.proximitychat ? 10 : 0)
uiLayer(1000, (c, w, h) => {
	if(renderUI){
		let hotBarLeft = w / 2 - hotbar.w/2
		c.push()
		c.translate(hotBarLeft, 5)
		c.image(hotbar, 0, 0, hotbar.w, hotbar.h)
		c.translate(11, 3)
		c.scale(16, 16)
		for(let i = 0; i < 9; i++){
			renderItem(c, me.inv[i])
			renderItemCount(c, me.inv[i])
			if(i == me.selected) c.image(selected, -0.75, -0.25, 1.5, 1.5)
			c.translate(1.25, 0)
		}
		c.peek()
		c.translate(hotBarLeft, hotbar.h + 6)
		const wiggle = me.health < 5 ? (t*24&2)-1 : 0
		for(let h = 0; h < 20; h+=2){
			const x = h*4, y = (wiggle * ((h&2)-1) + 1) / 2
			c.image(heartEmpty,x,y,9,9)
			if(me.health>h+1) c.image(heart,x,y,9,9)
			else if(me.health>h) c.image(halfHeart,x,y,9,9)
		}
		c.pop()
		c.textAlign = 'center'; c.textBaseline = 'middle'
		if(lastSelected != me.selected) lastSelected = me.selected, hotbarTooltipAlpha = 5
		if(hotbarTooltipAlpha > 0){
			c.globalAlpha = min(1, max(0, hotbarTooltipAlpha))
			hotbarTooltipAlpha -= dt*2
			const item = me.inv[me.selected]
			if(item) c.styledText(item.name ? 79 : 15, item.name || item.defaultName, hotBarLeft + hotbar.w / 2, hotbar.h + 24, 10)
			c.globalAlpha = 1
		}
		if(proximityChatTooltip > 0){
			c.globalAlpha = min(1, proximityChatTooltip/3)
			proximityChatTooltip -= dt
			c.textAlign = 'left'
			c.textBaseline = 'alphabetic'
			c.fillStyle = '#800'
			c.fillText('Press Enter to talk with proximity chat', 6, 4, 10)
			c.fillStyle = '#f00'
			c.shadowBlur = 10
			c.shadowColor = '#000'
			c.fillText('Press Enter to talk with proximity chat', 5, 5, 10)
			c.globalAlpha = 1
		}
	}
	if(me.state&0x8000){
		const h3 = h / 3
		c.fillStyle = '#f003'
		c.fillRect(0, 0, w, h)
		c.textAlign = 'center'
		c.textBaseline = 'alphabetic'
		c.fillStyle = '#333'
		c.fillText('You died!', w / 2 + 4, h3*2 - 4, 40)
		c.fillStyle = '#fff'
		c.fillText('You died!', w / 2, h3*2, 40)
		const {x: mx, y: my} = c.mouse()
		const selectedBtn = mx >= (w - btnW) / 2 && mx < (w + btnW) / 2 ?
			my >= h3 && my < h3 + 20 ? 1
			: my >= h3 - 30 && my < h3 - 10 ? -1
			: 0
		: 0
		if(!respawnClicked){
			customPause()
			c.image(uiButtons.large, (w - btnW) / 2, h3)
			c.fillStyle = '#333'
			c.fillText('Respawn', w / 2 + 1, h3 + 6, 10)
			c.fillStyle = selectedBtn == 1 ? '#fff' : '#999'
			c.fillText('Respawn', w / 2, h3 + 7, 10)

			c.image(uiButtons.large, (w - btnW) / 2, h3 - 30)
			c.fillStyle = '#333'
			c.fillText('Rage quit', w / 2 + 1, h3 - 24, 10)
			c.fillStyle = selectedBtn == -1 ? '#fff' : '#999'
			c.fillText('Rage quit', w / 2, h3 - 23, 10)
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
			c.fillStyle = '#333'
			c.fillText('Hang on...', w / 2 + 1, h3 - 1, 10)
			c.fillStyle = '#fff'
			c.fillText('Hang on...', w / 2, h3, 10)
		}
		return
	}else respawnClicked = false

	const action = invAction
	invAction = 0
	if(!invInterface) return
	resetSlot()
	c.fillStyle = '#000'
	c.globalAlpha = 0.2
	c.fillRect(0, 0, w, h)
	c.globalAlpha = 1
	c.translate(w / 2 - 88, h / 2)
	c.push()
	c.image(inventory, 0, -inventory.h)
	c.translate(16,8 - inventory.h)
	c.scale(16,16)
	for(let i = 0; i < 9; i++){
		renderSlot(c, me, i)
		c.translate(1.125,0)
	}
	c.translate(-10.125, 1.375)
	for(let i = 9; i < 36; i++){
		renderSlot(c, me, i)
		if(i % 9 == 8) c.translate(-9, 1.125)
		else c.translate(1.125,0)
	}
	c.peek()
	invInterface.drawInterface?.(interfaceId, c)
	let slot = slotI
	if(action == 1 && slot > -1){
		const int = slot > 127 ? invInterface : me, id = slot > 127 ? interfaceId : 0
		const t = int.getItem(id, slot&127), h = me.getItem(0, 36)
		if(t && !h) int.setItem(id, slot&127, null) || me.setItem(0, 36, t, true)
		else if(h && !t) int.setItem(id, slot&127, h) || me.setItem(0, 36, null, true)
		else if(h && t && h.constructor == t.constructor && !h.savedata){
			const add = min(h.count, t.maxStack - t.count)
			if(!(h.count -= add)) me.setItem(0, 36, null, true)
			t.count += add
		}else int.setItem(id, slot&127, h) || me.setItem(0, 36, t, true)
		const buf = new DataWriter()
		buf.byte(32); buf.byte(slot)
		send(buf)
	}else if(action == 2 && slot > -1){
		const int = slot > 127 ? invInterface : me, id = slot > 127 ? interfaceId : 0
		const t = int.getItem(id, slot&127), h = me.getItem(0, 36)
		if(t && !h){
			me.setItem(0, 36, new t.constructor(t.count - (t.count >>= 1)), true)
			if(!t.count) int.setItem(id, slot&127, null, true)
		}else if(h && !t){
			if(!int.setItem(id, slot&127, new h.constructor(1))){
				if(!--h.count) me.setItem(0, 36, null, true)
			}
		}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
			t.count++
			if(!--h.count) me.setItem(0, 36, null, true)
		}else int.setItem(id, slot&127, h) || me.setItem(0, 36, t, true)
		const buf = new DataWriter()
		buf.byte(33); buf.byte(slot)
		send(buf)
	}
	c.peek()
	c.scale(16,16)
	const {x, y} = c.mouse()
	c.translate(x, y - .5)
	renderItem(c, me.inv[36])
	renderItemCount(c, me.inv[36])

	c.peek()
	if(!me.inv[36]) renderTooltip(c, me)

	c.pop()
})


let invInterface = null, interfaceId = 0
let invAction = 0
button(LBUTTON, () => {invAction = 1})
button(RBUTTON, () => {invAction = 2})
button(MBUTTON, () => {invAction = 3})

onpause(() => {
	if(!paused && invInterface){
		const buf = new DataWriter()
		buf.byte(15)
		send(buf)
	}
})

function openInventory(){
	const buf = new DataWriter()
	buf.byte(13)
	send(buf)
}
function closeInterface(){ pause(false) }

onpacket(12, buf => {
	const kind = buf.short()
	invInterface = new ephemeralInterfaces[kind]()
	interfaceId = buf.byte()
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
			e.setItem?.(id, i, itm, true)
		}
	}
})

button(KEYS.E, GAMEPAD.X, () => {
	if(paused) return closeInterface()
	openInventory()
})

button(KEYS.Q, GAMEPAD.Y, GAMEPAD.DOWN, () => {
	const buf = new DataWriter()
	buf.byte(34)
	send(buf)
})

gridEvents[4] = (buf, x, y) => {
	let time = 0
	const toBreak = buf.float() / TPS
	let lastParticle = t
	return c => {
		if(!toBreak) return
		const block = getblock(x, y)
		if(t - lastParticle > .1) new BlockParticle(block, floor(random() * 16), x, y), lastParticle = t
		
		if(toBreak == Infinity) return
		c.save()
			c.globalCompositeOperation = 'multiply'
			block.trace(c)
			c.clip()
			c.image(BREAKING[min(9, floor(time / toBreak * 10)) || 0], 0, 0, 1, 1)
		c.restore()
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
	for(let i = 0; i < 15; i++) new BlastParticle(x, y)
	for(let i = 0; i < 30; i++) new AshParticle(x, y)
}

gridEvents[10] = (_, x, y) => {
	x += .5; y += .5
	//for(let i = 0; i < 10; i++) new AshParticle(x, y)
}