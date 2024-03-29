import { playerControls } from './controls.js'
import { DataWriter, DataReader } from '/server/modules/dataproto.js'
import { mePhysics, stepEntity } from './entity.js'
import { gridEventMap, getblock, entityMap, map, cam, server, world } from 'world'
import * as pointer from './pointer.js'
import { button, drawPhase, renderLayer, uiLayer, W, H, W2, H2, SCALE, options, paused, _recalcDimensions, _renderPhases, renderBoxes, renderF3, send, download, pause } from 'api'
import { particles } from 'definitions'
import { VERSION } from '../server/version.js'
import { bigintOffset } from './world.js'
import { _updatePaused, toBlockExact } from './api.js'

let last = performance.now(), count = 1.1, timeToFrame = 0
t = performance.now()/1000
setInterval(function(){
	t = performance.now()/1000
	eluStart()
	const now = performance.now()
	const update = 1000 / world.tps
	let dt = now - last
	elusmooth += (elu / (dt || 1) - elusmooth) / count
	last = now
	elu = 0
	if(!me) return
	let tickcount = floor(dt/update)
	dt -= tickcount*update
	while(tickcount--) tick()
	last -= dt
})

const sendDelay = 1 //send packet every tick
function tick(){
	if(dt < 1/20000)dt = 1/20000
	if(world.tick % sendDelay == 0 && me && !(me.health <= 0)){
		let buf = new DataWriter()
		buf.byte(4)
		buf.byte(world.r)
		buf.double(me.x)
		buf.double(me.y)
		buf.short(me.state)
		buf.float(mePhysics.impactDx); buf.float(mePhysics.impactDy)
		mePhysics.impactDx = mePhysics.impactDy = 0
		pointer.checkBlockPlacing(buf)
		send(buf)
	}
	world.tick++
	if(world.weather&0x0FFFFFFF) world.weather--
	else world.weather = 0
	if(world.weatherFade) world.weatherFade--
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


let c = null

globalThis.FONT = '1000px mc, Arial'
export function frame(){
	const now = performance.now()
	eluStart()
	dt += (min(300, now - lastFrame) / 1000 * options.speed - dt) / round(.333333/dt)
	lastFrame = now
	requestAnimationFrame(frame)
	if(!me) return
	pause(false)
	playerControls()
	for(const entity of entityMap.values()) stepEntity(entity)
	const tzoom = (me.state & 4 ? -0.13 : 0) * ((1 << options.ffx * (options.camera != 4)) - 1) + 1
	cam.z = sqrt(sqrt(cam.z * cam.z * cam.z * 2 ** (options.zoom * 10 - 6) * tzoom * 2**cam.baseZ))
	c = _recalcDimensions(c, cam.z)
	c.imageSmoothingEnabled = false
	const reach = pointer.effectiveReach()
	if(options.camera == 0){
		const D = me.state & 4 ? 0.7 : 2
		const dx = ifloat(me.x + pointer.x/D - cam.x + cam.baseX), dy = ifloat(me.y + pointer.y/D + me.head - cam.y + cam.baseY)
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
		const dx = ifloat(me.x + pointer.x - cam.x + cam.baseX), dy = ifloat(me.y + pointer.y + me.head - cam.y + cam.baseY)
		if(abs(dx) > 64) cam.x += dx
		else cam.x += dx * dt
		if(abs(dy) > 64) cam.y += dy
		else cam.y += dy * dt
	}else if(options.camera == 2){
		cam.x = me.x + pointer.x + cam.baseX
		cam.y = me.y + me.head + pointer.y + cam.baseY
	}else if(options.camera == 3){
		cam.x = me.x + cam.baseX
		cam.y = me.y + me.head / 2 + cam.baseY
	}else if(options.camera == 4){
		const dx = ifloat(me.x - cam.x + cam.baseX), dy = ifloat(me.y + me.head/2 - cam.y + cam.baseY)
		if(abs(dx) > W2 * 2 - 2) cam.x += dx
		else if(dx > W2 - 1)cam.x += W2*2 - 2
		else if(dx < 1 - W2)cam.x -= W2*2 - 2
		if(abs(dy) > H2 * 2 - 2) cam.y += dy
		else if(dy > H2 - 1)cam.y += H2*2 - 2
		else if(dy < 1 - H2)cam.y -= H2*2 - 2
	}
	if(cam.staticX === cam.staticX) cam.x = cam.staticX
	if(cam.staticY === cam.staticY) cam.y = cam.staticY
	cam.f += (cam.baseF - cam.f) * min(1, dt*4/sqrt(abs(cam.baseF - cam.f)))
	c.font = FONT
	for(const phase of _renderPhases){
		try{
			switch(phase.coordSpace){
				case 'none': phase(c, W, H); break
				case 'world':
					c.setTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, H - H2 * SCALE)
					c.rotate(-cam.f)
					phase(c)
					break
				case 'ui': const s = options.guiScale * devicePixelRatio * 2**(options.supersample*6-3) * 2; c.setTransform(s, 0, 0, -s, 0, H); phase(c, W / s, H / s); break
				default: console.error('Invalid coordinate space: ' + phase.coordSpace)
			}
		}catch(e){console.error(e)}
	}
	timeToFrame = performance.now() - now
	changed.clear()
	delta.mx = delta.my = 0
	delta.jlx = delta.jly = 0
	delta.jrx = delta.jry = 0
	_updatePaused()
}
globalThis.cam = cam
const chunkCan = Can(0, 0)
drawPhase(200, (c, w, h) => {
	const hitboxes = renderBoxes + buttons.has(KEYS.SYMBOL)
	c.setTransform(1,0,0,1,W/2,H/2)
	c.rotate(cam.f)
	const expectedDetail = max(1, min(TEX_SIZE, 2**ceil(log2(cam.z*1.189207115+2)+2)))
	const sr = sin(cam.f), cr = cos(cam.f)
	const x0 = -w*cr+h*sr, x1 = w*cr-h*sr, x2 = w*cr+h*sr, x3 = -w*cr-h*sr
	const y0 = -w*sr+h*cr, y1 = w*sr-h*cr, y2 = w*sr+h*cr, y3 = -w*sr-h*cr
	const limX = max(x0,x1,x2,x3)/2, limY = max(y0,y1,y2,y3)/2
		for(const chunk of map.values()){
		const cxs = chunk.x << 6, cys = chunk.y << 6
		const x0 = round(ifloat(cxs - cam.x) * SCALE)
		const x1 = round(ifloat(cxs + 64 - cam.x) * SCALE)
		const y0 = round(ifloat(cys - cam.y) * SCALE)
		const y1 = round(ifloat(cys + 64 - cam.y) * SCALE)
		if(x1 <= -limX || y1 <= -limY || x0 >= limX || y0 >= limY){ chunk.hide(); continue }
		if(!chunk.ctx || chunk.ctx.w < expectedDetail*64 || chunk.ctx.w > expectedDetail*128) chunk.draw(expectedDetail)
				c.push()
		c.translate(x0,-y0)
		c.scale((x1-x0)/64,(y0-y1)/64)
		chunk.animate()
		c.image(chunk.ctx, 0, 0, 64, 64)
		if(true){
			c.push()
			for(const i of chunk.rerenders){
				c.translate(i&63,i>>6)
				const b = chunk[i]
				void(b==65535?chunk.tileData.get(i):BlockIDs[b]).render(c, cxs|(i&63),cys|(i>>6))
				c.peek()
			}
			c.pop()
		}
		if(hitboxes){
			c.lineWidth = 0.0625
			c.strokeStyle = '#06f'
			c.fillStyle = '#08f'
			if(hitboxes >= 2){
				c.globalAlpha = cam.z / 16
				for(let i = 8; i < 64; i += 8)
					c.fillRect(i - 0.015625, 0, 0.03125, 64)
				for(let i = 8; i < 64; i += 8)
					c.fillRect(0, i - 0.015625, 64, 0.03125)
				c.globalAlpha = 1
			}
			c.strokeRect(0,0,64,64)
		}
		c.pop()
	}
	c.fillStyle = '#00f'
	if(hitboxes >= 2 && abs(cam.x) <= W2 + 0.0625)
		c.fillRect((-cam.x-0.0625)*SCALE,-h/2,0.125*SCALE,h)
	if(hitboxes >= 2 && abs(cam.y) <= H2 + 0.0625)
		c.fillRect(-w/2,(cam.y-0.0625)*SCALE,w,0.125*SCALE)
	if(hitboxes >= 2 && abs(ifloat(cam.x + 2147483648)) <= W2 + 0.0625)
		c.fillRect(ifloat(W2-cam.x+2147483648-0.0625)*SCALE,0,0.125*SCALE,-h)
	if(hitboxes >= 2 && abs(ifloat(cam.y + 2147483648)) <= H2 + 0.0625)
		c.fillRect(0,ifloat(cam.y+2147483648-H2-0.0625)*SCALE,w,0.125*SCALE)
	if(hitboxes >= 2){
		const mx = floor(me.ix), my = floor(me.iy)
		const refx = me.ix - mx, refy = me.iy - my
		c.setTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, h - H2 * SCALE)
		c.rotate(-cam.f)
		c.translate(ifloat(mx - cam.x), ifloat(my - cam.y))
		c.lineWidth = 0.0625
		const LENGTH = 6
		for(let x = -LENGTH; x <= LENGTH; x++)
		for(let y = -LENGTH; y <= LENGTH; y++){
			const bl = getblock(mx + x, my + y)
			c.strokeStyle = bl.solid ? '#fffc' : bl.fluidType ? '#00fc' : bl.blockShape ? '#fff8' : bl.targettable ? '#444c' : '#0000'
			c.save()
			c.globalAlpha = max(0, 1 - ((x - refx) * (x - refx) + (y - refy) * (y - refy))/LENGTH/LENGTH)
			c.translate(x, y)
			bl.trace(c)
			c.clip(); c.stroke()
			c.restore()
		}
	}
	})
drawPhase(300, (c, w, h) => {
	c.setTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, h - H2 * SCALE)
	c.rotate(-cam.f)
	c.push()
	for(const ev of gridEventMap.values()){
		toBlockExact(c, ev.x, ev.y)
		if(!map.has((ev.x>>>6)+(ev.y>>>6)*0x4000000) || ev(c))gridEventMap.delete(ev.i)
		c.peek()
	}
})
function renderEntity(entity, w, h){
	if(!entity.render) return
	const hitboxes = buttons.has(KEYS.SYMBOL) + renderBoxes
	if(entity == me || dt > 1/30)entity.ix = entity.x, entity.iy = entity.y
	else{
		entity.ix += ifloat(entity.x - entity.ix) * dt * 20
		entity.iy += ifloat(entity.y - entity.iy) * dt * 20
	}
	c.setTransform(SCALE, 0, 0, -SCALE, W2 * SCALE, h - H2 * SCALE)
	c.rotate(-cam.f)
	c.translate(ifloat(entity.ix - cam.x), ifloat(entity.iy - cam.y))
	c.push()
	entity.render(c)
	c.pop()
	if(hitboxes){
		if(entity.head){
			c.fillStyle = '#fc0'
			const L = entity == me ? sqrt(pointer.x * pointer.x + pointer.y * pointer.y) : 0.8
			if(hitboxes >= 2){
				c.push()
					c.translate(0, entity.head)
					c.rotate(-entity.f)
					c.fillRect(-0.015625,-0.015625,0.03125,L)
					c.translate(0,L); c.rotate(PI * 1.25)
					c.fillRect(-0.015625,-0.015625,0.03125,0.2)
					c.fillRect(-0.015625,-0.015625,0.2,0.03125)
				c.pop()
			}
			c.fillStyle = '#f00c'
			c.fillRect(-entity.width + 0.046875, entity.head - 0.0234375, entity.width*2 - 0.09375, 0.046875)
		}
		c.strokeStyle = '#fffc'
		c.lineWidth = 0.046875
		c.strokeRect(-entity.width + 0.03125, 0.03125, entity.width * 2 - 0.0625, entity.height - 0.0625)
	}
}
drawPhase(100, (c, w, h) => {
	for(const e of entityMap.values()) renderEntity(e, w, h)
	if(!me.linked && !(me.health<=0)){
		c.globalAlpha = 0.2
		renderEntity(me, w, h)
		c.globalAlpha = 1
	}
})
renderLayer(400, c => {
	if(paused) return
	pointer.drawPointer(c)
})

function toString(big, num, precision = 3){
	let v
	if(!precision){
		v = (big + BigInt(floor(num))).toString()
	}else if(-num <= big) v = (big + BigInt(floor(num))).toString() + (num%1+1).toFixed(precision).slice(1)
	else{
		const x = big + BigInt(ceil(num))
		v = (x?'':'-') + x.toString() + (num%1-1).toFixed(precision).slice(2)
	}
	if(v.length > 50) v = v.slice(0, 10) + '...' + v.slice(-39)
	return v
}

uiLayer(1000, (c, w, h) => {
	if(!renderF3 && !buttons.has(KEYS.SYMBOL)) return
	c.textAlign = 'left'
	let y = h - 1
	const trueX = toString(bigintOffset.x, me.x, 3), trueY = toString(bigintOffset.y, me.y, 3)

	for(const t of `Paper MC ${VERSION}
FPS: ${round(1/dt)} (${timeToFrame.toFixed(2).padStart(5,'\u2007')}ms)
ELU: ${min(100,elusmooth*100).toFixed(1).padStart(4,'\u2007')}%${performance.memory ? ', MEM: '+(performance.memory.usedJSHeapSize/1048576).toFixed(1)+'MB' : ''}
Ch: ${map.size}, E: ${entityMap.size}, P: ${particles.size}
XY: ${trueX} / ${trueY}
ChXY: ${(floor(me.x) & 63).toString().padStart(2,'\u2007')} ${(floor(me.y) & 63).toString().padStart(2,'\u2007')} in ${toString(bigintOffset.x>>6n,floor(me.x) >> 6, 0)} ${toString(bigintOffset.y>>6n,floor(me.y) >> 6, 0)}
Looking at: ${toString(bigintOffset.x, floor(pointer.x + me.x)|0, 0)} ${toString(bigintOffset.y, floor(pointer.y + me.y + me.head)|0, 0)}
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
	for(const t of `Tick ${world.tick}, Day ${floor((world.tick+6000)/24000)}, Time ${floor((world.tick/1000+6)%24).toString().padStart(2,'0')}:${(floor((world.tick/250)%4)*15).toString().padStart(2,'0')}
Dimension: ${world.id}
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
const {Texture} = loader(import.meta)
const icons = Texture('/vanilla/icons.png')
//const heart = icons.crop(52,0,9,9), halfHeart = icons.crop(61,0,9,9)
//const heartEmpty = icons.crop(16,0,9,9)
const pingIcons = icons.crop(0,16,10,24)

const colors = ['#000', '#a00', '#0a0', '#fa0', '#00a', '#a0a', '#0aa', '#aaa', '#555', '#f55', '#5f5', '#ff5', '#55f', '#f5f', '#5ff', '#fff']
const shadowColors = ['#0000004', '#2a0000', '#002a00', '#2a2a00', '#00002a', '#2a002a', '#002a2a', '#2a2a2a', '#15151544', '#3f1515', '#153f15', '#3f3f15', '#15153f', '#3f153f', '#153f3f', '#3f3f3f']
CanvasRenderingContext2D.prototype.styledText = function(S,t,x,y,s,w){
	this.font = (S&32?'bold ':'')+(S&64?'italic ':'')+FONT
	this.fillStyle = shadowColors[S&15]
	this.fillText(t,x+1,y-1,s, w)
	this.fillStyle = colors[S&15]
	this.fillText(t,x,y,s,w)
	this.font = FONT
}

uiLayer(999, (c, w, h) => {
	if(!buttons.has(KEYS.TAB)) return
	const columns = Math.max(1, Math.floor((w - 60) / 82))
	let y = h - 25
	for(const line of server.title.split('\n')){
		c.textAlign = 'center'
		c.fillStyle = '#0004'
		c.fillRect(25, y-14, w-50, 14)
		c.styledText(parseInt(line.slice(0, 2), 16) & 255, line.slice(2), w/2, y-13, 12)
		y -= 14
	}
	let i = 0
	c.textAlign = 'left'
	c.fillStyle = '#0004'
	c.fillRect(25, y-10, w-50, 10)
	y -= 9
	const lastRow = server.players.length-server.players.length%columns, short = columns-server.players.length%columns
	for(const {name, skin, health, ping} of server.players){
		const x = w / 2 - columns * 41 - 1 + (i % columns) * 82 + (i>=lastRow)*short*41
		if(!(i%columns)){
			y -= 10
			c.fillStyle = '#0004'
			c.fillRect(25, y-1, w-50, 10)
		}
		i++
		c.fillStyle = '#8884'
		c.fillRect(x, y, 80, 8)
		c.image(skin, x, y)
		c.fillStyle = shadowColors[15]
		c.fillText(name, x + 10, y, 8)
		c.fillStyle = colors[15]
		c.styledText(15, name, x + 9, y + 1, 8, 60)
		const cl = ping < 25 ? 0 : ping < 60 ? 1 : ping < 300 ? 2 : ping < 1000 ? 3 : 4
		c.image(pingIcons, x+70, y, 10, 7, 0, cl*8, 10, 7)
	}
	c.fillStyle = '#0004'
	c.fillRect(25, y-13, w-50, 12)
	y -= 11
	for(const line of server.sub.split('\n')){
		c.textAlign = 'center'
		c.fillStyle = '#0004'
		c.fillRect(25, y-12, w-50, 10)
		c.styledText(parseInt(line.slice(0, 2), 16) & 255, line.slice(2), w/2, y-9, 8)
		y -= 10
	}
})


button(KEYS.F2, () => {
	c.canvas.toBlob(download, 'image/png')
})