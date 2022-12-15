const VERSION = 'alpha 1'
import "./lib/prototype.js"
import "./me.js"
import "./lib/incomingPacket.js"
import { TEX_SIZE } from "./textures.js"
import { position, REACH, x, y } from "./ui/pointer.js"
import { updateKeys } from "./ui/events.js"
import "./controls.js"
import "./expose.js"
import { render, stepEntity } from "./lib/entity.js"
import { serverlist } from "./uis/serverlist.js"
import { ui } from "./ui/ui.js"
import { DataWriter } from "./lib/data.js"
serverlist()
const update = 1000 / 20
let last = performance.now(), rendertime = 5, count = 1.1, l2 = performance.now()
globalThis.t = Date.now()/1000%86400
setInterval(function(){
	let dt = performance.now() - last
	last = performance.now()
	if(!running)return
	let ticked = 0
	while(dt > update){
		dt -= update
		if(ticked){
			//console.warn('Falling behind (tick dropped)')
		}else tick()
		ticked++
	}
	last -= dt
})
const debug = () => {
	const el = document.createElement('txt')
	f3.appendChild(el)
	return a => el.innerText = a
}, debugs = []
const sendDelay = 1 //send packet every 4 ticks
let ticknumber = 0
function tick(){ //20 times a second
	countElu()
	if(rendertime < 1/50)rendertime = 1/50
	if(dt < 1/20000)dt = 1/20000
	elusmooth += (elu - elusmooth) / count
	elu = 0
	if(ticknumber % sendDelay == 0 && me._id > -1){
		let buf = new DataWriter()
		buf.byte(4)
		buf.byte(r)
		buf.double(me.x)
		buf.double(me.y)
		buf.float(me.dx)
		buf.float(me.dy)
		buf.float(me.f)
		buf.pipe(ws)
	}
	for(const [t, i] of `

Paper Minecraft ${VERSION}
FPS: ${Math.round(1/dt)} (${rendertime < 5 ? rendertime < 1/10 ? '9999+' : (1000/rendertime).toFixed(0) : (1000/rendertime).toFixed(1)})
ELU: ${Math.min(99.9,elusmooth/update*100).toFixed(1).padStart(4,"0")}% Ch: ${map.size}
XY: ${me.x.toFixed(3)} / ${me.y.toFixed(3)}
Looking at: ${Math.floor(x + me.x)|0} ${Math.floor(y + me.y + me.head)|0}
Facing: ${(me.f >= 0 ? 'RIGHT ' : ' LEFT ') + (90 - Math.abs(me.f / PI2 * 360)).toFixed(1).padStart(5, '\u2007')} (${(me.f / PI2 * 360).toFixed(1)})
`.trim().split('\n').map((a,i)=>[a,i]))(debugs[i] || (debugs[i] = debug()))(t)
	ticknumber++
}
const physical_chunk_pixels = TEX_SIZE * 64 * devicePixelRatio
let dt = 1 / 60, l3 = performance.now(), elusmooth = 0
globalThis.W2 = visualViewport.width / TEX_SIZE / cam.z / 2 + 1
globalThis.H2 = visualViewport.height / TEX_SIZE / cam.z / 2 + 1
globalThis.ZPX = cam.z * TEX_SIZE
const msgchannel = new MessageChannel()
let elu = 0
msgchannel.port1.onmessage = function({data}){
	elu += performance.now() - data
}
globalThis.countElu = () => msgchannel.port2.postMessage(performance.now())
msgchannel.port2.onmessage = function(){
	const now = performance.now()
	rendertime += (now - l2 - rendertime) / count
	elu += now - l2
}
const SPEED = 1
export let zoom_correction = 0
let camMovingX = false, camMovingY = false
const {abs, min, round, PI} = Math
const PI2 = PI * 2
requestAnimationFrame(function frame(){
	l2 = performance.now()
	dt += ((performance.now() - l3) / 1000 - dt) / (count = min(count ** 1.03, 60))
	if(dt > .3)count = 1.1
	globalThis.t += (performance.now() - l3) / 1000 * SPEED
	l3 = performance.now()
	requestAnimationFrame(frame)
	if(!running)return
	msgchannel.port1.postMessage(undefined)
	const dx = Math.ifloat(me.x + x/2 - cam.x), dy = Math.ifloat(me.y + y/2 + me.head - cam.y)
	if(abs(dx) > 64)cam.x += dx
	else{
		if(!camMovingX && abs(dx) > REACH / 2)camMovingX = true
		else if(camMovingX && abs(dx) < REACH / 4)camMovingX = false
		if(camMovingX)cam.x = Math.ifloat(cam.x + (dx - Math.sign(dx)*(REACH/4+0.25)) * dt * 4)
	}
	if(abs(dy) > 64)cam.y += dy
	else{
		if(!camMovingY && abs(dy) > REACH / 2)camMovingY = true
		else if(camMovingY && abs(dy) < REACH / 4)camMovingY = false
		if(camMovingY)cam.y = Math.ifloat(cam.y + (dy - Math.sign(dy)*(REACH/4+0.25)) * dt * 7)
	}
	W2 = visualViewport.width / TEX_SIZE / cam.z / 2 + 1
	H2 = visualViewport.height / TEX_SIZE / cam.z / 2 + 1
	zoom_correction = round(physical_chunk_pixels * cam.z) / physical_chunk_pixels
	ZPX = zoom_correction * TEX_SIZE
	document.body.style.setProperty('--z', zoom_correction)
	document.body.style.setProperty('--texsize', TEX_SIZE + 'px')
	chunks.style.background = '#78A7FF'
	
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
		stepEntity(entity, dt * SPEED)
		render(entity, entity.node)
	}
	if(ui && ui.frame)ui.frame()
})