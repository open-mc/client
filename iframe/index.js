import { playerControls } from './controls.js'
import { DataWriter } from '/server/modules/dataproto.js'
import { mePhysics, stepEntity } from './entity.js'
import { gridEventMap, getblock, entityMap, map, cam, onPlayerLoad, world, bigintOffset, me } from 'world'
import * as pointer from './pointer.js'
import { onKey, drawLayer, options, paused, _renderPhases, renderBoxes, renderF3, send, download, copy, pause, _updatePaused, drawText, calcText, textShadeCol, _networkUsage, networkUsage, onfocus } from 'api'
import { particles, blockAtlas, _recalcDimensions, W2, H2, SCALE, toBlockExact, prep } from 'definitions'
import { VERSION } from '../server/version.js'

let last = performance.now(), timeToFrame = 0
export function step(){
	const now = performance.now()
	const update = 1000 / world.tps
	let dt = now - last
	last = now
	if(!me) return
	let tickcount = floor(dt/update)
	dt -= tickcount*update
	while(tickcount--) tick()
	last -= dt
}

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
export let zoom_correction = 0
let camMovingX = false, camMovingY = false
const CAMERA_DYNAMIC = 0, CAMERA_FOLLOW_SMOOTH = 1, CAMERA_FOLLOW_POINTER = 2,
	CAMERA_FOLLOW_PLAYER = 3, CAMERA_PAGE = 4
let flashbang = 0
let frames = 0
globalThis.fps = 0
globalThis.frameCount = 0
onfocus.bind(() => frameCount = 0)
export function frame(){
	const correctT = t
	t *= options.speed; dt *= options.speed
	_networkUsage()
	const p = 0.5**(dt*max(60-++frameCount,2))
	fps = round((frames = frames*p+1) * (1-p)/dt)
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
		else if(dx > W2 - 1)cam.x += W2*2 - 4
		else if(dx < 1 - W2)cam.x -= W2*2 - 4
		if(abs(dy) > H2 * 2 - 2) cam.y += dy
		else if(dy > H2 - 1)cam.y += H2*2 - 4
		else if(dy < 1 - H2)cam.y -= H2*2 - 4
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
					cam.transform(ctx, SCALE)
					phase(ctx)
					break
				default:
					ctx.reset()
					phase(ctx, ctx.width, ctx.height)
			}
		}catch(e){Promise.reject(e)}
	}
	if(flashbang) ctx.reset(), ctx.drawRect(1, 0, -flashbang, flashbang, vec4(flashbang*.667)), flashbang = max(0, flashbang-dt*3)
	timeToFrame = performance.now()/1000 - (t=correctT)
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
let visibleChunks = 0
drawLayer('none', 200, (ctx, w, h) => {
	const a = cam.z / 12
	const chunkSublineCol = vec4(0, .53*a, a, a)
	const hitboxes = renderBoxes + buttons.has(KEYS.SYMBOL)
	cam.transform(ctx)
	ctx.shader = chunkShader
	prep()
	const mipmap = max(0, min(4, 4-round(log2(SCALE))))
	chunkShader.uniforms(blockAtlas, world.animTick, mipmap)
	const sr = sin(cam.f), cr = cos(cam.f)
	const limX = (abs(ctx.width*cr)+abs(ctx.height*sr)+(cam.nausea*.333*ctx.height))/2, limY = (abs(ctx.width*sr)+abs(ctx.height*cr)+(cam.nausea*.333*ctx.width))/2
	const S = 64*SCALE
	const lineWidth = .5/min(1024,S)
	visibleChunks = 0
	for(const chunk of map.values()){
		const cxs = chunk.x << 6, cys = chunk.y << 6
		const x0 = ifloat(cxs - cam.x) * SCALE
		const y0 = ifloat(cys - cam.y) * SCALE
		if(x0+S <= -limX || y0+S <= -limY || x0 >= limX || y0 >= limY){ if(chunk.ctx) chunk.hide(); continue }
		visibleChunks++
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
					a.drawRect(i - lineWidth*.5, 0, lineWidth, 64, chunkSublineCol)
				for(let i = .125; i < 1; i += .125)
					a.drawRect(0, i - lineWidth*.5, 64, lineWidth, chunkSublineCol)
			}
			a.drawRect(0, 0, lineWidth*2, 1, chunkLineCol)
			a.drawRect(0, 0, 1, lineWidth*2, chunkLineCol)
			a.drawRect(1, 0, -lineWidth*2, 1, chunkLineCol)
			a.drawRect(0, 1, 1, -lineWidth*2, chunkLineCol)
		}
	}
	ctx.shader = null
	ctx.scale(SCALE)
	const lineWidth2 = 1/min(8,SCALE)
	if(hitboxes >= 2){
		if(abs(cam.x) <= W2 + 0.0625)
			ctx.drawRect((-cam.x-lineWidth2*.5),-H2,lineWidth2,H2*2, axisLineCol)
		if(abs(cam.y) <= H2 + lineWidth2*.5)
			ctx.drawRect(-W2,(-cam.y-lineWidth2*.5),W2*2,lineWidth2, axisLineCol)
		if(abs(ifloat(cam.x + 2147483648)) <= W2 + lineWidth2*.5)
			ctx.drawRect(ifloat(W2-cam.x+2147483648-lineWidth2*.5),0,lineWidth2,-H2*2, axisLineCol)
		if(abs(ifloat(cam.y + 2147483648)) <= H2 + lineWidth2*.5)
			ctx.drawRect(0,ifloat(cam.y+2147483648-H2-lineWidth2*.5),W2*2,lineWidth2, axisLineCol)
	}
})
drawLayer('none', 300, ctx => {
	for(const ev of gridEventMap.values()){
		toBlockExact(ctx, ev.x, ev.y)
		if(!map.has((ev.x>>>6)+(ev.y>>>6)*0x4000000) || ev(ctx)) gridEventMap.delete(ev.i)
	}
})
const entityHitboxCol = vec4(.8), entityHitboxHeadCol = vec4(.8,0,0,1), entityHitboxFacingCol = vec4(.8, .64, 0, 1)
function renderEntity(ctx, entity, a=1){
	if(!entity.render) return
	const hitboxes = buttons.has(KEYS.SYMBOL) + renderBoxes
	if(entity == me || dt > 1/30)entity.ix = entity.x, entity.iy = entity.y
	else{
		entity.ix += ifloat(entity.x - entity.ix) * dt * 20
		entity.iy += ifloat(entity.y - entity.iy) * dt * 20
	}
	ctx.translate(ifloat(entity.ix - cam.x), ifloat(entity.iy - cam.y))
	entity.render(ctx.sub())
	if(hitboxes){
		if(entity.head){
			const L = entity == me ? sqrt(pointer.x * pointer.x + pointer.y * pointer.y) : 0.8
			if(hitboxes >= 2){
				const ct2 = ctx.sub()
				ct2.translate(0, entity.head)
				ct2.rotate(entity.f)
				ct2.drawRect(-0.015625,-0.015625,0.03125,L,entityHitboxFacingCol)
				ct2.translate(0,L); ct2.rotate(PI * -1.25)
				ct2.drawRect(-0.015625,-0.015625,0.03125,0.2,entityHitboxFacingCol)
				ct2.drawRect(-0.015625,-0.015625,0.2,0.03125,entityHitboxFacingCol)
			}
			ctx.drawRect(-entity.width + 0.046875, entity.head - 0.0234375, entity.width*2 - 0.09375, 0.046875, entityHitboxHeadCol)
		}
		ctx.drawRect(-entity.width, .046875, .046875, entity.height-.09375, entityHitboxCol)
		ctx.drawRect(-entity.width, 0, entity.width*2, .046875, entityHitboxCol)
		ctx.drawRect(entity.width, .046875, -.046875, entity.height-.09375, entityHitboxCol)
		ctx.drawRect(-entity.width, entity.height, entity.width*2, -.046875, entityHitboxCol)
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

const f3LeftInfo = `\\+e[Game version]\\+f (:3 thx for playing)
FPS: \\+a[Frames per second]\\+f (\\+a[time spent drawing frame]\\+f)
Net: \\+a[Network usage]\\+f${performance.memory?', Mem: \\+a[Memory usage]\\+f':''}
Draw: \\+a[GPU mem bandwidth]\\+f/\\+a[Sprite count]\\+f/\\+a[GL draw calls]\\+f
Ch: \\+a[Visible chunks]\\+f/\\+a[Cached chunks]\\+f, E: \\+a[Entities]\\+f, P: \\+a[Particles]\\+f
XY: \\+3[Player feet position]\\+f
ChXY: \\+3[Position w/in chunk]\\+f in \\+3[Chunk coords]\\+f
Facing: \\+c[\\4+L\\0+eft/\\4+R\\0+ight]\\+f \\+d[head direction in deg]\\+f (\\+d[in rad]\\+f)
`.split('\n')
const f3RightInfo = `Tick \\+d[dimension age]\\+f, Day \\+d[current day in MC days]\\+f, Time \\+d[time within MC day]\\+f
Dimension: \\+e[current dimension ID]\\+f
Biome: \\+d[Humidity]\\+f/\\+d[Temperature]\\+f
Looking at: \\+3[Coordinate of block under pointer]\\+f
Block: \\+e[block under pointer]\\+f (\\+a[ID for that block]\\+f)
Block.texture: \\+a[Atlas tex ID of that block]\\+f[\\+d[Animation frames]\\+f]
Item.texture: \\+a[Atlas tex ID of held item]\\+f[\\+d[Animation frames]\\+f]
`.split('\n')
const minif3Info = [`\\27[Game version]\\0f; \\+a[FPS]\\+f; \\4+[Player position]\\0+; \\+6[MC day & time]\\+f; [Looking at block]`]

drawLayer('ui', 1000, (ctx, w, h) => {
	const f3 = min(renderF3+buttons.has(KEYS.SYMBOL), 2)
	if(!f3) return
	const ct2 = ctx.sub()
	ct2.translate(0, h)
	ct2.scale(8, 8)
	const trueX = toString(bigintOffset.x, me.x, f3<2?0:3), trueY = toString(bigintOffset.y, me.y, f3<2?0:3)
	//const fps = round(1/dtSmooth)
	const day = floor((world.tick+6000)/24000), time = floor((world.tick/1000+6)%24).toString().padStart(2,'0')+':'+(floor((world.tick/250)%4)*15).toString().padStart(2,'0')
	let helpOfft = w < 600 ? t%6<3 ? 1 : 0 : NaN
	const mex = floor(me.x) >> 3 & 6, mexi = (floor(me.x) & 15) / 16
	const lookingAt = getblock(floor(pointer.x + me.x), floor(pointer.y + me.y + me.head))
	for(const t of f3<2 ? buttons.has(KEYS.ALT)?minif3Info:[
`\\27${VERSION}\\0f; \\+${(fps<20?'9':fps<50?'3':fps<235?'a':'d')+fps}\\+f fps; \\4+x: ${trueX}, y: ${trueY}\\0+; \\+6Day ${day} ${time}\\+f; ${(lookingAt.id?'':'\\+8')+lookingAt.className}\\+f`
] : buttons.has(KEYS.ALT)?helpOfft==0?[]:f3LeftInfo :
`Paper MC ${VERSION} (Alt for f3 help)
FPS: \\+${(fps<20?'9':fps<50?'3':fps<235?'a':'d')+fps}\\+f (${(timeToFrame*1000).toFixed(2).padStart(5,'\u2007')}ms)
Net: ${Number.formatData(networkUsage)}/s${performance.memory ? ', Mem: '+Number.formatData(performance.memory.usedJSHeapSize) : ''}
Draw: ${Number.formatData(frameData)}/${frameSprites}/${frameDrawCalls}
Ch: ${visibleChunks}/${map.size}, E: ${entityMap.size}, P: ${particles.size}
XY: \\4+${trueX} / ${trueY}\\0+
ChXY: ${(floor(me.x) & 63).toString().padStart(2,'\u2007')} ${(floor(me.y) & 63).toString().padStart(2,'\u2007')} in ${toString(bigintOffset.x>>6n,floor(me.x) >> 6, 0)} ${toString(bigintOffset.y>>6n,floor(me.y) >> 6, 0)}
Facing: ${(me.f >= 0 ? 'R' : 'L') + (90 - abs(me.f / PI2 * 360)).toFixed(1).padStart(5, '\u2007')} (${me.f.toFixed(3)})
`.slice(0, -1).split('\n')){
		const arr = calcText(t)
		ct2.drawRect(.125, -.125, arr.width+.25, -1.25, textShadeCol)
		drawText(ct2, arr, .25, -1.25, 1, 15)
		ct2.translate(0, -1.25)
	}
	if(f3 < 2) return
	ct2.resetTo(ctx)
	ct2.translate(w, h)
	ct2.scale(8, 8)
	const holding = me.inv[me.selected]
	for(const t of buttons.has(KEYS.ALT)?helpOfft==1?[]:f3RightInfo:`Tick ${world.tick}, Day ${day}, Time ${time}
Dimension: ${world.id}
Biome: ${me.chunk ? round(me.chunk.biomes[mex] * (1 - mexi) + me.chunk.biomes[mex+2] * mexi) : 0}/${me.chunk ? round(me.chunk.biomes[mex+1] * (1 - mexi) + me.chunk.biomes[mex+3] * mexi) : 0}
Looking at: \\4+${toString(bigintOffset.x, floor(pointer.x + me.x)|0, 0)} ${toString(bigintOffset.y, floor(pointer.y + me.y + me.head)|0, 0)}\\0+
Block: ${lookingAt.className+(lookingAt.savedata?' {...}':'')} (${lookingAt.id})
Block.texture: ${lookingAt.texture>=0?`${lookingAt.texture.toHex().slice(2)}[${(lookingAt.texture>>>24)+1}]`+(lookingAt.render?'*':''):lookingAt.render?'na*':'na'}
Item.texture: ${holding?.texture>=0?`${holding.texture.toHex().slice(2)}[${(holding.texture>>>24)+1}]`+(holding.render?'*':''):holding?.render?'na*':'na'}
`.slice(0, -1).split('\n')){
		const arr = calcText(t)
		ct2.drawRect(-.125, -.125, -arr.width-.25, -1.25, textShadeCol)
		drawText(ct2, arr, -arr.width-.25, -1.25, 1, 15)
		ct2.translate(0, -1.25)
	}
})


onKey(KEYS.F2, () => requestAnimationFrame(() => {
	const method = buttons.has(KEYS.ALT) ? copy : download
	if(method == copy) flashbang = 1
	_gl.canvas.toBlob(method, 'image/png')
}))
import('./ipc.js')
import('./incomingPacket.js')
await new Promise(onPlayerLoad)