import { Blocks } from 'definitions'
import { musicdict } from './sounds.js'
export const map = new Map, entityMap = new Map()

export const cam = {x: 0, y: 0, z: 2}

export function setblock(x, y, b){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	if(!ch) return
	const lx = x & 63
	const ly = y & 63
	const chI = lx + (ly << 6)
	const old = ch.tiles[chI]
	ch.tiles[chI] = b
	if(ch.ctx){
		const {texture, render} = b
		ch.ctx.clearRect(lx * TEX_SIZE, (63 - ly) * TEX_SIZE, TEX_SIZE, TEX_SIZE)
		let i = ch.rerenders.indexOf(chI)
		if((i == -1) & (render != undefined)) ch.rerenders.push(chI)
		else if((i > -1) & (render == undefined)) ch.rerenders.splice(i, 1)
		if(texture) ch.ctx.drawImage(texture.canvas,texture.x,texture.y,texture.w,texture.h,lx*TEX_SIZE,(63-ly)*TEX_SIZE,TEX_SIZE,TEX_SIZE)
	}
}
export function getblock(x, y){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	return ch ? ch.tiles[(x & 63) + ((y & 63) << 6)] : Blocks.air()
}

const playerLoadCb = []
export const onPlayerLoad = cb => playerLoadCb.push(cb)
const SPEEDOFSOUND = 340
export function sound(fn, x, y, vol = 1, pitch = 1){
	if(!me) return
	x = ifloat(x - me.x - .5); y = ifloat(y - me.y + me.head - .5)
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

