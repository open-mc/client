const VERSION = 'alpha 2'
import "./lib/prototype.js"
import "./me.js"
import "./lib/incomingPacket.js"
import { terrain, TEX_SIZE } from "./textures.js"
import { position, REACH, x, y } from "./ui/pointer.js"
import { updateKeys } from "./ui/events.js"
import "./controls.js"
import "./expose.js"
import { render, stepEntity } from "./lib/entity.js"
import { serverlist } from "./uis/serverlist.js"
import { ui } from "./ui/ui.js"
import { DataWriter } from "./lib/data.js"
import { options } from "./save.js"
serverlist()
let last = performance.now(), count = 1.1
globalThis.t = Date.now()/1000%86400
setInterval(function(){
	countElu()
	const now = performance.now()
	let update = 1000 / TPS
	let dt = now - last
	elusmooth += (elu / (dt || 1) - elusmooth) / count
	last = now
	elu = 0
	if(me._id < 0)return
	let ticked = 0
	while(dt > update){
		dt -= update
		if(ticked > 10){
			//console.warn('Falling behind (tick dropped)')
		}else tick()
		ticked++
	}
	last -= dt
})

const sendDelay = 1 //send packet every 4 ticks
function tick(){ //20 times a second
	if(dt < 1/20000)dt = 1/20000
	if(ticks % sendDelay == 0 && me._id > -1){
		let buf = new DataWriter()
		buf.byte(4)
		buf.byte(r)
		buf.double(me.x)
		buf.double(me.y)
		buf.short(me.state)
		buf.float(me.dx)
		buf.float(me.dy)
		buf.float(me.f)
		buf.pipe(ws)
	}
	let i = 0
	const mex = Math.floor(me.x) >> 3 & 6, mexi = (floor(me.x) & 15) / 16
	for(const t of `Paper Minecraft ${VERSION}
FPS: ${round(1/dt)}, ELU: ${min(99.9,elusmooth/10*TPS).toFixed(1).padStart(4,"0")}%
Ch: ${map.size}, E: ${entities.size}, N: ${document.all.length}
XY: ${me.x.toFixed(3)} / ${me.y.toFixed(3)}
${Math.floor(me.x) & 63} ${Math.floor(me.y) & 63} in ${Math.floor(me.x) >> 6} ${Math.floor(me.y) >> 6}
Looking at: ${floor(x + me.x)|0} ${floor(y + me.y + me.head)|0}
Facing: ${(me.f >= 0 ? 'R ' : 'L ') + (90 - abs(me.f / PI2 * 360)).toFixed(1).padStart(5, '\u2007')} (${(me.f / PI2 * 360).toFixed(1)})
`.slice(0, -1).split('\n')){
		let node = f3.children[i++]
		if(!node)f3.append(node = document.createElement('div'))
		node.textContent = t
	}
	let n;while(n = f3.children[i])n.remove()
	i = 0
	for(const t of `Tick ${ticks}, Day ${floor((ticks+7000)/24000)}, Time ${Math.floor((ticks/1000+6)%24).toString().padStart(2,'0')}:${(Math.floor((ticks/250)%4)*15).toString().padStart(2,'0')}
Dimension: ${world}
Biome: ${me.chunk ? Math.round(me.chunk.biomes[mex] * (1 - mexi) + me.chunk.biomes[mex+2] * mexi) : 0}/${me.chunk ? Math.round(me.chunk.biomes[mex+1] * (1 - mexi) + me.chunk.biomes[mex+3] * mexi) : 0}
`.slice(0, -1).split('\n')){
		let node = f3r.children[i++]
		if(!node)f3r.append(node = document.createElement('div'))
		node.textContent = t
	}
	while(n = f3r.children[i])n.remove()
	ticks++
}
const physical_chunk_pixels = TEX_SIZE * 64 * devicePixelRatio
let dt = 1 / 60, lastFrame = performance.now(), elusmooth = 0
globalThis.W2 = visualViewport.width / TEX_SIZE / cam.z / 2 + 1
globalThis.H2 = visualViewport.height / TEX_SIZE / cam.z / 2 + 1
globalThis.ZPX = cam.z * TEX_SIZE
let elu = 0
globalThis.requestIdleCallback = globalThis.requestIdleCallback || setTimeout
let eluLast = 0
const eluCb = () => (elu += performance.now() - eluLast, eluLast = 0)
globalThis.countElu = () => eluLast ? 0 : (eluLast = performance.now(), requestIdleCallback(eluCb))
export let zoom_correction = 0
let camMovingX = false, camMovingY = false
const {abs, min, round, floor, PI, ifloat, sign, sin} = Math
const PI2 = PI * 2
const sun = await terrain('/ext/sky.png:128:64:32:32'), moons = await Promise.all([
	terrain('/ext/sky.png:128:0:32:32'),
	terrain('/ext/sky.png:160:0:32:32'),
	terrain('/ext/sky.png:192:0:32:32'),
	terrain('/ext/sky.png:224:0:32:32'),
	terrain('/ext/sky.png:128:32:32:32'),
	terrain('/ext/sky.png:160:32:32:32'),
	terrain('/ext/sky.png:192:32:32:32'),
	terrain('/ext/sky.png:224:32:32:32')
]), cloudMap = await terrain('/ext/sky.png:128:127:128:1')
requestAnimationFrame(function frame(){
	countElu()
	
	const now = performance.now()
	dt += ((now - lastFrame) / 1000 - dt) / (count = min(count ** 1.03, 60))
	if(dt > .3)count = 1.1
	globalThis.t += (now - lastFrame) / 1000 * options.speed
	lastFrame = now
	requestAnimationFrame(frame)
	if(me._id < 0)return
	for(const entity of entities.values())stepEntity(entity, dt * options.speed)
	const reach = min(10, (min(W2, H2) - 1) * 1.5)
	W2 = visualViewport.width / TEX_SIZE / cam.z / 2
	H2 = visualViewport.height / TEX_SIZE / cam.z / 2
	if(options.camera == 0){
		const dx = ifloat(me.x + x/2 - cam.x), dy = ifloat(me.y + y/2 + me.head - cam.y)
		if(abs(dx) > 64)cam.x += dx
		else{
			if(!camMovingX && abs(dx) > reach / 2)camMovingX = true
			else if(camMovingX && abs(dx) < reach / 4)camMovingX = false
			if(camMovingX)cam.x = ifloat(cam.x + (dx - sign(dx)*(reach/4+0.25)) * dt * 4)
		}
		if(abs(dy) > 64)cam.y += dy
		else{
			if(!camMovingY && abs(dy) > reach / 2)camMovingY = true
			else if(camMovingY && abs(dy) < reach / 4)camMovingY = false
			if(camMovingY)cam.y = ifloat(cam.y + (dy - sign(dy)*(reach/4+0.25)) * dt * 7)
		}
	}else if(options.camera == 1){
		cam.x = me.x + x
		cam.y = me.y + me.head + y
	}else if(options.camera == 2){
		cam.x = me.x
		cam.y = me.y + me.head / 2
	}else if(options.camera == 3){
		if(me.x > cam.x + W2)cam.x += W2*2
		if(me.x < cam.x - W2)cam.x -= W2*2
		if(me.y > cam.y + H2)cam.y += H2*2
		if(me.y < cam.y - H2)cam.y -= H2*2
	}
	zoom_correction = round(physical_chunk_pixels * cam.z) / physical_chunk_pixels
	ZPX = zoom_correction * TEX_SIZE
	document.body.style.setProperty('--z', zoom_correction)
	document.body.style.setProperty('--texsize', TEX_SIZE + 'px')
	const time = ticks % 24000
	const light = time < 1800 ? time / 1800 : time < 13800 ? 1 : time < 15600 ? (15600 - time) / 1800 : 0
	let orangeness = 0
	if(time < 1800)orangeness = 1 - abs(time - 900)/900
	else if(time >= 13800 && time < 15600)orangeness = 1 - abs(time - 14700)/900
	const wspan = innerWidth + 128 + reach
	chunks.style.background = `linear-gradient(transparent 30%, rgba(197,86,59,${orangeness}) 70%), linear-gradient(rgba(120,167,255,${light}) 30%, rgba(195,210,360,${light}) 70%), url(/ext/stars.png) ${wspan * ((time + 12600) % 24000 / 8400 - .5) - 32 - reach/2 - x/2}px ${-160 - innerHeight / 4 * sin(((time + 12600) % 24000 / 8400 - .5) * PI) + y/2}px/512px, linear-gradient(rgb(4,6,9) 30%, rgb(10,12,20) 70%)`
	
	if(time < 15600){
		celestialBody.src = sun.src
		const progress = time / 15600
		celestialBody.style.transform = `translate(${wspan * progress - 128 - reach/2 - x/2}px, ${-64 - innerHeight / 4 * sin(progress * PI) + y/2}px)`
	}else{
		celestialBody.src = moons[ticks / 24000 & 7].src
		const progress = (time - 15600) / 8400
		celestialBody.style.transform = `translate(${wspan * progress - 128 - reach/2 - x/2}px, ${-64 - innerHeight / 4 * sin(progress * PI) + y/2}px)`
	}
	clouds.style.transform = `translateY(${(cam.y - 64) * ZPX * 0.7}px)`
	clouds.style.backgroundImage = 'url("' + cloudMap.src + '")'
	clouds.style.backgroundPositionX = (t-cam.x) % 2048 * ZPX + 'px'
	if(document.pointerLockElement)position()
	for(const chunk of map.values()){
		chunk.position()
		chunk.updaterender()
	}
	updateKeys()
	for(const entity of entities.values()){
		if(!entity.node){
			entity.node = entity.textures.cloneNode(true)
			chunks.append(entity.node)
		}
		
		render(entity, entity.node)
	}
	if(ui && ui.frame)ui.frame()
})

loading.remove()