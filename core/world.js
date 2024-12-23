import { musicdict } from './sounds.js'
let _offx = 0, _offy = 0
export let W2 = 0, H2 = 0, SCALE = 1
export const _setDims = (a,b,c,d,e) => (_offx=a,_offy=b,W2=c,H2=d,SCALE=e)

export const BlockIDs = []

export let me = null
export let perms = 2, mode = 0
export const _setPerms = (p,m) => {perms=p;mode=m}
export function foundMe(e){
	me = globalThis.me = e
	cam.x = me.ix = me.x
	cam.y = me.iy = me.y
	for(const cb of playerLoadCb) try{cb(e)}catch(e){Promise.reject(e)}
}
export const map = globalThis.map = new Map()
export const entityMap = globalThis.entityMap = new Map()
export const server = {
	title: '',
	sub: '',
	players: [],
	tps: 20, r: 0
}
export const CONFIG = {
	proximity_chat: 0
}
export const configLoaded = fn => configLoaded.listeners.push(fn)
configLoaded.listeners = []

export const cam = {
	x: 0, y: 0, z: .5, f: 0, nausea: 0, minZoom: 0,
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

const playerLoadCb = []
export const onPlayerLoad = cb => playerLoadCb.push(cb)
const SPEEDOFSOUND = 340
export function soundAt(fn, x, y, vol = 1, pitch = 1){
	if(!Number.isFinite(vol)) vol = 1
	if(!Number.isFinite(pitch)) pitch = 1
	if(Array.isArray(fn)) fn = fn[floor(random() * fn.length)]
	if(!me) return
	x = ifloat(x - me.x); y = ifloat(y - me.y + me.head)
	const dist = hypot(x, y)
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

export const gridEventMap = new Map()
export const gridEvents = new Array(255)
export const music = (theme, ...audios) => {
	const arr = musicdict[theme] ??= []
	arr.push(...audios)
}

export const WorldType = {}
export const WorldTypeStrings = ['overworld', 'nether', 'end', 'void']
for(let i = 0; i < WorldTypeStrings.length; i++) WorldType[WorldTypeStrings[i]] = i
export const world = globalThis.world = {
	type: -1,
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
export const lightTex = Texture(256, 1, 1, _, Formats.RGBA), lightArr = new Uint8ClampedArray(1024)
export function genLightmap(id, b1, s1, s2, sx, base = vec3.zero, shadowStrength = 1){
	if(lastLm==(lastLm=id)) return
	shadowStrength *= 255
	const sr = s1.x*(1-sx)+s2.x*sx, sg = s1.y*(1-sx)+s2.y*sx, sb = s1.z*(1-sx)+s2.z*sx
	for(let i = 0, j = 0; i < 256; i++, j+=4){
		const a = powTable[i&15], b = powTable[i>>4]
		lightArr[j] = (b1.x*a + sr*b + base.x)*255
		lightArr[j+1] = (b1.y*a + sg*b + base.y)*255
		lightArr[j+2] = (b1.z*a + sb*b + base.z)*255
		lightArr[j+3] = (1-b)*shadowStrength
	}
	lightTex.pasteData(lightArr)
}
let lastLm = NaN
export const powTable = new Float32Array(16)
export function setGamma(p){
	if(Array.isArray(p)){for(let i=0;i<16;i++)powTable[i]=p[i];lastLm = NaN;return}
	p = 8**(.6666667-p)
	for(let i = 0; i < 16; i++) powTable[i] = (i*0.06667)**p
	lastLm = NaN
}

export const exposureMap = new Map()
globalThis.exposureMap = exposureMap