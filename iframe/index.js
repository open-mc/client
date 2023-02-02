import { playerControls, renderBoxes, renderF3 } from "./controls.js"
import { DataWriter } from "../data.js"
import { stepEntity } from "./entity.js"

const VERSION = 'alpha 3'
let last = performance.now(), count = 1.1
t = Date.now()/1000%86400
setInterval(function(){
	countElu()
	const now = performance.now()
	let update = 1000 / TPS
	let dt = now - last
	elusmooth += (elu / (dt || 1) - elusmooth) / count
	last = now
	elu = 0
	if(!me)return
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
	if(ticks % sendDelay == 0 && me && me._id > -1){
		let buf = new DataWriter()
		buf.byte(4)
		buf.byte(r)
		buf.double(me.x)
		buf.double(me.y)
		buf.short(me.state)
		buf.float(me.dx)
		buf.float(me.dy)
		buf.float(me.f)
		send(buf)
	}
	ticks++
}
let dt = 1 / 60, lastFrame = performance.now(), elusmooth = 0
let elu = 0
globalThis.requestIdleCallback = globalThis.requestIdleCallback || setTimeout
let eluLast = 0
const eluCb = () => (elu += performance.now() - eluLast, eluLast = 0)
globalThis.countElu = () => eluLast ? 0 : (eluLast = performance.now(), requestIdleCallback(eluCb))
export let zoom_correction = 0
let camMovingX = false, camMovingY = false


const c = Can(0, 0)
c.canvas.style = 'width: 100%; height: 100%; position: fixed; top: 0; left: 0; z-index: 0;'
document.body.append(c.canvas)

const renderPhases = []

renderLayer = (prio, fn) => {
	let i = renderPhases.push(null) - 2
	while(i >= 0 && renderPhases[i].prio > prio){
		renderPhases[i + 1] = renderPhases[i]
		i--
	}
	fn.prio = prio
	fn.coordSpace = 'world'
	i++
	renderPhases[i] = fn
}
uiLayer = (prio, fn) => {
	let i = renderPhases.push(null) - 2
	while(i >= 0 && renderPhases[i].prio > prio){
		renderPhases[i + 1] = renderPhases[i]
		i--
	}
	fn.prio = prio
	fn.coordSpace = 'ui'
	i++
	renderPhases[i] = fn
}
drawPhase = (prio, fn) => {
	let i = renderPhases.push(null) - 2
	while(i >= 0 && renderPhases[i].prio > prio){
		renderPhases[i + 1] = renderPhases[i]
		i--
	}
	fn.prio = prio
	fn.coordSpace = 'none'
	i++
	renderPhases[i] = fn
}


export function frame(){
	countElu()
	const now = performance.now()
	dt += ((now - lastFrame) / 1000 - dt) / (count = min(count ** 1.03, 60))
	if(dt > .3)count = 1.1
	t += (now - lastFrame) / 1000 * options.speed
	lastFrame = now
	requestAnimationFrame(frame)
	if(!me || me._id == -1)return
	for(const entity of entities.values())stepEntity(entity, dt * options.speed)
	cam.z = 2 ** round(options.zoom * 5 - 1) * devicePixelRatio
	SCALE = cam.z * TEX_SIZE
	W2 = (c.canvas.width = round(visualViewport.width * visualViewport.scale * devicePixelRatio)) / TEX_SIZE / cam.z / 2
	H2 = (c.canvas.height = round(visualViewport.height * visualViewport.scale * devicePixelRatio)) / TEX_SIZE / cam.z / 2
	c.imageSmoothingEnabled = false
	if(!me) return
	const reach = pointer.effectiveReach()
	if(options.camera == 0){
		const dx = ifloat(me.x + pointer.x/2 - cam.x), dy = ifloat(me.y + pointer.y/2 + me.head - cam.y)
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
	playerControls()
	c.font = '1000px mc'
	for(const phase of renderPhases){
		switch(phase.coordSpace){
			case 'none': phase(c, c.canvas.width, c.canvas.height); break
			case 'world': c.vertexOrder = 'bottom-left'; c.saveTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, c.canvas.height - H2 * SCALE); phase(c); break
			case 'ui': c.vertexOrder = 'top-left'; const s = options.guiScale * devicePixelRatio * 2; c.saveTransform(s, 0, 0, s, 0, 0); phase(c, c.canvas.width /  s, c.canvas.height /  s); break
			default: console.error('Invalid coordinate space: ' + phase.coordSpace)
		}
	}
}
drawPhase(0, (c, w, h) => {
	c.setTransform(1,0,0,1,0,h)
	c.vertexOrder = 'bottom-left'
	for(const chunk of map.values()){
		const x0 = round(ifloat((chunk.x << 6) - cam.x + W2) * SCALE)
		const x1 = round(ifloat((chunk.x + 1 << 6) - cam.x + W2) * SCALE)
		const y0 = round(ifloat((chunk.y << 6) - cam.y + H2) * SCALE)
		const y1 = round(ifloat((chunk.y + 1 << 6) - cam.y + H2) * SCALE)
		if(x1 <= 0 || y1 <= 0 || x0 >= w || y0 >= h){ chunk.hide(); continue }
		if(!chunk.ctx)chunk.draw()
		//console.log('%d %d %d %d\n%c ', x0, x1, y0, y1, 'font-size:0;display: block; padding: 128px; background: url("'+chunk.ctx.canvas.toDataURL('png')+'") center/cover')
		c.drawImage(chunk.ctx.canvas, 0, TEX_SIZE << 6, TEX_SIZE << 6, -(TEX_SIZE << 6), x0, -y0, x1 - x0, y0 - y1)
	}
})

drawPhase(100, (c, w, h) => {
	c.vertexOrder = 'bottom-left'
	const hitboxes = buttons.has(KEY_TAB) ^ renderBoxes
	for(const entity of entities.values()){
		if(!entity.render)continue
		c.saveTransform(SCALE, 0, 0, -SCALE, ifloat(entity.ix - cam.x + W2) * SCALE, ifloat(cam.y - H2 - entity.iy) * SCALE + h)
		if(hitboxes){
			c.strokeStyle = '#fff'
			c.lineWidth = 0.0625
			c.strokeRect(-entity.width + 0.03125, 0.03125, entity.width * 2 - 0.0625, entity.height - 0.0625)
			c.strokeStyle = '#000'
		}
		entity.render(c)
	}
})
renderLayer(200, c => {
	if(paused)return
	pointer.drawPointer(c)
})

uiLayer(1000, (c, w, h) => {
	if(renderF3 == buttons.has(KEY_TAB))return
	c.textAlign = 'left'
	let y = 1
	for(const t of `Paper Minecraft ${VERSION}
FPS: ${round(1/dt)}, ELU: ${min(99.9,elusmooth/10*TPS).toFixed(1).padStart(4,"0")}%
Ch: ${map.size}, E: ${entities.size}, N: ${document.all.length}
XY: ${me.x.toFixed(3)} / ${me.y.toFixed(3)}
${floor(me.x) & 63} ${floor(me.y) & 63} in ${floor(me.x) >> 6} ${floor(me.y) >> 6}
Looking at: ${floor(pointer.x + me.x)|0} ${floor(pointer.y + me.y + me.head)|0}
Facing: ${(me.f >= 0 ? 'R ' : 'L ') + (90 - abs(me.f / PI2 * 360)).toFixed(1).padStart(5, '\u2007')} (${(me.f / PI2 * 360).toFixed(1)})
`.slice(0, -1).split('\n')){
		let {top, bottom, width} = c.measure(t)
		top = top * 10 + 1; bottom = bottom * 10 + 1; width = width * 10 + 2
		c.fillStyle = '#7777'
		c.fillRect(1, y, width, top + bottom)
		c.fillStyle = '#fff'
		c.fillText(t, 2, y += top, 10, w/1-3); y += bottom
	}
	const mex = floor(me.x) >> 3 & 6, mexi = (floor(me.x) & 15) / 16
	y = 1
	c.textAlign = 'right'
	for(const t of `Tick ${ticks}, Day ${floor((ticks+6000)/24000)}, Time ${floor((ticks/1000+6)%24).toString().padStart(2,'0')}:${(floor((ticks/250)%4)*15).toString().padStart(2,'0')}
Dimension: ${world}
Biome: ${me.chunk ? round(me.chunk.biomes[mex] * (1 - mexi) + me.chunk.biomes[mex+2] * mexi) : 0}/${me.chunk ? round(me.chunk.biomes[mex+1] * (1 - mexi) + me.chunk.biomes[mex+3] * mexi) : 0}
`.slice(0, -1).split('\n')){
		let {top, bottom, width} = c.measure(t)
		top = top * 10 + 1; bottom = bottom * 10 + 1; width = width * 10 + 2
		c.fillStyle = '#7777'
		c.fillRect(w - width - 1, y, width, top + bottom)
		c.fillStyle = '#fff'
		c.fillText(t, w - 2, y += top, 10, w/1-3); y += bottom
	}
})


button(KEY_F2, () => {
	c.canvas.toBlob(download, 'image/png')
})