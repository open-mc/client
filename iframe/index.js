import { playerControls } from './controls.js'
import { DataWriter } from '/server/modules/dataproto.js'
import { mePhysics, stepEntity } from './entity.js'
import { getblock, entityMap, map, cam, onPlayerLoad, world, me, W2, H2, SCALE } from 'world'
import * as pointer from './pointer.js'
import { options, paused, _renderPhases, renderBoxes, send, download, copy, pause, _updatePaused, drawText, calcText, _networkUsage, listen, _tickPhases, renderUI, _cbs, onmousemove, _joypadMoveCbs, onwheel, _optionListeners, _setChatFocused, _onvoice, voice, _onPacket, onfocus, onblur, onKey } from 'api'
import { _recalcDimensions, Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, Block, Item, Entity, Classes } from 'definitions'
import { jsonToType } from '/server/modules/dataproto.js'
import { onChat } from './chat.js'
import { loadingChunks } from './incomingPacket.js'
import './frame.js'

let last = performance.now()
globalThis.step = () => {
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
	const t = performance.now()/1000
	if(world.tick % sendDelay == 0 && me && !(me.health <= 0)){
		let buf = new DataWriter()
		buf.byte(4)
		buf.byte(world.r)
		buf.double(me.x)
		buf.double(me.y)
		buf.short(me.state)
		buf.float(me.impactDx); buf.float(me.impactDy)
		me.impactDx = me.impactDy = 0
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
	for(const ch of map.values()){
		if(!ch.ticks.size) continue
		const x = ch.x<<6, y = ch.y<<6
		for(const {0:i,1:v} of ch.ticks){
			const id=ch[i],b=id==65535?ch.tileData.get(i):BlockIDs[i]
			const v1 = b.update?.(v, x|i&63, y|i>>6)
			if(v1 === undefined) ch.ticks.delete(i)
			else if(v1!=v) ch.ticks.set(i, v1)
		}
	}
	for(const f of _tickPhases) try{f(t)}catch(e){Promise.reject(e)}
}
export let zoom_correction = 0
let camMovingX = false, camMovingY = false
const { CAMERA_DYNAMIC, CAMERA_FOLLOW_SMOOTH, CAMERA_FOLLOW_POINTER,
	CAMERA_FOLLOW_PLAYER, CAMERA_PAGE } = pointer
let flashbang = 0
let frames = 0
globalThis.fps = 0
globalThis.frame = () => {
	const correctT = t
	t *= options.speed; dt *= options.speed
	_networkUsage()
	const p = 0.5**(dt*2)
	fps = round((frames = frames*p+1) * (1-p)/dt)
	if(loadingChunks){
		const s = options.guiScale * pixelRatio * 2, w = ctx.width/s, h = ctx.height/s
		ctx.reset(s/ctx.width, 0, 0, s/ctx.height, (w>>1)/w, (h>>2)/h)
		const arr = calcText('Loading chunks...', _, 271 | 16)
		drawText(ctx, arr, -arr.width*8, 0, 16)
		return
	}
	pause(false)
	playerControls()
	for(const entity of entityMap.values()) stepEntity(entity)
	const tzoom = (me.state & 4 ? -0.13 : 0) * ((1 << options.ffx * (options.camera != 4)) - 1) + 1
	cam.minZoom = max(innerWidth,innerHeight)/(ceil(sqrt(map.size))-1.375)/(2048>>!renderBoxes)
	cam.z = cam.z**.75 * max(cam.minZoom, 2 ** (options.zoom * 8 - 4) * tzoom * 2**cam.baseZ)**.25
	_recalcDimensions(cam.z)
	const reach = pointer.effectiveReach()
	if(!me.linked && !renderUI && !(me.health <= 0)) cam.x = me.ix = me.x, cam.y = me.iy = me.y
	else if(options.camera == CAMERA_DYNAMIC){
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
	t=correctT
	changed.clear()
	delta.x = delta.y = 0
	delta.jlx = delta.jly = 0
	delta.jrx = delta.jry = 0
	_updatePaused()
}
globalThis.cam = cam


onKey(KEYS.F2, () => requestAnimationFrame(() => _gl.canvas.toBlob(blob => {
	const f = new File([blob], 'screenshot-'+timestamp(), blob)
	if(buttons.has(KEYS.ALT)) copy(f), flashbang = 1
	else download(f)
}, 'image/png')))
let rec = null
const timestamp = (d = new Date()) => `${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDate()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
_gl.canvas.style.outlineOffset = '-1px'
onKey(KEYS.F6, () => {
	if(!rec){
		audioOut = _actx.createMediaStreamDestination()
		bgGain.connect(audioOut)
		const s = _gl.canvas.captureStream()
		s.addTrack(audioOut.stream.getTracks()[0])
		rec = new MediaRecorder(s, {videoBitsPerSecond: buttons.has(KEYS.ALT) ? 100e5 : 40e5})
		const chunks = []
		rec.ondataavailable = e => chunks.push(e.data)
		rec.onstop = (e) => {
			download(new File(chunks, 'recording-'+timestamp(), {type: e.target.mimeType}))
			chunks.length = 0
		}
		rec.start()
		_gl.canvas.style.outline = options.guiScale*2+'px red solid'
		return
	}
	rec.stop(); rec = null
	bgGain.disconnect(audioOut)
	audioOut = null
	_gl.canvas.style.outline = ''
})

Object.assign(globalThis, {Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, me})

Classes[0] = {savedata: null, savedatahistory: []}
let loading = 1
const loaded = () => {
	for(const data of _msgQueue) try{ onMsg({data}) }catch(e){Promise.reject(e)}
	loading = -1
	_msgQueue = null
}
globalThis.addToQueue = p => p?.then&&(loading++,p.then(()=>--loading||loaded()))
listen('music', () => bgGain.gain.value = options.music * options.music * 2)
listen('sound', () => masterVolume = options.sound*2)
listen('fps', () => ctxFramerate = options.fps ? options.fps < 1 ? options.fps*250 : Infinity : -1)
const onMsg = ({data,origin}) => {
	if(origin=='null') return
	if(Array.isArray(data)){
		if(data.length == 2){
			const {0:a,1:b} = data
			if(typeof a == 'string'){
				options[a] = b
				if(_optionListeners[a]) for(const f of _optionListeners[a]) f(b)
			}else if(me){
				if(paused){
					delta.x = -(cursor.x - (cursor.x = a / innerWidth))
					delta.y = -(cursor.y - (cursor.y = 1 - b / innerHeight))
				}else{
					delta.x = a; delta.y = b
					onmousemove.fire(a, b)
				}
			}
			return
		}else if(data.length == 3){
			const [id, dx, dy] = data
			if(id == 0){
				delta.jlx = -(cursor.jlx - (cursor.jlx = dx))
				delta.jly = -(cursor.jly - (cursor.jly = dy))
			}else if(id == 1){
				delta.jrx = -(cursor.jrx - (cursor.jrx = dx))
				delta.jry = -(cursor.jry - (cursor.jry = dy))
			}
			if(Object.hasOwn(_joypadMoveCbs, id)) for(const cb of _joypadMoveCbs[id]) cb(dx, dy, id)
			return
		}else if(data.length == 1) return data[0]===Infinity?_setChatFocused(true):data[0]===-Infinity?_setChatFocused(false):onwheel.fire(data[0])
		// import scripts
		const list = data[3].split('\n')
		for(let i = 0; i < Classes.length; i++){
			const h = (list[i]||'{}').split(' ')
			Classes[i].savedata = jsonToType(h.pop())
			Classes[i].savedatahistory = h.mmap(jsonToType)
		}
		Promise.all(data.slice(4).map(a => import(a))).then(() => {
			// done importing
			let i
			i = 0; for(const b of data[0].split('\n'))funcify(b, i++, Blocks)
			i = 0; for(const b of data[1].split('\n'))funcify(b, i++, Items)
			i = 0; for(const b of data[2].split('\n'))funcify(b, i++, Entities)
			if(!--loading)loaded()
		})
		function funcify(a, i, Dict){
			const Constructor = Dict == Items ? Item : Dict == Entities ? Entity : Block
			const List = Dict == Items ? ItemIDs : Dict == Entities ? EntityIDs : BlockIDs
			a = a.split(' ')
			const name = a.shift()
			let Thing = Dict[name] || class extends Constructor{static _ = console.warn((Dict == Blocks ? 'Blocks.' : Dict == Items ? 'Items.' : 'Entities.') + name + ' missing!')}
			if(!Object.hasOwn(Thing, 'prototype')) Thing = class extends Thing.__constructor{}
			if(!(Thing.prototype instanceof Constructor)){
				console.warn('Class ' + name + ' does not extend ' + Constructor.name)
				let T = Thing
				for(let i = T; i.prototype; i = Object.getPrototypeOf(i)) T = i;
				Object.setPrototypeOf(T, Constructor)
				Object.setPrototypeOf(T.prototype, Constructor.prototype)
			}
			Thing.id = i
			Thing.className = name
			Thing[Symbol.toStringTag] = (Dict == Blocks ? 'Blocks.' : Dict == Items ? 'Items.' : 'Entities.') + name
			Thing.savedata = a.length ? jsonToType(a.pop()) : null
			Thing.savedatahistory = a.map(jsonToType)
			List[Thing.id] = Thing
			if(Thing.init) Thing.init()

			// Copy static props to prototype
			// This will also copy .prototype, which we want
			let proto = Thing
			do{
				const desc = Object.getOwnPropertyDescriptors(proto), desc2 = Object.getOwnPropertyDescriptors(proto.prototype)
				delete desc.length; delete desc.name
				Object.defineProperties(proto.prototype, desc)
				Object.defineProperties(proto, desc2)
				proto = Object.getPrototypeOf(proto)
			}while(proto.prototype && !Object.hasOwn(proto.prototype, 'prototype'))
			if(Dict == Blocks && !Thing.savedata){
				if(!Thing.savedata) Object.defineProperties(Thing.constructor, Object.getOwnPropertyDescriptors(new Thing))
			}
		}
	}else if(data instanceof ArrayBuffer){
		if(loading>0) return void _msgQueue.push(data)
		_onPacket(data)
	}else if(typeof data == 'string'){
		onChat(data)
	}else if(data instanceof Float32Array) _onvoice?.(data)
	else if(typeof data == 'number'){
		if(!Number.isFinite(data)){
			if(data > 0) onfocus.fire()
			else if(data < 0) onblur.fire()
		}else if(data >= 5e9) voice.sampleRate = data - 5e9
		else if(data >= 0){
			buttons.set(data)
			changed.set(data)
			if(_cbs[data])for(const f of _cbs[data])f()
		}else buttons.pop(~data) && changed.set(~data)
	}else if(typeof data == 'boolean') _updatePaused(data)
}
const m = _msgQueue; _msgQueue = []
for(const data of m) try{ onMsg({data}) }catch(e){ Promise.reject(e) }
addEventListener('message', onMsg)
onmessage = null

await new Promise(onPlayerLoad)