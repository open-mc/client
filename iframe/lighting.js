import { world } from 'world'
import { BlockIDs } from 'definitions'

const uptChunks = []
let lI = [], dI = []
let llI = [], ddI = []
export const _add = (ch, i=0) => {
	let {lightI} = ch
	if(lightI<0) ch.lightI = lightI = (uptChunks.push(ch)-1)*4096
	lI.push(i+lightI)
}

export const _addDark = (ch, i=0) => {
	let {lightI} = ch
	if(lightI<0) ch.lightI = lightI = (uptChunks.push(ch)-1)*4096
	dI.push(i+lightI)
}

export const newChunks = []
export function performLightUpdates(shouldSkylight = true){
	if(newChunks.length){
		shouldSkylight = world.id!='end'&&world.id!='nether'
		if(shouldSkylight) for(const ch of newChunks){
			const {light} = ch
			if(!ch.up) for(let x = 0; x < 64; x++) light[x&63|4032] = 240, _add(ch, x|4032)
		}
	}
	if(!(dI.length+lI.length)) return
	//const a = performance.now()
	let dark = 0, light = 0
	while(dI.length){
		const a = dI
		dI = ddI; ddI = a
		for(let i of a){
			const ch = uptChunks[(i/4096)|0], light = ch.light
			let v = light[i&=4095], v1 = v&15
			if(!v) continue
			if(dark){
				const b = ch[i], {opacity,brightness} = b==65535?ch.tileData.get(i):BlockIDs[b]
				const v2 = v>>4; v1 = (v1>opacity?v1-opacity:0)
				if(brightness>v1) v1=brightness
				v = (v2>opacity?v2-opacity:0)<<4|v1
				if(brightness) _add(ch, i)
			}
			light[i] = 0
			if(i<4032){
				const l = light[i+64]
				if(l) if(v1>(l&15)||v>(l|15)) _addDark(ch, i+64)
				else _add(ch, i+64)
			}else{
				const c2 = ch.up
				if(c2){
					const l = c2.light[i&63]
					if(l) if(v1>(l&15)||v>(l|15)) _addDark(c2, i&63)
					else _add(c2, i&63)
				}
			}
			if(i>63){
				const l = light[i-64]
				if(l) if(v1>(l&15)||(v>>4)>=(l>>4)) _addDark(ch, i-64)
				else _add(ch, i-64)
			}else{
				const c2 = ch.down
				if(c2){ const l = c2.light[i|4032]; if(l) if(v1>(l&15)||(v>>4)>=(l>>4)) _addDark(c2, i|4032); else _add(c2, i|4032) }
			}
			if(i&63){
				const l = light[i-1]
				if(l) if(v1>(l&15)||v>(l|15)) _addDark(ch, i-1)
				else _add(ch, i-1)
			}else{
				const c2 = ch.left
				if(c2){ const l = c2.light[i|63]; if(l) if(v1>(l&15)||v>(l|15)) _addDark(c2, i|63); else _add(c2, i|63) }
			}
			if((i&63)!=63){
				const l = light[i+1]
				if(l) if(v1>(l&15)||v>(l|15)) _addDark(ch, i+1)
				else _add(ch, i+1)
			}else{
				const c2 = ch.right
				if(c2){ const l = c2.light[i&4032]; if(l) if(v1>(l&15)||v>(l|15)) _addDark(c2, i&4032); else _add(c2, i&4032) }
			}
		}
		dark += a.length
		a.length = 0
	}
	while(lI.length){
		const a = lI
		lI = llI; llI = a
		light += a.length
		for(let i of a){
			const ch = uptChunks[(i/4096)|0], light = ch.light
			let v = light[i&=4095]
			const b = ch[i], {opacity,brightness} = b==65535?ch.tileData.get(i):BlockIDs[b]
			const v2 = v>>4; let v1 = v&15
			v1 = (v1>opacity+1?v1-opacity-1:0)
			if(brightness>v1) v1=brightness-1,light[i]=v&240|brightness
			v = (v2>opacity?v2-opacity:0)<<4|v1
			if(i>63){
				const l = light[i-64], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240
				if(l2 != l) light[i-64] = l2, _add(ch, i-64)
			}else{
				const c2 = ch.down
				if(c2){ const l = c2.light[i|4032], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240; if(l2 != l) c2.light[i|4032] = l2, _add(c2, i|4032) }
			}
			if(v&240) v -= 16
			if(i<4032){
				const l = light[i+64], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240
				if(l2 != l) light[i+64] = l2, _add(ch, i+64)
			}else{
				const c2 = ch.up
				if(c2){ const l = c2.light[i&63], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240; if(l2 != l) c2.light[i&63] = l2, _add(c2, i&63) }
			}
			if(i&63){
				const l = light[i-1], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240
				if(l2 != l) light[i-1] = l2,_add(ch, i-1)
			}else{
				const c2 = ch.left
				if(c2){ const l = c2.light[i|63], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240; if(l2 != l) c2.light[i|63] = l2, _add(c2, i|63) }
			}
			if((i&63)!=63){
				const l = light[i+1], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240
				if(l2 != l) light[i+1] = l2,_add(ch, i+1)
			}else{
				const c2 = ch.right
				if(c2){ const l = c2.light[i&4032], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240; if(l2 != l) c2.light[i&4032] = l2, _add(c2, i&4032) }
			}
		}
		a.length = 0
	}
	//console.info('Lighting update: %fms\nDark: %d, Light: %d', (performance.now()-a).toFixed(3), dark, light)
	for(const c of uptChunks) c.lightI = -1, c.changed|=1
	uptChunks.length = 0
	if(newChunks.length){
		if(shouldSkylight) for(const {down, light} of newChunks){
			if(down) for(let x = 0; x < 64; x++)
				if(light[x]<240) _addDark(down, x|4032)
		}
		newChunks.length = 0
		performLightUpdates(shouldSkylight)
	}
}