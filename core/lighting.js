import { world, WorldType, toBlockExact } from 'world'
import { BlockIDs } from 'definitions'
import { drawLayer, renderBoxes } from 'api'

const uptChunks = []
let lI = [], dI = []
let llI = [], ddI = []
export const _add = (ch, i=0) => {
	let {lightI} = ch
	if(lightI<0) ch.lightI = lightI = (uptChunks.push(ch)-1)<<12
	lI.push(i+lightI)
}

export const _addDark = (ch, i=0) => {
	let {lightI} = ch
	if(lightI<0) ch.lightI = lightI = (uptChunks.push(ch)-1)<<12
	dI.push(i+lightI)
}

const lightUpdates = []
let lui = [], li = 0
drawLayer('none', 205, (ctx) => {
	ctx.shader = null
	while(lui[0]<t) li = lui.splice(0,2)[1]
	let c = vec4((lui[0]-t)*.4)
	for(let n=1, i = li; i < lightUpdates.length; i += 2){
		while(i>=lui[n]) c = vec4((lui[n-1]-t)*.4),n+=2
		toBlockExact(ctx, lightUpdates[i], lightUpdates[i+1])
		ctx.draw(c)
	}
	if(lightUpdates.length>li||!lui.length) lui.push(t+.5, lightUpdates.length)
	else lui[lui.length-2] = t+.5
	if(li>(lightUpdates.length>>1)){
		lightUpdates.splice(0, li)
		for(let i=1;i<lui.length;i+=2) lui[i] -= li
		li = 0
	}
})
const checkLight = (l,light,v) => {
	const opacity = light&15, brightness = light>>4&15, minLight = light>>8&15
	let b = l&15; l >>= 4
	b = b>opacity?b-opacity:0
	if(brightness>b) b=brightness
	if(b < (v&15)) return false
	l = l>opacity+minLight?l-opacity:l<minLight?l:minLight
	return l >= (v>>4)
}
export const newChunks = []
export function performLightUpdates(shouldSkylight = true){
	if(newChunks.length){
		shouldSkylight = world.type!=WorldType.nether&&world.type!=WorldType.end
		if(shouldSkylight) for(const ch of newChunks){
			const {down, light} = ch
			if(down) for(let x = 0; x < 64; x++){
				const b = ch[x], {light:l} = b==65535?ch.tileData.get(x):BlockIDs[b]
				if((l&15)||light[x]<240) _addDark(down, x|4032)
			}
			if(!ch.up) for(let x = 4032; x < 4096; x++) light[x] = 240, _add(ch, x)
		}
		newChunks.length = 0
	}
	if(!(dI.length+lI.length)) return
	const debug = renderBoxes == 2
	const a = debug ? performance.now() : 0
	let dark = 0, light = 0
	while(dI.length){
		const a = dI
		dI = ddI; ddI = a
		for(let i of a){
			const ch = uptChunks[i>>>12], {light} = ch
			let v = light[i&=4095], v1 = v&15
			if(debug) lightUpdates.push(ch.x<<6|i&63, ch.y<<6|i>>6)
			if(!v) continue
			if(ch.ctx){
				const ub = ch.updateBounds, x = i&63, y = i>>6
				const x0 = ub&63, x1 = ub>>6&63, y0 = ub>>12&63, y1 = ub>>18&63
				ch.updateBounds = (x<x0?x:x0)|(x>x1?x:x1)<<6|(y<y0?y:y0)<<12|(y>y1?y:y1)<<18
			}
			let minLight = 0, ov = v; v >>= 4
			if(dark){
				const b = ch[i], {light} = b==65535?ch.tileData.get(i):BlockIDs[b]
				const opacity = light&15, brightness = light>>4&15; minLight = light>>8&15
				v1 = v1>opacity?v1-opacity:0
				if(brightness>v1) v1=brightness
				v = v>opacity+minLight?v-opacity:v<minLight?v:minLight
				if(brightness) _add(ch, i)
			}
			if(i<4032){
				const j = i+64, l = light[i+64]
				if(l) if(v1>(l&15)||v>(l>>4)) _addDark(ch, j)
				else{
					const b = ch[j], {light:l1} = b==65535?ch.tileData.get(j):BlockIDs[b]
					if(dark&&checkLight(l,l1,ov)){ _add(ch, i); continue }
					_add(ch, j)
				}
			}else{
				const j = i&63, c2 = ch.up
				if(c2){ const l = c2.light[j]; if(l) if(v1>(l&15)||v>(l>>4)) _addDark(c2, j); else {
					const b = c2[j], {light:l1} = b==65535?c2.tileData.get(j):BlockIDs[b]
					if(dark&&checkLight(l,l1,ov)){ _add(ch, i); continue }
					_add(c2, j)
				} }
			}
			light[i] = 0
			if(i>63){
				const l = light[i-64]
				if(l) if(v1>(l&15)||v>=(l>>4)) _addDark(ch, i-64)
				else _add(ch, i-64)
			}else{
				const c2 = ch.down
				if(c2){ const l = c2.light[i|4032]; if(l) if(v1>(l&15)||v>=(l>>4)) _addDark(c2, i|4032); else _add(c2, i|4032) }
			}
			if(v > minLight) v--
			// Special case: if we are already completely dark, we literally cannot get darker, no point propagating darkness (at least not for skylight)
			// This single line gives enormous performance boosts
			if(!v) v = -1
			if(i&63){
				const l = light[i-1]
				if(l) if(v1>(l&15)||v>=(l>>4)) _addDark(ch, i-1)
				else _add(ch, i-1)
			}else{
				const c2 = ch.left
				if(c2){ const l = c2.light[i|63]; if(l) if(v1>(l&15)||v>=(l>>4)) _addDark(c2, i|63); else _add(c2, i|63) }
			}
			if((i&63)!=63){
				const l = light[i+1]
				if(l) if(v1>(l&15)||v>=(l>>4)) _addDark(ch, i+1)
				else _add(ch, i+1)
			}else{
				const c2 = ch.right
				if(c2){ const l = c2.light[i&4032]; if(l) if(v1>(l&15)||v>=(l>>4)) _addDark(c2, i&4032); else _add(c2, i&4032) }
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
			const ch = uptChunks[i>>>12], {light} = ch
			let v = light[i&=4095]
			if(debug) lightUpdates.push(ch.x<<6|i&63, ch.y<<6|i>>6)
			const b = ch[i], {light:l} = b==65535?ch.tileData.get(i):BlockIDs[b]
			const opacity = l&15, brightness = l>>4&15,minLight = l>>8&15
			const v2 = v>>4; let v1 = v&15
			v1 = (v1>opacity+1?v1-opacity-1:0)
			if(brightness>v1) v1=brightness-1,light[i]=v&240|brightness
			v = (v2>opacity+minLight?v2-opacity:v2<minLight?v2:minLight)<<4|v1
			if(ch.ctx){
				const ub = ch.updateBounds, x = i&63, y = i>>6
				const x0 = ub&63, x1 = ub>>6&63, y0 = ub>>12&63, y1 = ub>>18&63
				ch.updateBounds = (x<x0?x:x0)|(x>x1?x:x1)<<6|(y<y0?y:y0)<<12|(y>y1?y:y1)<<18
			}
			const vb = v-16
			if(i<4032){
				const l = light[i+64], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>vb?l:vb)&240
				if(l2 != l) light[i+64] = l2, _add(ch, i+64)
			}else{
				const c2 = ch.up
				if(c2){ const l = c2.light[i&63], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240; if(l2 != l) c2.light[i&63] = l2, _add(c2, i&63) }
			}
			if(i>63){
				const l = light[i-64], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240
				if(l2 != l) light[i-64] = l2, _add(ch, i-64)
			}else{
				const c2 = ch.down
				if(c2){ const l = c2.light[i|4032], a = l&15, b = v&15, l2 = (a>b?a:b)|(l>v?l:v)&240; if(l2 != l) c2.light[i|4032] = l2, _add(c2, i|4032) }
			}
			if((v>>4)>minLight) v -= 16
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
	if(debug) console.info('Lighting update: %fms\nDark: %d, Light: %d', (performance.now()-a).toFixed(3), dark, light)
	for(const c of uptChunks) c.lightI = -1
	uptChunks.length = 0
}