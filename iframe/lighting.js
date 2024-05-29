import { map } from 'world'
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

export function performLightUpdates(){
	if(!(dI.length+lI.length)) return
	const a = performance.now()
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
			}
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
			light[i] = 0
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
				if(c2){ const l = c2.light[i|63]; if(l) if(v1>(l&15)||v>(l|15)) _addDark(c2, i|63); else _add(c2, i|64) }
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
	for(const c of uptChunks) c.lightI = -1, c.changed|=1
	uptChunks.length = 0
	console.info('Lighting update: %fms\nDark: %d, Light: %d', (performance.now()-a).toFixed(3), dark, light)
}

const tops = new Set
export function propagateSkylight(y=0, x0=0, x1=0){
	y *= 0x4000000; x1<<=6
	let c = null, l = null, l1 = null
	for(let x = x0<<6; x != x1; x=(x+1)|0){
		if(!(x&63)){
			c = c ? c.right : map.get((x>>>6)+y)
			if(c) l = c.up ? c.up.light : (tops.add((x>>>6)+y), null), l1 = c.light
			else l = null
		}
		if(c) l1[x&63|4032] = (l?l[x&63]&240:240)|l1[x&63|4032]&15, _add(c, x&63|4032)
	}
}
export function propagateSkydark(){
	for(const k of tops){
		const c = map.get(k), d = c?.down
		if(d){ tops.delete(k); for(let x = 0; x < 64; x++) if(d.light[x|4032]>15) _addDark(d, x|4032) }
	}
}