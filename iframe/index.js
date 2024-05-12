import { playerControls } from './controls.js'
import { DataWriter, DataReader } from '/server/modules/dataproto.js'
import { mePhysics, stepEntity } from './entity.js'
import { gridEventMap, getblock, entityMap, map, cam, server, world, bigintOffset, me } from 'world'
import * as pointer from './pointer.js'
import { onKey, drawLayer, options, paused, _renderPhases, renderBoxes, renderF3, send, download, pause, _updatePaused } from 'api'
import { particles, blockAtlas, _recalcDimensions, W2, H2, SCALE, toBlockExact } from 'definitions'
import { VERSION } from '../server/version.js'
import { prep } from './definitions.js'

let last = performance.now(), count = 1.1, timeToFrame = 0
setInterval(function(){
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
	world.animTick = world.tick%1728000
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
const CAMERA_DYNAMIC = 0, CAMERA_FOLLOW_SMOOTH = 1, CAMERA_FOLLOW_POINTER = 2,
	CAMERA_FOLLOW_PLAYER = 3, CAMERA_PAGE = 4
export function frame(){
	const now = performance.now()
	eluStart()
	//dt += (min(300, now - lastFrame) / 1000 * options.speed - dt) / round(.333333/dt)
	lastFrame = now
	if(!me) return
	pause(false)
	playerControls()
	for(const entity of entityMap.values()) stepEntity(entity)
	const tzoom = (me.state & 4 ? -0.13 : 0) * ((1 << options.ffx * (options.camera != 4)) - 1) + 1
	cam.z = sqrt(sqrt(cam.z * cam.z * cam.z * 2 ** (options.zoom * 10 - 6) * tzoom * 2**cam.baseZ))
	_recalcDimensions(cam.z)
	const reach = pointer.effectiveReach()
	if(options.camera == CAMERA_DYNAMIC){
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
	}else if(options.camera == CAMERA_FOLLOW_SMOOTH){
		const dx = ifloat(me.x + pointer.x - cam.x + cam.baseX), dy = ifloat(me.y + pointer.y + me.head - cam.y + cam.baseY)
		if(abs(dx) > 64) cam.x += dx
		else cam.x += dx * dt
		if(abs(dy) > 64) cam.y += dy
		else cam.y += dy * dt
	}else if(options.camera == CAMERA_FOLLOW_POINTER){
		cam.x = me.x + pointer.x + cam.baseX
		cam.y = me.y + me.head + pointer.y + cam.baseY
	}else if(options.camera == CAMERA_FOLLOW_PLAYER){
		cam.x = me.x + cam.baseX
		cam.y = me.y + me.head / 2 + cam.baseY
	}else if(options.camera == CAMERA_PAGE){
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
	if(cam.f!=cam.baseF) cam.f += (cam.baseF - cam.f) * min(1, dt*4/sqrt(abs(cam.baseF - cam.f)))
	for(const phase of _renderPhases){
		try{
			switch(phase.coordSpace){
				case 1:
					const s = options.guiScale * pixelRatio * 2
					ctx.reset(s/ctx.width, 0, 0, s/ctx.height, 0, 0)
					phase(ctx, ctx.width / s, ctx.height / s)
					break
				case 2:
					ctx.reset(SCALE/ctx.width, 0, 0, SCALE/ctx.height, .5, .5)
					ctx.rotate(-cam.f)
					phase(ctx)
					break
				default:
					ctx.reset()
					phase(ctx, ctx.width, ctx.height)
			}
		}catch(e){Promise.reject(e)}
	}
	timeToFrame = performance.now() - now
	changed.clear()
	delta.x = delta.y = 0
	delta.jlx = delta.jly = 0
	delta.jrx = delta.jry = 0
	_updatePaused()
}
globalThis.cam = cam
const chunkShader = Shader(`void main(){
	uvec2 a = arg0().xy;
	if(a.y>=65535u) discard;
	if(a.y>255u){
		a.x += uint(uni1)%((a.y>>8u)+1u);
		a.y &= 255u;
		if(a.x>65535u){ a.y += a.x>>8u&65280u; a.x &= 65535u; }
	}
	ivec3 p = ivec3(int(a.x&255u)<<4|int(pos.x*1024.)&15, int(a.x>>8u)<<4|int(pos.y*1024.)&15,a.y);
	p.xy >>= uni2;
	color = getPixel(uni0, p, uni2);
}`, UCOLOR, [TEXTURE, FLOAT, INT], FIXED)
const chunkLineCol = vec4(0, .4, 1, 1)
const axisLineCol = vec4(0, 0, 1, 1)
drawLayer('none', 200, (ctx, w, h) => {
	const a = cam.z / 12
	const chunkSublineCol = vec4(0, .53*a, a, a)

	const hitboxes = renderBoxes + buttons.has(KEYS.SYMBOL)
	ctx.reset(1/ctx.width,0,0,1/ctx.height,0.5,0.5)
	ctx.rotate(cam.f)
	ctx.translate(.001+ctx.width/2%1, .001+ctx.height/2%1)
	ctx.shader = chunkShader
	prep()
	const mipmap = max(0, min(4, 4-round(log2(SCALE))))
	chunkShader.uniforms(blockAtlas, world.animTick, mipmap)
	const sr = sin(cam.f), cr = cos(cam.f)
	const x0 = -w*cr+h*sr, x1 = w*cr-h*sr, x2 = w*cr+h*sr, x3 = -w*cr-h*sr
	const y0 = -w*sr+h*cr, y1 = w*sr-h*cr, y2 = w*sr+h*cr, y3 = -w*sr-h*cr
	const limX = max(x0,x1,x2,x3)/2, limY = max(y0,y1,y2,y3)/2
	const S = 64*SCALE
	for(const chunk of map.values()){
		const cxs = chunk.x << 6, cys = chunk.y << 6
		// fix silly floating point precision issue by adding .01
		// this means if one calculation produces 10.499999998 and another produces 10.500000004
		// both will be rounded to 11, instead of one to 10 and one to 11
		// which caused ugly artifacts at non integer zoom levels
		// the artifacts come back with MSAA however :(
		const x0 = ifloat(cxs - cam.x) * SCALE
		const y0 = ifloat(cys - cam.y) * SCALE
		if(x0+S <= -limX || y0+S <= -limY || x0 >= limX || y0 >= limY){ if(chunk.ctx) chunk.hide(); continue }
		if(!chunk.ctx) chunk.draw()
		const a = ctx.sub()
		a.drawRect(x0, y0, S, S, chunk.ctx)
		a.shader = null
		const l = a.sub()
		for(const i of chunk.rerenders){
			const xn0 = (i&63)*SCALE+x0, yn0 = (i>>6)*SCALE+y0
			const xa0 = round(xn0), ya0 = round(yn0)
			l.box(xa0, ya0, round(xn0+SCALE)-xa0, round(yn0+SCALE)-ya0)
			const b = chunk[i]
			void(b==65535?chunk.tileData.get(i):BlockIDs[b]).render(l, cxs|(i&63),cys|(i>>6))
			l.resetTo(a)
		}
		if(hitboxes){
			a.box(x0, y0, S, S)
			if(hitboxes >= 2){
				for(let i = .125; i < 1; i += .125)
					a.drawRect(i - 1/4096, 0, 1/2048, 64, chunkSublineCol)
				for(let i = .125; i < 1; i += .125)
					a.drawRect(0, i - 1/4096, 64, 1/2048, chunkSublineCol)
			}
			a.drawRect(0, 0, 1/2048, 1, chunkLineCol)
			a.drawRect(0, 0, 1, 1/2048, chunkLineCol)
			a.drawRect(1, 0, -1/2048, 1, chunkLineCol)
			a.drawRect(0, 1, 1, -1/2048, chunkLineCol)
		}
	}
	ctx.shader = null
	ctx.reset(SCALE/ctx.width,0,0,SCALE/ctx.height,0.5,0.5)
	ctx.rotate(-cam.f)
	if(hitboxes >= 2){
		if(abs(cam.x) <= W2 + 0.0625)
			ctx.drawRect((-cam.x-0.0625),-H2,0.125,H2*2, axisLineCol)
		if(abs(cam.y) <= H2 + 0.0625)
			ctx.drawRect(-W2,(-cam.y-0.0625),W2*2,0.125, axisLineCol)
		if(abs(ifloat(cam.x + 2147483648)) <= W2 + 0.0625)
			ctx.drawRect(ifloat(W2-cam.x+2147483648-0.0625),0,0.125,-H2*2, axisLineCol)
		if(abs(ifloat(cam.y + 2147483648)) <= H2 + 0.0625)
			ctx.drawRect(0,ifloat(cam.y+2147483648-H2-0.0625),W2*2,0.125, axisLineCol)
		const mx = floor(me.ix), my = floor(me.iy)
		const refx = me.ix - mx, refy = me.iy - my
		ctx.translate(ifloat(mx - cam.x), ifloat(my - cam.y))
		const LENGTH = 6
		const ct2 = ctx.sub()
		for(let x = -LENGTH; x <= LENGTH; x++)
		for(let y = -LENGTH; y <= LENGTH; y++){
			const bl = getblock(mx + x, my + y)
			const col = bl.solid ? vec4(.8) : bl.fluidType ? vec4(0,0,.8,.8) : bl.blockShape ? vec4(.53) : bl.targettable ? vec4(.21,.21,.21,.8) : vec4(0)
			const tint = vec4(min(1, ((x - refx) * (x - refx) + (y - refy) * (y - refy))/LENGTH/LENGTH))
			ct2.translate(x, y)
			continue
			ct2.save()
			ct2.lineWidth = 0.0625
			bl.trace(ct2)
			ct2.clip(); ct2.stroke()
			ct2.restore()
			ct2.resetTo(ctx)
		}
	}
})
drawLayer('none', 300, ctx => {
	for(const ev of gridEventMap.values()){
		toBlockExact(ctx, ev.x, ev.y)
		if(!map.has((ev.x>>>6)+(ev.y>>>6)*0x4000000) || ev(ctx)) gridEventMap.delete(ev.i)
	}
})
function renderEntity(ctx, entity, a=1){
	if(!entity.render) return
	const hitboxes = buttons.has(KEYS.SYMBOL) + renderBoxes
	if(entity == me || dt > 1/30)entity.ix = entity.x, entity.iy = entity.y
	else{
		entity.ix += ifloat(entity.x - entity.ix) * dt * 20
		entity.iy += ifloat(entity.y - entity.iy) * dt * 20
	}
	ctx.translate(ifloat(entity.ix - cam.x), ifloat(entity.iy - cam.y))
	//entity.render(ctx.sub())
	return
	if(hitboxes){
		if(entity.head){
			ctx.fillStyle = '#fc0'
			const L = entity == me ? sqrt(pointer.x * pointer.x + pointer.y * pointer.y) : 0.8
			if(hitboxes >= 2){
				ctx.push()
					ctx.translate(0, entity.head)
					ctx.rotate(-entity.f)
					ctx.fillRect(-0.015625,-0.015625,0.03125,L)
					ctx.translate(0,L); ctx.rotate(PI * 1.25)
					ctx.fillRect(-0.015625,-0.015625,0.03125,0.2)
					ctx.fillRect(-0.015625,-0.015625,0.2,0.03125)
				ctx.pop()
			}
			ctx.fillStyle = '#f00c'
			ctx.fillRect(-entity.width + 0.046875, entity.head - 0.0234375, entity.width*2 - 0.09375, 0.046875)
		}
		ctx.strokeStyle = '#fffc'
		ctx.lineWidth = 0.046875
		ctx.strokeRect(-entity.width + 0.03125, 0.03125, entity.width * 2 - 0.0625, entity.height - 0.0625)
	}
}
drawLayer('world', 100, (ctx, w, h) => {
	for(const e of entityMap.values()) renderEntity(ctx.sub(), e)
	if(!me.linked && !(me.health<=0))
		renderEntity(ctx.sub(), me, .2)
})
drawLayer('world', 400, ctx => {
	if(paused) return
	pointer.drawPointer(ctx)
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

drawLayer('ui', 1000, (ctx, w, h) => {
	return
	if(!renderF3 && !buttons.has(KEYS.SYMBOL)) return
	ctx.textAlign = 'left'
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
		let {top, bottom, width} = ctx.measureText(t, 10)
		top++; bottom++; width += 2; y -= top + bottom
		ctx.fillStyle = '#6b6b6b6e'
		ctx.fillRect(1, y, width, top + bottom)
		ctx.fillStyle = '#fff'
		ctx.fillText(t, 2, y + bottom, 10, w/1-3)
	}
	const mex = floor(me.x) >> 3 & 6, mexi = (floor(me.x) & 15) / 16
	y = h - 1
	ctx.textAlign = 'right'
	const lookingAt = getblock(floor(pointer.x + me.x), floor(pointer.y + me.y + me.head))
	for(const t of `Tick ${world.tick}, Day ${floor((world.tick+6000)/24000)}, Time ${floor((world.tick/1000+6)%24).toString().padStart(2,'0')}:${(floor((world.tick/250)%4)*15).toString().padStart(2,'0')}
Dimension: ${world.id}
Biome: ${me.chunk ? round(me.chunk.biomes[mex] * (1 - mexi) + me.chunk.biomes[mex+2] * mexi) : 0}/${me.chunk ? round(me.chunk.biomes[mex+1] * (1 - mexi) + me.chunk.biomes[mex+3] * mexi) : 0}
Looking at: ${lookingAt.className+(lookingAt.savedata?' {...}':'')} (${lookingAt.id})
`.slice(0, -1).split('\n')){
		let {top, bottom, width} = ctx.measureText(t, 10)
		top++; bottom++; width += 2; y -= top + bottom
		ctx.fillStyle = '#7777'
		ctx.fillRect(w - width - 1, y, width, top + bottom)
		ctx.fillStyle = '#fff'
		ctx.fillText(t, w - 2, y + bottom, 10, w/1-3);
	}
})
const src = loader(import.meta)
const icons = Img(src`/vanilla/icons.png`)
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

drawLayer('ui', 999, (ctx, w, h) => {
	return
	if(!buttons.has(KEYS.TAB)) return
	const columns = Math.max(1, Math.floor((w - 60) / 82))
	let y = h - 25
	for(const line of server.title.split('\n')){
		ctx.textAlign = 'center'
		ctx.fillStyle = '#0004'
		ctx.fillRect(25, y-14, w-50, 14)
		ctx.styledText(parseInt(line.slice(0, 2), 16) & 255, line.slice(2), w/2, y-13, 12)
		y -= 14
	}
	let i = 0
	ctx.textAlign = 'left'
	ctx.fillStyle = '#0004'
	ctx.fillRect(25, y-10, w-50, 10)
	y -= 9
	const lastRow = server.players.length-server.players.length%columns, short = columns-server.players.length%columns
	for(const {name, skin, health, ping} of server.players){
		const x = w / 2 - columns * 41 - 1 + (i % columns) * 82 + (i>=lastRow)*short*41
		if(!(i%columns)){
			y -= 10
			ctx.fillStyle = '#0004'
			ctx.fillRect(25, y-1, w-50, 10)
		}
		i++
		ctx.fillStyle = '#8884'
		ctx.fillRect(x, y, 80, 8)
		ctx.image(skin, x, y)
		ctx.fillStyle = shadowColors[15]
		ctx.fillText(name, x + 10, y, 8)
		ctx.fillStyle = colors[15]
		ctx.styledText(15, name, x + 9, y + 1, 8, 60)
		const cl = ping < 25 ? 0 : ping < 60 ? 1 : ping < 300 ? 2 : ping < 1000 ? 3 : 4
		ctx.image(pingIcons, x+70, y, 10, 7, 0, cl*8, 10, 7)
	}
	ctx.fillStyle = '#0004'
	ctx.fillRect(25, y-13, w-50, 12)
	y -= 11
	for(const line of server.sub.split('\n')){
		ctx.textAlign = 'center'
		ctx.fillStyle = '#0004'
		ctx.fillRect(25, y-12, w-50, 10)
		ctx.styledText(parseInt(line.slice(0, 2), 16) & 255, line.slice(2), w/2, y-9, 8)
		y -= 10
	}
})


onKey(KEYS.F2, () => requestAnimationFrame(() => _gl.canvas.toBlob(download, 'image/png')))
import('./ipc.js')
import('./incomingPacket.js')