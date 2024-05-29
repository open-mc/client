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
	//const a = performance.now()
	let dark = 0, light = 0
	while(dI.length){
		const a = dI
		dI = ddI; ddI = a
		for(let i of a){
			const ch = uptChunks[(i/4096)|0], light = ch.light
			let v = light[i&=4095]>>4
			if(!v) continue
			if(dark){
				const b = ch[i], {opacity} = b==65535?ch.tileData.get(i):BlockIDs[b]
				v = v > opacity ? v-opacity : 0
			}
			if(i<4032){
				const l = light[i+64]
				if(l) if((l>>4) < v) light[i+64] = l, _addDark(ch, i+64)
				else{
					_add(ch, i+64)
					if(dark){
						const b = ch[i+64], {opacity} = b==65535?ch.tileData.get(i+64):BlockIDs[b]
						if(!opacity&&(l>>4)==v) continue
					}
				}
			}else{
				const c2 = ch.up
				if(c2){
					const l = c2.light[i&63]
					if(l) if((l>>4) < v) c2.light[i&63] = l, _addDark(c2, i&63)
					else{
						_add(c2, i&63)
						if(dark){
							const b = c2[i], {opacity} = b==65535?c2.tileData.get(i):BlockIDs[b]
							if(!opacity&&(l>>4)==v) continue
						}
					} 
				}
			}
			light[i] = 0
			if(i>63){
				const l = light[i-64]
				if(l) if((l>>4) <= v) light[i-64] = l, _addDark(ch, i-64)
				else _add(ch, i-64)
			}else{
				const c2 = ch.down
				if(c2){ const l = c2.light[i|4032]; if(l) if((l>>4) <= v) c2.light[i|4032] = l, _addDark(c2, i|4032); else _add(c2, i|4032) }
			}
			if(i&63){
				const l = light[i-1]
				if(l) if((l>>4) < v) light[i-1] = l, _addDark(ch, i-1)
				else _add(ch, i-1)
			}else{
				const c2 = ch.left
				if(c2){ const l = c2.light[i|63]; if(l) if((l>>4) < v) c2.light[i|63] = l, _addDark(c2, i|63); else _add(c2, i|64) }
			}
			if((i&63)!=63){
				const l = light[i+1]
				if(l) if((l>>4) < v) light[i+1] = l, _addDark(ch, i+1)
				else _add(ch, i+1)
			}else{
				const c2 = ch.right
				if(c2){ const l = c2.light[i&4032]; if(l) if((l>>4) < v) c2.light[i&4032] = l, _addDark(c2, i&4032); else _add(c2, i&4032) }
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
			let v = ch.light[i&=4095]>>4
			const b = ch[i], {opacity} = b==65535?ch.tileData.get(i):BlockIDs[b]
			v = v > opacity ? v-opacity : 0
			if(i>63){
				const l = light[i-64]
				if((l>>4) < v) light[i-64] = v<<4, _add(ch, i-64)
			}else{
				const c2 = ch.down
				if(c2){ const l = c2.light[i|4032]; if((l>>4) < v) c2.light[i|4032] = v<<4, _add(c2, i|4032) }
			}
			v--
			if(i<4032){
				const l = light[i+64]
				if((l>>4) < v) light[i+64] = v<<4, _add(ch, i+64)
			}else{
				const c2 = ch.up
				if(c2){ const l = c2.light[i&63]; if((l>>4) < v) c2.light[i&63] = v<<4, _add(c2, i&63) }
			}
			if(i&63){
				const l = light[i-1]
				if((l>>4) < v) light[i-1] = v<<4, _add(ch, i-1)
			}else{
				const c2 = ch.left
				if(c2){ const l = c2.light[i|63]; if((l>>4) < v) c2.light[i|63] = v<<4, _add(c2, i|63) }
			}
			if((i&63)!=63){
				const l = light[i+1]
				if((l>>4) < v) light[i+1] = v<<4, _add(ch, i+1)
			}else{
				const c2 = ch.right
				if(c2){ const l = c2.light[i&4032]; if((l>>4) < v) c2.light[i&4032] = v<<4, _add(c2, i&4032) }
			}
		}
		a.length = 0
	}
	for(const c of uptChunks) c.lightI = -1, c.changed|=1
	uptChunks.length = 0
	//console.info('Lighting update: %fms\nDark: %d, Light: %d', (performance.now()-a).toFixed(3), dark, light)
}

export function propagateSkylight(y=0, x0=0, x1=0){
	y *= 0x4000000; x1<<=6
	let c = null, l = null, l1 = null
	for(let x = x0<<6; x != x1; x=(x+1)|0){
		if(!(x&63)){
			c = c ? c.right : map.get((x>>>6)+y)
			if(c) l = c.up ? c.up.light : null, l1 = c.light
			else l = null
		}
		if(c) l1[x&63|4032] = (l?l[x&63]&240:240)|l1[x&63|4032]&15, _add(c, x&63|4032)
	}
	return () => {
		let c = null, d = null
		for(let x = x0<<6; x != x1; x=(x+1)|0){
			if(!(x&63)){
				c = c ? c.right : map.get((x>>>6)+y)
				if(c) d = c.down
				else d = null
			}
			if(c&&d) if(c.light[x&63]<240) _addDark(d, x&63|4032)
		}
	}
}