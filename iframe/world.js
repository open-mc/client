import { BlockIDs, Classes } from 'definitions'
import { musicdict } from './sounds.js'
export const map = globalThis.map = new Map
export const entityMap = globalThis.entityMap = new Map()
export const server = {
	title: '',
	sub: '',
	players: [],
	tps: 20, r: 0
}
export const CONFIG = {
	proximitychat: 0
}
export const configLoaded = fn => configLoaded.listeners.push(fn)
configLoaded.listeners = []

export const cam = {x: 0, y: 0, z: .5, f: 0, baseF: 0, baseZ: 0, baseX: 0, baseY: 0, staticX: NaN, staticY: NaN}

function variant(ch, i, x, y, b){
	if(!ch) return
	if(!b){
		const id = ch[i]
		b = id==65535?ch.tileData.get(i):BlockIDs[id]
	}
	if(b.variant){
		const old = b
		if(!(b = b.variant(x, y))) return
		if(b.savedata){
			ch[i] = 65535
			ch.tileData.set(i, b=b===b.constructor?new b:b)
		}else{ ch[i] = b.id; if(old.savedata) ch.tileData.delete(i) }
		updateDrawn(old, b, ch, i)
	}
	return b
}
function updateDrawn(o, n, ch, i){
	if(o.texture && floor(o.texture.h / o.texture.w) > 1){
		if(!n.texture || floor(n.texture.h / n.texture.w) <= 1) ch.animatedTiles[i>>5] &= ~(1 << (i&31))
		else return
	}else if(n.texture && floor(n.texture.h / n.texture.w) > 1) ch.animatedTiles[i>>5] |= 1 << (i&31)
	if(ch.ctx){
		const {texture, render} = n
		ch.ctx.clearRect(i&63, 63-(i>>6), 1, 1)
		let j = ch.rerenders.indexOf(i)
		if((j == -1) & (render != undefined)) ch.rerenders.push(i)
		else if((j > -1) & (render == undefined)) ch.rerenders.splice(j, 1)
		if(texture) ch.ctx.drawImage(texture.canvas,texture.x,texture.y + (world.tick % floor(texture.h / texture.w)) * texture.w,texture.w,texture.w,i&63,63-(i>>6),1,1)
	}
}

export function setblock(x, y, b){
	b = b.savedata&&b===b.constructor?new b:b
	const k = (x>>>6)+(y>>>6)*0x4000000
	const ch = map.get(k)
	if(!ch) return b
	const i = (x & 63) | (y & 63) << 6
	const id = ch[i], old = id==65535?ch.tileData.get(i):BlockIDs[id]
	if(b.savedata){
		ch[i] = 65535
		ch.tileData.set(i, b)
	}else{ ch[i] = b.id; if(old.savedata) ch.tileData.delete(i) }
	updateDrawn(old, b, ch, i)
	variant(ch, i, x, y, b)
	if((i&63) == 63) variant(map.get((x+1>>>6)+(y>>>6)*0x4000000), i&0b111111000000, x+1, y)
	else variant(ch, i+1, x+1, y)
	if((i&63) == 0) variant(map.get((x-1>>>6)+(y>>>6)*0x4000000), i|0b000000111111, x-1, y)
	else variant(ch, i-1, x-1, y)
	if((i>>6) == 63) variant(map.get((x>>>6)+(y+1>>>6)*0x4000000), i&0b000000111111, x, y+1)
	else variant(ch, i+64, x, y+1)
	if((i>>6) == 0) variant(map.get((x>>>6)+(y-1>>>6)*0x4000000), i|0b111111000000, x, y-1)
	else variant(ch, i-64, x, y-1)
	return b
}
export function getblock(x, y){
	const k = (x>>>6)+(y>>>6)*0x4000000
	const ch = map.get(k)
	const i = (x & 63) + ((y & 63) << 6)
	const b = ch?ch[i]:0
	return b==65535?ch.tileData.get(i):BlockIDs[b]
}

const playerLoadCb = []
export const onPlayerLoad = cb => playerLoadCb.push(cb)
const SPEEDOFSOUND = 340
export function sound(fn, x, y, vol = 1, pitch = 1){
	if(Array.isArray(fn)) fn = fn[floor(random() * fn.length)]
	if(!me) return
	x = ifloat(x - me.x + .5); y = ifloat(y - me.y + me.head + .5)
	const dist = sqrt(x * x + y * y)
	// Let's see if I can get the physics right from the top of my head
	// The speed of sound is 340m/s. This means a sound approaching at a speed of 340m/s => 2x pitch, -170m/s => 0.5x pitch, -340m/s => 0x pitch (sound can never reach)
	// The dot product (x0,y0) . (x1,y1) is x0*x1 + y0*y1
	// "Fix" the inputs x and y by normalizing them with `/ dist`
	const speed = (me.dx * x + me.dy * y) / dist
	// For 2d, the inverse square law becomes the inverse linear law
	fn(vol * 2 / (dist + 1), pitch * max(SPEEDOFSOUND / 20, speed + SPEEDOFSOUND) / SPEEDOFSOUND, min(1, max(-1, x / 16)))
}

export const gridEventMap = new Map
export const gridEvents = new Array(255)
export const music = (theme, ...audios) => {
	const arr = musicdict[theme] || (musicdict[theme] = [])
	arr.push(...audios)
}

export * as pointer from './pointer.js'

export { worldEvents } from './incomingPacket.js'

export const world = {
	id: '',
	tick: 0,
	gx: 0, gy: 0,
	weather: 0,
	weatherFade: 0
}

export let bigintOffset = {x: 0n, y: 0n}