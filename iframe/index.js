import { playerControls } from './controls.js'
import { DataWriter as DW, DataReader as DR } from '../data.js'
import { meImpact, stepEntity } from './entity.js'
import { gridEvents, gridEventMap, getblock, entityMap, map, cam } from 'world'
import * as pointer from './pointer.js'
import { button, drawPhase, renderLayer, uiLayer, W, H, W2, H2, SCALE, options, paused, _recalcDimensions, _renderPhases, renderBoxes, renderF3, send } from 'api'
import { particles } from 'definitions'
import { VERSION } from '../version.js'

DataReader = DR
DataWriter = DW

let last = performance.now(), count = 1.1, timeToFrame = 0
t = Date.now()/1000%86400
setInterval(function(){
	eluStart()
	const now = performance.now()
	let update = 1000 / TPS
	let dt = now - last
	elusmooth += (elu / (dt || 1) - elusmooth) / count
	last = now
	elu = 0
	if(!me) return
	let ticked = 0
	while(dt > update){
		dt -= update
		if(ticked < 20) tick()
		ticked++
	}
	last -= dt
})

const sendDelay = 1 //send packet every tick
function tick(){ //20 times a second
	if(dt < 1/20000)dt = 1/20000
	if(ticks % sendDelay == 0 && me && me.netId > -1){
		let buf = new DataWriter()
		buf.byte(4)
		buf.byte(r)
		buf.double(me.x)
		buf.double(me.y)
		buf.short(me.state)
		buf.float(meImpact.dx); buf.float(meImpact.dy)
		meImpact.dx = meImpact.dy = 0
		pointer.checkBlockPlacing(buf)
		send(buf)
	}
	ticks++
	const x = floor(me.x + random() * 16 - 8), y = floor(me.y + random() * 16 - 8)
	const randomBlock = getblock(x, y)
	if(randomBlock.random) randomBlock.random(x, y)
	for(const e of entityMap.values()) if(e.tick) e.tick()
}
let lastFrame = performance.now(), elusmooth = 0
let elu = 0
let eluLast = 0
const eluEnd = () => (elu += performance.now() - eluLast, eluLast = 0)
const eluStart = () => eluLast ? 0 : (eluLast = performance.now(), Promise.resolve().then(eluEnd))
export let zoom_correction = 0
let camMovingX = false, camMovingY = false


const c = Can(0, 0, {alpha: false, desynchronized: true})
c.canvas.style = 'width: 100%; height: 100%; position: fixed; top: 0; left: 0; z-index: 0;'
document.body.append(c.canvas)

globalThis.cam = cam
export function frame(){
	const now = performance.now()
	eluStart()
	dt += (min(300, now - lastFrame) / 1000 * options.speed - dt) / 20
	t += (now - lastFrame) / 1000 * options.speed
	lastFrame = now
	requestAnimationFrame(frame)
	if(!me || me.netId == -1) return
	playerControls()
	for(const entity of entityMap.values())stepEntity(entity)
	const tzoom = (me.state & 4 ? -0.13 : 0) * ((1 << options.ffx) - 1) + 1
	cam.z = sqrt(sqrt(cam.z * cam.z * cam.z * 2 ** (options.zoom * 7 - 3) * devicePixelRatio * tzoom))
	_recalcDimensions(c, cam.z)
	c.transforms.length = 0
	c.imageSmoothingEnabled = false
	if(!me) return
	const reach = pointer.effectiveReach()
	if(options.camera == 0){
		const D = me.state & 4 ? 0.7 : 2
		const dx = ifloat(me.x + pointer.x/D - cam.x), dy = ifloat(me.y + pointer.y/D + me.head - cam.y)
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
		cam.x = me.x + pointer.x
		cam.y = me.y + me.head + pointer.y
	}else if(options.camera == 2){
		cam.x = me.x
		cam.y = me.y + me.head / 2
	}else if(options.camera == 3){
		if(me.x > cam.x + W2)cam.x += W2*2
		if(me.x < cam.x - W2)cam.x -= W2*2
		if(me.y > cam.y + H2)cam.y += H2*2
		if(me.y < cam.y - H2)cam.y -= H2*2
	}
	cam.rot = max(0, cam.rot - dt)
	c.font = '1000px mc'
	for(const phase of _renderPhases){
		switch(phase.coordSpace){
			case 'none': phase(c, W, H); break
			case 'world':
				c.setTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, H - H2 * SCALE)
				c.rotate(-cam.rot)
				phase(c)
				break
			case 'ui': const s = options.guiScale * devicePixelRatio * 2; c.setTransform(s, 0, 0, -s, 0, H); phase(c, W /  s, H /  s); break
			default: console.error('Invalid coordinate space: ' + phase.coordSpace)
		}
	}
	timeToFrame = performance.now() - now
	changed.clear()
}
drawPhase(200, (c, w, h) => {
	const hitboxes = buttons.has(KEYS.SYMBOL) | renderBoxes
	c.setTransform(1,0,0,1,W2*SCALE,h-H2*SCALE)
	c.rotate(cam.rot)
	c.translate(-W2*SCALE,H2*SCALE)
	for(const chunk of map.values()){
		const cxs = chunk.x << 6, cys = chunk.y << 6
		const x0 = round(ifloat(cxs - cam.x + W2) * SCALE)
		const x1 = round(ifloat(cxs + 64 - cam.x + W2) * SCALE)
		const y0 = round(ifloat(cys - cam.y + H2) * SCALE)
		const y1 = round(ifloat(cys + 64 - cam.y + H2) * SCALE)
		if(x1 <= 0 || y1 <= 0 || x0 >= w || y0 >= h){ chunk.hide(); continue }
		if(!chunk.ctx)chunk.draw()
		c.push()
		c.translate(x0,-y0)
		c.scale((x1-x0)/64,(y0-y1)/64)
		c.image(chunk.ctx, 0, 0, 64, 64)
		if(SCALE>12){
			c.push()
			for(const i of chunk.rerenders){
				c.translate(i&63,i>>6)
				chunk.tiles[i].render(c, cxs|(i&63),cys|(i>>6))
				c.peek()
			}
			c.pop()
		}
		if(hitboxes){
			c.lineWidth = 0.0625
			c.strokeStyle = '#06f'
			c.fillStyle = '#08f'
			c.globalAlpha = cam.z / 16
			for(let i = 8; i < 64; i += 8)
				c.fillRect(i - 0.015625, 0, 0.03125, 64)
			for(let i = 8; i < 64; i += 8)
				c.fillRect(0, i - 0.015625, 64, 0.03125)
			c.globalAlpha = 1
			c.strokeRect(0,0,64,64)
		}
		c.pop()
	}
	c.fillStyle = '#00f'
	if(abs(cam.x) <= W2 + 0.0625 && hitboxes)
		c.fillRect((W2-cam.x-0.0625)*SCALE,0,0.125*SCALE,-h)
	if(abs(cam.y) <= H2 + 0.0625 && hitboxes)
		c.fillRect(0,(cam.y-H2-0.0625)*SCALE,w,0.125*SCALE)
	if(abs(ifloat(cam.x + 2147483648)) <= W2 + 0.0625 && hitboxes)
		c.fillRect(ifloat(W2-cam.x+2147483648-0.0625)*SCALE,0,0.125*SCALE,-h)
	if(abs(ifloat(cam.y + 2147483648)) <= H2 + 0.0625 && hitboxes)
		c.fillRect(0,ifloat(cam.y+2147483648-H2-0.0625)*SCALE,w,0.125*SCALE)
})
drawPhase(300, (c, w, h) => {
	for(const ev of gridEventMap.values()){
		c.setTransform(SCALE, 0, 0, -SCALE, ifloat(ev.x - cam.x + W2) * SCALE, ifloat(cam.y - H2 - ev.y) * SCALE + h)
		if(!map.has((ev.x>>>6)+(ev.y>>>6)*0x4000000) || ev(c))gridEventMap.delete(ev.i)
	}
})

drawPhase(100, (c, w, h) => {
	const hitboxes = buttons.has(KEYS.SYMBOL) | renderBoxes
	for(const entity of entityMap.values()){
		if(!entity.render)continue
		c.setTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, h - H2 * SCALE)
		c.rotate(-cam.rot)
		c.translate(ifloat(entity.ix - cam.x), ifloat(entity.iy - cam.y))
		entity.render(c)
		c.setTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, h - H2 * SCALE)
		c.rotate(-cam.rot)
		c.translate(ifloat(entity.ix - cam.x), ifloat(entity.iy - cam.y))
		if(hitboxes){
			if(entity.head){
				c.fillStyle = '#fc0'
				const L = entity == me ? sqrt(pointer.x * pointer.x + pointer.y * pointer.y) : 0.8
				c.push()
					c.translate(0, entity.head)
					c.rotate(-entity.f)
					c.fillRect(-0.015625,-0.015625,0.03125,L)
					c.translate(0,L); c.rotate(PI * 1.25)
					c.fillRect(-0.015625,-0.015625,0.03125,0.2)
					c.fillRect(-0.015625,-0.015625,0.2,0.03125)
				c.pop()
				c.fillStyle = '#f00'
				c.fillRect(-entity.width + 0.0625, entity.head - 0.03125, entity.width*2 - 0.125, 0.0625)
			}
			c.strokeStyle = '#fff'
			c.lineWidth = 0.0625
			c.strokeRect(-entity.width + 0.03125, 0.03125, entity.width * 2 - 0.0625, entity.height - 0.0625)
		}
	}
})
renderLayer(400, c => {
	if(paused) return
	pointer.drawPointer(c)
})

uiLayer(1000, (c, w, h) => {
	if(!renderF3 && !buttons.has(KEYS.SYMBOL)) return
	c.textAlign = 'left'
	let y = h - 1
	for(const t of `Paper Minecraft ${VERSION}
FPS: ${round(1/dt)} (${timeToFrame.toFixed(2).padStart(5,'\u2007')}ms)
ELU: ${min(100,elusmooth*100).toFixed(1).padStart(4,'\u2007')}%${performance.memory ? ', MEM: '+(performance.memory.usedJSHeapSize/1048576).toFixed(1)+'MB' : ''}
Ch: ${map.size}, E: ${entityMap.size}, P: ${particles.size}
XY: ${me.x.toFixed(3)} / ${me.y.toFixed(3)}
ChXY: ${(floor(me.x) & 63).toString().padStart(2,'\u2007')} ${(floor(me.y) & 63).toString().padStart(2,'\u2007')} in ${floor(me.x) >> 6} ${floor(me.y) >> 6}
Looking at: ${floor(pointer.x + me.x)|0} ${floor(pointer.y + me.y + me.head)|0}
Facing: ${(me.f >= 0 ? 'R' : 'L') + (90 - abs(me.f / PI2 * 360)).toFixed(1).padStart(5, '\u2007')} (${(me.f / PI2 * 360).toFixed(1)})
`.slice(0, -1).split('\n')){
		let {top, bottom, width} = c.measureText(t, 10)
		top++; bottom++; width += 2; y -= top + bottom
		c.fillStyle = '#6b6b6b6e'
		c.fillRect(1, y, width, top + bottom)
		c.fillStyle = '#fff'
		c.fillText(t, 2, y + bottom, 10, w/1-3)
	}
	const mex = floor(me.x) >> 3 & 6, mexi = (floor(me.x) & 15) / 16
	y = h - 1
	c.textAlign = 'right'
	const lookingAt = getblock(floor(pointer.x + me.x), floor(pointer.y + me.y + me.head))
	for(const t of `Tick ${ticks}, Day ${floor((ticks+6000)/24000)}, Time ${floor((ticks/1000+6)%24).toString().padStart(2,'0')}:${(floor((ticks/250)%4)*15).toString().padStart(2,'0')}
Dimension: ${world}
Biome: ${me.chunk ? round(me.chunk.biomes[mex] * (1 - mexi) + me.chunk.biomes[mex+2] * mexi) : 0}/${me.chunk ? round(me.chunk.biomes[mex+1] * (1 - mexi) + me.chunk.biomes[mex+3] * mexi) : 0}
Looking at: ${lookingAt.className+(lookingAt.savedata?' {...}':'')} (${lookingAt.id})
`.slice(0, -1).split('\n')){
		let {top, bottom, width} = c.measureText(t, 10)
		top++; bottom++; width += 2; y -= top + bottom
		c.fillStyle = '#7777'
		c.fillRect(w - width - 1, y, width, top + bottom)
		c.fillStyle = '#fff'
		c.fillText(t, w - 2, y + bottom, 10, w/1-3);
	}
})


button(KEYS.F2, () => {
	c.canvas.toBlob(download, 'image/png')
})