import './gamma.js'
import { playerControls } from './controls.js'
import { DataWriter } from '/server/modules/dataproto.js'
import { mePhysics, fastCollision } from './entity.js'
import { entityMap, map, cam, onPlayerLoad, world, me, W2, H2, SCALE } from 'world'
import { goto, peek } from 'ant'
import * as pointer from './pointer.js'
import { options, _renderPhases, renderBoxes, send, download, copy, setPlaying, drawText, calcText, _networkUsage, listen, _tickPhases, renderUI, _cbs, _cbs1, onmousemove, onwheel, _optionListeners, _onvoice, voice, _onPacket, onfocus, onblur, onkey, ongesture, onpress, playing, paused, ptrlock, exitPtrlock, movementScale, gl, actx, preframe } from 'api'
import { _recalcDimensions, Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, Block, Item, Entity, Classes } from 'definitions'
import { jsonToType } from '/server/modules/dataproto.js'
import { onChat } from './chat.js'
import { loadingChunks } from './incomingPacket.js'
import './frame.js'

preframe.bind(playerControls)

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
	goto(x, y); peek().random?.()
	for(const e of entityMap.values()) if(e.tick) e.tick()
	for(const ch of map.values()){
		if(!ch.ticks.size) continue
		for(const {0:i,1:v} of ch.ticks){
			const id=ch[i],b=id==65535?ch.tileData.get(i):BlockIDs[i]
			goto(ch, i)
			const v1 = b.update?.(v)
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
	if(navigator.getGamepads) uptGamepads()
	const correctT = t
	const speed = options.speed ?? 1
	t *= speed; dt *= speed
	if(dt > 1e-9){
		_networkUsage()
		const p = 0.5**(dt*2)
		fps = round((frames = frames*p+1) * (1-p)/dt)
	}
	if(loadingChunks || !me){
		const s = options.guiScale * pixelRatio * 2, w = ctx.width/s, h = ctx.height/s
		ctx.reset(s/ctx.width, 0, 0, s/ctx.height, (w>>1)/w, (h>>2)/h)
		const arr = calcText(connMsg||'Loading chunks...', _, 271 | 16)
		drawText(ctx, arr, -arr.width*8, 0, 16)
		return
	}
	setPlaying(true)
	cam.minZoom = max(innerWidth,innerHeight)/(ceil(sqrt(map.size))-1.375)/(2048>>!renderBoxes)
	preframe.fire()
	for(const entity of entityMap.values()) fastCollision(entity)
	const tzoom = (me.state & 4 ? -0.13 : 0) * ((1 << options.ffx * (options.camera != 4)) - 1) + 1
	cam.z = cam.z**.75 * max(cam.minZoom, 2 ** (options.zoom * 8 - 4) * tzoom * 2**cam.baseZ)**.25
	_recalcDimensions(cam.z)
	if(!me.linked && !renderUI && !(me.health <= 0)) cam.x = me.ix = me.x, cam.y = me.iy = me.y
	else if(options.camera == CAMERA_DYNAMIC){
		const D = me.state & 4 ? 0.7 : 2
		const dx = ifloat(me.x + pointer.x/D - cam.x + cam.baseX), dy = ifloat(me.y + pointer.y/D + me.head - cam.y + cam.baseY)
		if(abs(dx) > 64) cam.x += dx
		else{
			if(!camMovingX && abs(dx) > pointer.REACH / 2) camMovingX = true
			else if(camMovingX && abs(dx) < pointer.REACH / 4) camMovingX = false
			if(camMovingX) cam.x = ifloat(cam.x + (dx - sign(dx)*(pointer.REACH/4+0.25)) * dt * 4)
		}
		if(abs(dy) > 64) cam.y += dy
		else{
			if(!camMovingY && abs(dy) > pointer.REACH / 2) camMovingY = true
			else if(camMovingY && abs(dy) < pointer.REACH / 4) camMovingY = false
			if(camMovingY) cam.y = ifloat(cam.y + (dy - sign(dy)*(pointer.REACH/4+0.25)) * dt * 7)
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
		else if(dx > W2 - 1) cam.x += W2*2 - 4
		else if(dx < 1 - W2) cam.x -= W2*2 - 4
		if(abs(dy) > H2 * 2 - 2) cam.y += dy
		else if(dy > H2 - 1) cam.y += H2*2 - 4
		else if(dy < 1 - H2) cam.y -= H2*2 - 4
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
	uptElements()
	t=correctT
	changed.clear()
	for(const t of touches.values()){
		t.dx = t.dy = 0
		if((t.d<16&&t.age<.5)&((t.age+=dt)>=.5)){
			// long press
		}
	}
	cursor.dx = cursor.dy = cursor.mx = cursor.my = 0
	gesture.dx = gesture.dy = gesture.rot = 0
	gesture.scale = 1
	if(playing && !paused && !document.pointerLockElement) ptrlock()
	else if(!playing && document.pointerLockElement) exitPtrlock()
}
globalThis.cam = cam


onkey(KEYS.F2, () => requestAnimationFrame(() => gl.canvas.toBlob(blob => {
	const f = new File([blob], 'screenshot-'+timestamp(), blob)
	if(buttons.has(KEYS.ALT)) copy(f), flashbang = 1
	else download(f)
}, 'image/png')))
let rec = null
const timestamp = (d = new Date()) => `${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDate()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
gl.canvas.style.outlineOffset = '-1px'
onkey(KEYS.F6, () => {
	if(!rec){
		audioOut = actx.createMediaStreamDestination()
		bgGain.connect(audioOut)
		const s = gl.canvas.captureStream()
		s.addTrack(audioOut.stream.getTracks()[0])
		rec = new MediaRecorder(s, {videoBitsPerSecond: buttons.has(KEYS.ALT) ? 100e5 : 40e5})
		const chunks = []
		rec.ondataavailable = e => chunks.push(e.data)
		rec.onstop = (e) => {
			download(new File(chunks, 'recording-'+timestamp(), {type: e.target.mimeType}))
			chunks.length = 0
		}
		rec.start()
		gl.canvas.style.outline = options.guiScale*2+'px red solid'
		return
	}
	rec.stop(); rec = null
	bgGain.disconnect(audioOut)
	audioOut = null
	gl.canvas.style.outline = ''
})

Object.assign(globalThis, {Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, me})

Classes[0] = {savedata: null, savedatahistory: []}
let loading = 1
let msgQueue = []
const loaded = () => {
	for(const data of msgQueue) try{ onMsg({data}) }catch(e){Promise.reject(e)}
	loading = -1
	msgQueue = null
}
globalThis.addToQueue = p => p?.then&&(loading++,p.then(()=>--loading||loaded()))
listen('music', () => bgGain.gain.value = options.music * options.music * 2)
listen('sound', () => masterVolume = options.sound*2)
listen('fps', () => ctxFramerate = options.fps ? options.fps < 1 ? options.fps*250 : Infinity : -1)
let aid = NaN, bid = NaN
__import__.loadAll().then(packs => {
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
	const list = packs[3].split('\n')
	for(let i = 0; i < Classes.length; i++){
		const h = (list[i]||'{}').split(' ')
		Classes[i].savedata = jsonToType(h.pop())
		Classes[i].savedatahistory = h.mmap(jsonToType)
	}
	let i
	i = 0; for(const b of packs[0].split('\n')) funcify(b, i++, Blocks)
	i = 0; for(const b of packs[1].split('\n')) funcify(b, i++, Items)
	i = 0; for(const b of packs[2].split('\n')) funcify(b, i++, Entities)
	if(!--loading) loaded()
})

import click from "/core/img/click.mp3"
import { uptElements } from './api.js'

document.onclick = e => {
	if(!paused) return
	document.documentElement.style.cursor = ''
	e&&click(); ptrlock()
}
let lastMx = 0, lastMy = 0
document.onmousemove = ({movementX, movementY, clientX, clientY}) => {
	const dx = movementX * movementScale, dy = -movementY * movementScale
	if(Math.hypot(lastMx - (lastMx=dx), lastMy - (lastMy=dy)) > 150) return
	cursor.dx -= cursor.x - (cursor.x=clientX / innerWidth)
	cursor.dy -= cursor.y - (cursor.y=1 - clientY / innerHeight)
	if(document.pointerLockElement){
		cursor.mx += dx; cursor.my += dy
		onmousemove.fire(dx, dy)
	}
}

document.onkeydown = e => {
	e.preventDefault()
	if(e.repeat) return
	const n = e.keyCode
	buttons.set(n); changed.set(n)
	if(_cbs[n]) for(const f of _cbs[n]) f(n)
}
document.onkeyup = e => {
	e.preventDefault()
	const n = e.keyCode
	buttons.unset(n); changed.set(n)
	if(_cbs1[n]) for(const f of _cbs1[n]) f(n)
}
document.onmousedown = e => {
	if(paused || document.activeElement != document.body) return
	e.preventDefault()
	const n = e.button
	buttons.set(n); changed.set(n)
	if(_cbs[n]) for(const f of _cbs[n]) f(n)
}
document.onmouseup = e => {
	if(paused || document.activeElement != document.body) return
	e.preventDefault()
	const n = e.button
	buttons.pop(n) && changed.set(n)
	if(_cbs1[n]) for(const f of _cbs1[n]) f(n)
}
document.oncontextmenu = e => e.preventDefault()
addEventListener('wheel', e => {
	e.preventDefault()
	onwheel.fire(e.deltaX * movementScale, e.deltaY * movementScale)
}, {passive: false})
document.ontouchstart = document.ontouchmove = e => {
	for(let i = 0; i < e.changedTouches.length; i++){
		const t = e.changedTouches[i]
		const id = t.identifier, x = t.clientX / innerWidth, y = 1 - t.clientY / innerHeight
		let v = touches.get(id)
		if(!v) return void touches.set(id, v = {x: x, y: y, dx: 0, dy: 0, age: 0, d: 0})
		const ox = v.x, oy = v.y, dx = (v.x=x)-ox, dy = (v.y=y)-oy
		v.dx += dx; v.dy += dy
		if((v.d += hypot(dx*innerWidth,dy*innerHeight)) < 16) return
		if(aid!=aid) aid=id
		else if(aid!=id&&bid!=bid) bid=id
		if(bid==bid){
			const other = aid==id?touches.get(aid):bid==id?touches.get(bid):null
			if(!other) return
			const px = dx/2, py = dy/2
			const x1 = (x-other.x)*innerWidth, y1 = (y-other.y)*innerHeight
			const x2 = (ox-other.x)*innerWidth, y2 = (oy-other.y)*innerHeight
			const s = sqrt((x1*x1+y1*y1)/(x2*x2+y2*y2))
			const r = atan2(x1*y2-y1*x2, x1*x2+y1*y2)
			gesture.dx += px; gesture.dy += py
			gesture.scale *= s; gesture.rot += r
			ongesture.fire(px, py, s, r)
		}else if(aid==id){
			gesture.dx += dx; gesture.dy += dy
			ongesture.fire(dx, dy, 1, 0)
		}
	}
}
document.ontouchend = e => {
	for(let i = 0; i < e.changedTouches.length; i++){
		const id = e.changedTouches[i].identifier
		const v = touches.get(id); touches.delete(id)
		if(v.d < 16 && v.age < .5) onpress.fire(v.x, v.y)
		id==bid?bid=NaN:id==aid?(aid=bid,bid=NaN):0
	}
}

function uptGamepads(){
	if(paused){
		cursor.jlx = cursor.jrx = cursor.jly = cursor.jry = 0
		return
	}
	for(const d of navigator.getGamepads()){
		if(!d) continue
		let i = (d.mapping != 'standard')<<6|256
		for(const b of d.buttons){
			if(b.pressed || b == 1){
				if(!buttons.has(i)){
					buttons.set(i); changed.set(i)
					if(_cbs[i]) for(const f of _cbs[i]) f(i)
					if(i===320) document.exitPointerLock?.()
				}
			}else if(buttons.has(i)){
				buttons.unset(i), changed.set(i)
				if(_cbs1[i]) for(const f of _cbs1[i]) f(i)
			}
			i++
		}
		let x = d.axes[0], y = d.axes[1]
		let l = hypot(x, y)
		if(l > 1) x /= l, y /= l
		cursor.jlx = x; cursor.jly = y
		x = d.axes[2], y = d.axes[3]
		l = hypot(x, y)
		if(l > 1) x /= l, y /= l
		cursor.jrx = x; cursor.jry = y
	}
}

let connMsg = ''
const onMsg = ({data,origin}) => {
	if(origin=='null') return
	if(Array.isArray(data)){
		if(data.length == 2){
			const {0:a,1:b} = data
			options[a] = b
			if(_optionListeners[a]) for(const f of _optionListeners[a]) f(b)
			return
		}
	}else if(data instanceof ArrayBuffer){
		if(loading>0) return void msgQueue.push(data)
		_onPacket(data)
	}else if(typeof data == 'string') onChat(data)
	else if(data instanceof Float32Array) _onvoice?.(data)
	else if(typeof data == 'number'){
		if(data > 0) voice.sampleRate = data
		else if(data >= -4) (data==-3?onfocus:onblur).fire()
	}
}
addEventListener('message', onMsg)
parent.postMessage(null, '*')

await new Promise(onPlayerLoad)
document.onclick()