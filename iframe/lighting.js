import { map } from 'world'
import { BlockIDs } from 'definitions'

//       1
// d = 2   3
//       0
export let lI = [], lC = []
let llI = [], llC = []
let ch = null, light = null
let och = null, occ = 0
const _add = (ch, i=0) => (och==ch?occ++:(lC.push(occ,och=ch),occ=1),lI.push(i))
function positiveLightingUpdate(v, i){
	if((light[i]>>4)>=v) return
	light[i] = v<<4
	const b = ch[i], {opacity} = b==65535?ch.tileData.get(i):BlockIDs[b]
	v = v > opacity ? v-opacity : 0
	if(i>63){
		const l = light[i-64]
		if((l>>4) < v) _add(ch, v<<12|i-64)
	}else{
		const c2 = ch.down
		if(c2){ const l = c2.light[i|4032]; if((l>>4) < v) _add(c2, v<<12|i|4032) }
	}
	v--
	if(i<4032){
		const l = light[i+64]
		if((l>>4) < v) _add(ch, v<<12|i+64)
	}else{
		const c2 = ch.up
		if(c2){ const l = c2.light[i&63]; if((l>>4) < v) _add(c2, v<<12|i&63) }
	}
	if(i&63){
		const l = light[i-1]
		if((l>>4) < v) _add(ch, v<<12|i-1)
	}else{
		const c2 = ch.left
		if(c2){ const l = c2.light[i|63]; if((l>>4) < v) _add(c2, v<<12|i|63) }
	}
	if((i&63)!=63){
		const l = light[i+1]
		if((l>>4) < v) _add(ch, v<<12|i+1)
	}else{
		const c2 = ch.right
		if(c2){ const l = c2.light[i&4032]; if((l>>4) < v) _add(c2, v<<12|i&4032) }
	}
}

export function pushLightUpdate(ch, i){
	const {light} = ch, b = ch[i], {opacity} = b==65535?ch.tileData.get(i):BlockIDs[b]
	let v = light[i]>>4
	v = v > opacity ? v-opacity : 0
	if(i>63){
		const l = light[i-64]
		if((l>>4) < v) _add(ch, v<<12|i-64)
	}else{
		const c2 = ch.down
		if(c2){ const l = c2.light[i|4032]; if((l>>4) < v) _add(c2, v<<12|i|4032) }
	}
	v--
	if(i<4032){
		const l = light[i+64]
		if((l>>4) < v) _add(ch, v<<12|i+64)
	}else{
		const c2 = ch.up
		if(c2){ const l = c2.light[i&63]; if((l>>4) < v) _add(c2, v<<12|i&63) }
	}
	if(i&63){
		const l = light[i-1]
		if((l>>4) < v) _add(ch, v<<12|i-1)
	}else{
		const c2 = ch.left
		if(c2){ const l = c2.light[i|63]; if((l>>4) < v) _add(c2, v<<12|i|63) }
	}
	if((i&63)!=63){
		const l = light[i+1]
		if((l>>4) < v) _add(ch, v<<12|i+1)
	}else{
		const c2 = ch.right
		if(c2){ const l = c2.light[i&4032]; if((l>>4) < v) _add(c2, v<<12|i&4032) }
	}
}

export function performLightUpdates(){
	const a = performance.now()
	while(lI.length){
		let j = 1, c = 1
		const a = lI, b = lC
		llI.length = 0; llC.length = 0
		lI = llI; lC = llC
		llI = a; llC = b
		b.push(occ,null); occ=0; och = null
		for(const i of a){
			if(!--c) ch=b[j++], c=b[j++], light = ch.light, ch.changed|=1
			positiveLightingUpdate(i>>12&15, i&4095)
		}
	}
	console.log('Lighting update: %fms', (performance.now()-a).toFixed(3))
}

export function propagateSkylight(y=0, x0=0, x1=0){
	y = (y-1&0x3FFFFFF)*0x4000000; x1<<=6
	let c = null
	for(let x = x0<<6; x != x1; x=(x+1)|0){
		if(!(x&63)) c = c ? c.right : map.get((x>>>6)+y)
		if(c) _add(c, (x&63|4032)|61440)
	}
}