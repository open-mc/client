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
		if(this.nausea > 0) c.skew(sin(t*6)/3*this.nausea, cos(t*6)/3*this.nausea)
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
export const lightArr = new Uint8ClampedArray(1024)
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
	blockAtlas.pasteData(lightArr, 0, 0, 0, 16, 16, 1)
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

let bai = 49, bac = 256, bai1 = 0, bac1 = 256
export { bai as _invalidTex }
export let blockAtlas = Texture(4096, min(4096, bac/16), 1, _, _, 5)
let blockAtlas2 = Texture(4096, min(4096, bac/16), 1, _, _, 5)

export let _invAtlasHeight = 1/(blockAtlas.height>>4)
blockAtlas.w = 0.00390625
blockAtlas.h = _invAtlasHeight
const loading = new Map()

const draw1 = Drawable(Texture(16,16,1), 0, 0, true)

const draw = Drawable(blockAtlas)
draw.reset(1/256,0,0,_invAtlasHeight,0,0)
draw.blend = Blend.REPLACE
const sh = draw.shader = Shader(`
ivec2 ipos;
vec4 get(uint n){
	ivec3 a = ivec3(int(n&255u)<<4u,int(n>>8u&255u)<<4u, n>>16u);
	a.xy |= ipos; a.xy >>= uni1;
	return getPixel(uni0, a, int(uni1));
}
void main(){
	ipos = ivec2(uv*16.);
	color = get(arg0);
	if(arg2>0.) color = mix(color, get(arg1), arg2);
}`, [UINT, UINT, FLOAT], _, [TEXTURE, UINT])

export const BiomeTint = {
	NONE: 0, TINT: 1, TINT_OVERLAY: 2
}

const animated = []
export { animated as _blockAnimations }

const expandAtlas = () => {
	bac <<= 1
	const ba2 = bac < 65536 ? Texture(4096, bac>>4, 1, _, _, 5) : Texture(4096, 4096, bac>>16, _, _, 5)
	ba2.paste(blockAtlas)
	blockAtlas = ba2; draw.texture = blockAtlas
	_invAtlasHeight = 1/(blockAtlas.height>>4)
	blockAtlas.w = 0.00390625
	blockAtlas.h = _invAtlasHeight
	draw.reset(1/256,0,0,_invAtlasHeight,0,0)
	draw.blend = Blend.REPLACE
	draw.shader = sh
}

export function BlockTexture(img=null, x=0, y=0, frames = 0, invSpeed = 1, blend = 0, vert = true){
	frames |= 0
	const c = 1 + (blend>1), i = bai; bai += c
	if(i >= bac) expandAtlas()
	let j = i|blend<<22
	if(frames>1){
		const id2 = bai1; bai1 += frames*(1+(blend>1))
		while(id2 >= bac1){
			bac1 <<= 1
			const ba2 = bac1 < 65536 ? Texture(4096, bac1>>4, 1, _, _, 5) : Texture(4096, 4096, bac1>>16, _, _, 5)
			ba2.paste(blockAtlas2); blockAtlas2 = ba2; toMipmap |= 2
		}
		animated.push({ frames, speed: 1/invSpeed, id: j, id2 })
		if(!img.loaded) loading.set(j, img.then(img => _putImg(blockAtlas2, id2, frames, img, x, y, vert)))
		else _putImg(blockAtlas2, id2, frames, img, x, y, vert)
	}else{
		if(!img.loaded) loading.set(j, img.then(img => _putImg(blockAtlas, j, c, img, x, y, vert)))
		else _putImg(blockAtlas, j, c, img, x, y, vert)
	}
	return j
}

let l=0
const tintData = new Uint8Array(49152)
export function setBiomeTintMap(img){
	const id = ++l
	if(img.then) return img.then(i => id==l?setBiomeTintMap(i):undefined)
	const {data} = img
	for(let c=0;c<4;c++){
		for(let y=0; y<64; y++) for(let base=y*768|c,base1=c<<8|y<<10,x=0; x<256; x+=4){
			tintData[x+base] = data[x+base1]
			tintData[x+base+256] = data[x+base1+1]
			tintData[x+base+512] = data[x+base1+2]
		}
	}
	blockAtlas.pasteData(tintData, 16, 0, 0, 768, 16, 1)
}

export function MapBlockTexture(b, cb){
	const c = 1 + (b>>23&1), i = bai; bai += c
	if(i >= bac) expandAtlas()
	let j = i|b&12582912, id2 = i
	const a = animated.find(a => a.id == b)
	if(a){
		id2 = bai1; bai1 += a.frames*(1+(blend>1))
		while(id2 >= bac1){
			bac1 <<= 1
			const ba2 = bac1 < 65536 ? Texture(4096, bac1>>4, 1, _, _, 5) : Texture(4096, 4096, bac1>>16, _, _, 5)
			ba2.paste(blockAtlas2); blockAtlas2 = ba2; toMipmap |= 2
		}
		animated.push({ frames: a.frames, speed: a.speed, id: j, id2 })
	}
	const ready = () => {
		let bA = blockAtlas, id = b|0, frames = c
		if(a){
			bA = blockAtlas2; id = a.id2; frames *= a.frames
			blockAtlas2.w = 0.00390586; blockAtlas2.h = 1/(blockAtlas2.height>>4)
		}
		let h = draw1.texture.height>>4
		if(h>frames) draw1.texture = Texture(16, (h=frames)*TEX_SIZE, 1)
		else draw1.clear()
		h = 1/h
		for(let y=0;y<frames;y++){
			bA.x = (id&255)*0.00390586
			bA.y = (id>>8&255)*_invAtlasHeight
			bA.l = id>>16&63
			draw1.reset(h, 0, 0, 1, 0, y*h)
			cb(draw1, bA)
		}
		_putImg(a ? blockAtlas2 : blockAtlas, id2, frames, draw1.texture, 0, 0, true)
	}
	loading.get(b)?.then(ready) ?? ready()
	return j
}
let toMipmap = 0
function _putImg(bA, j, frames, img, x, y, vert){
	if(vert) for(let ry=y,i=j|0;ry<y+frames;ry++,i++) bA.paste(img, (i&255)<<4, i>>4&4080, i>>16&63, x<<4, img.height-(ry<<4)-16, 0, 16, 16, 1)
	else for(let rx=x,i=j|0;rx<x+frames;rx++,i++) bA.paste(img, (i&255)<<4, i>>4&4080, i>>16&63, rx<<4, img.height-(y<<4)-16, 0, 16, 16, 1)
	toMipmap |= bA == blockAtlas ? 1 : 2
	loading.delete(j)
}

export const toTex = i => {
	if(!i) i = bai
	blockAtlas.x = (i&255)*0.00390625
	blockAtlas.y = (i>>8&255)*_invAtlasHeight
	blockAtlas.l = i>>16&63
	return blockAtlas
}

export function prep(mip = 0, tick = 0){
	if(toMipmap){
		if(toMipmap&1) blockAtlas.genMipmaps()
		if(toMipmap&2) blockAtlas2.genMipmaps()
		toMipmap = 0
	}
	blockAtlas.setMipmapRange(0, mip)
	draw.shader.uniforms(blockAtlas2, draw.textureMipmap = mip)
	let l = draw.textureLayer
	for(let i = 0; i < animated.length; i++){
		const { frames, speed, id, id2 } = animated[i]
		if(l != (l = id>>16&63)) draw.textureLayer = l
		const t = tick*speed, tf = floor(t), inId = (id2&4194303)+tf%frames, inId1 = (id2&4194303)+(tf+1)%frames
		draw.drawRect(id&255,id>>8&255,1,1,inId,inId1,t-tf)
		if(id>>23){
			if(l != (l = id+1>>16&63)) draw.textureLayer = l
			draw.drawRect(id+1&255,id+1>>8&255,1,1,inId+frames,inId1+frames,t-tf)
		}
	}
}

export function addParticle(p){
	if(particles.size < options.maxParticles) particles.add(p)
}
export const particles = new Set()