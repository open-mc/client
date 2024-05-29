import { musicdict } from './sounds.js'

let _offx = 0, _offy = 0
export let W2 = 0, H2 = 0, SCALE = 1
export const _setDims = (a,b,c,d,e) => (_offx=a,_offy=b,W2=c,H2=d,SCALE=e)

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
		c.reset(scale/c.width,0,0,scale/c.height,_offx,_offy)
		c.rotate(-this.f)
		if(this.nausea > 0) c.skew(sin(t*3)/3*this.nausea, cos(t*3)/3*this.nausea)
	}
}

export function toBlockExact(c, bx, by){
	cam.transform(c)
	const x0 = ifloat(bx - cam.x) * SCALE
	const y0 = ifloat(by - cam.y) * SCALE
	const xa0 = round(x0), ya0 = round(y0)
	c.box(xa0, ya0, round(x0+SCALE)-xa0, round(y0+SCALE)-ya0)
}

function variant(ch, i, x, y){
	if(!ch) return
	const id = ch[i], b = id==65535?ch.tileData.get(i):BlockIDs[id]
	if(b.variant){
		const b2 = b.variant(x, y)
		if(!b2 || b2 == b) return
		if(b2.savedata){
			ch[i] = 65535
			ch.tileData.set(i, b2=b2===b2.constructor?new b2:b2)
		}else{ ch[i] = b2.id; if(b.savedata) ch.tileData.delete(i) }
		ch.updateDrawn(i, b2)
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
	if(b.variant){
		const old = b
		if(!(b = b.variant(x, y))) b = old
		else if(b.savedata){
			ch[i] = 65535
			ch.tileData.set(i, b)
		}else{ ch[i] = b.id; if(old.savedata) ch.tileData.delete(i) }
	}
	ch.updateDrawn(i, b, old)
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
	const speed = (me.dx * x + me.dy * y) / dist / SPEEDOFSOUND
	// For 2d, the inverse square law becomes the inverse linear law
	// Add some reasonable limits to prevent pitch from going to 0 or Infinity
	fn(vol * 2 / (dist + 1), pitch * max(.2, speed + 1), min(1, max(-1, x / 16)))
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


export function getLightValue(x, y){
	const ch = map.get(((x=floor(x))>>>6)+((y=floor(y))>>>6)*0x4000000)
	return ch ? ch.light[(x & 63) + ((y & 63) << 6)] : 255
}

export function getTint(x, y, a = 1){
	lightTint.w = a
	const ch = map.get(((x=floor(x))>>>6)+((y=floor(y))>>>6)*0x4000000)
	if(!ch){
		lightTint.x = lightTint.y = lightTint.z = a
		return lightTint
	}
	const j = ch.light[(x & 63) + ((y & 63) << 6)]<<2
	lightTint.x = lightArr[j]*.003921568627451*a; lightTint.y = lightArr[j|1]*.003921568627451*a; lightTint.z = lightArr[j|2]*.003921568627451*a
	return lightTint
}

export let lightTint = vec4(0)
export const lightTex = Texture(256, 1, 1, _, Formats.RGBA), lightArr = new Uint8Array(1024)
export function genLightmap(id, b1, s1, s2, sx, base = vec3.zero){
	if(lastLm==(lastLm=id)) return
	const sr = s1.x*(1-sx)+s2.x*sx, sg = s1.y*(1-sx)+s2.y*sx, sb = s1.z*(1-sx)+s2.z*sx
	for(let i = 0, j = 0; i < 256; i++, j+=4){
		const a = powTable[i&15], b = powTable[i>>4]
		lightArr[j] = round(max(0, min(1, b1.x*a + sr*b + base.x))*255)
		lightArr[j+1] = round(max(0, min(1, b1.y*a + sg*b + base.y))*255)
		lightArr[j+2] = round(max(0, min(1, b1.z*a + sb*b + base.z))*255)
		lightArr[j+3] = 255
	}
	lightTex.pasteData(lightArr)
}
let lastLm = NaN
const powTable = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
export function setGamma(p){
	for(let i = 0; i < 16; i++) powTable[i] = p**(~i&15)
	lastLm = NaN
}