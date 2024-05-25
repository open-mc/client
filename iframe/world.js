import { musicdict } from './sounds.js'

export const BlockIDs = []

export let me = null
export let perms = 2
export const _setPerms = p => perms=p
export function foundMe(e){
	if(!me) postMessage(false, '*')
	me = globalThis.me = e
	cam.x = me.ix = me.x
	cam.y = me.iy = me.y
	for(const cb of playerLoadCb) try{cb(e)}catch(e){Promise.reject(e)}
}
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

export const cam = {
	x: 0, y: 0, z: .5, f: 0, nausea: 0,
	baseF: 0, baseZ: 0, baseX: 0, baseY: 0,
	staticX: NaN, staticY: NaN,
	transform(c, scale = 1){
		c.reset(scale/c.width,0,0,scale/c.height,0.5,0.5)
		c.rotate(-this.f)
		if(this.nausea > 0) c.skew(sin(t*3)/3*this.nausea, cos(t*3)/3*this.nausea)
	}
}

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
		ch.updateDrawn(b, i)
	}
	return b
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
	ch.updateDrawn(b, i)
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
	// The speed of sound is 340m/s. This means a sound approaching at a speed of
	// 340m/s => 2x pitch, -170m/s => 0.5x pitch, -340m/s => 0x pitch (sound can never reach us)
	// The dot product (x0,y0) . (x1,y1) is x0*x1 + y0*y1
	// "Fix" the inputs x and y by normalizing them with / dist
	const speed = (me.dx * x + me.dy * y) / dist
	// For 2d, the inverse square law becomes the inverse linear law
	// Add some reasonable limits to prevent pitch from going to 0 or Infinity
	fn(vol * 2 / (dist + 1), pitch * max(SPEEDOFSOUND / 20, speed + SPEEDOFSOUND) / SPEEDOFSOUND, min(1, max(-1, x / 16)))
}

export const gridEventMap = new Map
export const gridEvents = new Array(255)
export const music = (theme, ...audios) => {
	const arr = musicdict[theme] || (musicdict[theme] = [])
	arr.push(...audios)
}


export const world = {
	id: '',
	tick: 0, animTick: 0,
	gx: 0, gy: 0,
	weather: 0,
	weatherFade: 0
}

export let bigintOffset = {x: 0n, y: 0n}

export let pointer = e => pointer = e
export let worldEvents = e => worldEvents = e