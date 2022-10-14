const VERSION = 'alpha 1'
import "./lib/prototype.js"
import "./me.js"
import { codes, onstring, types } from "./lib/incomingPacket.js"
import { send } from "./lib/send.js"
import { TEX_SIZE } from "./textures.js"
import { mv, position, REACH, x, y } from "./ui/pointer.js"
import { updateKeys } from "./ui/events.js"
import "./controls.js"
import "./ui/pause.js"
import { connection } from "./lib/connectme.js"
import "./expose.js"
import { render } from "./lib/entity.js"
import { EntityIDs } from "./lib/definitions.js"
globalThis.ws = connection('192.168.1.91:27277')

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
const sendDelay = 4 //send packet every 4 ticks
let ticknumber = 0
function tick(){ //20 times a second
	countElu()
	if(rendertime < 1/50)rendertime = 1/50
	if(dt < 1/20000)dt = 1/20000
	elusmooth += (elu - elusmooth) / count
	elu = 0
	if(ticknumber % sendDelay == 0){
		send()
	}
	for(const [t, i] of `

Paper Minecraft ${VERSION}
FPS: ${Math.round(1/dt)} (${rendertime < 5 ? rendertime < 1/10 ? '9999+' : (1000/rendertime).toFixed(0) : (1000/rendertime).toFixed(1)})
ELU: ${Math.min(99.9,elusmooth/update*100).toFixed(1).padStart(4,"0")}% Ch: ${map.size}
XY: ${me.x.toFixed(5)} / ${me.y.toFixed(5)}
Point: ${Math.floor(x + me.x)} / ${Math.floor(y + me.y + me.head)}
`.trim().split('\n').map((a,i)=>[a,i]))(debugs[i] || (debugs[i] = debug()))(t)
	ticknumber++
	updateKeys()
}
const physical_chunk_pixels = TEX_SIZE * 64 * devicePixelRatio
let dt = 1 / 60, l3 = performance.now(), elusmooth = 0
globalThis.W2 = innerWidth / TEX_SIZE / cam.z / 2 + 1
globalThis.H2 = innerHeight / TEX_SIZE / cam.z / 2 + 1
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
export let zoom_correction = 0
let camMoving = false
const {abs, min, max, round} = Math
const puppet = EntityIDs[0]._.textures.cloneNode(true)
inventory.append(puppet)
requestAnimationFrame(function frame(){
	l2 = performance.now()
	dt += ((performance.now() - l3) / 1000 - dt) / (count = min(count ** 1.03, 60))
	if(dt > .3)count = 1.1
	globalThis.t += (performance.now() - l3) / 1000
	l3 = performance.now()
	requestAnimationFrame(frame)
	if(!running)return
	me.x += me.dx * dt
	me.y += me.dy * dt
	me.dx *= 0.01 ** dt
	me.dy *= 0.01 ** dt
	me.x = Math.ifloat(me.x)
	me.y = Math.ifloat(me.y)
	msgchannel.port1.postMessage(undefined)
	const dx = Math.ifloat(me.x + x/2 - cam.x), dy = Math.ifloat(me.y + y/2 + me.head - cam.y)
	if(!camMoving && max(abs(dx), abs(dy)) > REACH / 2)camMoving = true
	else if(camMoving && max(abs(dx), abs(dy)) < REACH / 4)camMoving = false
	if(camMoving){
		cam.x = Math.ifloat(cam.x + (dx - Math.sign(dx)*(REACH/4+0.125)) * dt * 5)
		cam.y = Math.ifloat(cam.y + (dy - Math.sign(dy)*(REACH/4+0.125)) * dt * 5)
	}
	W2 = innerWidth / TEX_SIZE / cam.z / 2 + 1
	H2 = innerHeight / TEX_SIZE / cam.z / 2 + 1
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
	for(const entity of entities){
		if(!entity.node){
			entity.node = entity.textures.cloneNode(true)
			chunks.append(entity.node)
		}
		render(entity, entity.node)
	}
	render(me, puppet)
	
})