import { entityMap, map, cam, world, WorldType, WorldTypeStrings, bigintOffset, me, genLightmap, lightTint, lightArr, setGamma, getTint, getLightValue, W2, H2, SCALE, toBlockExact, gridEventMap, blockAtlas, prep, particles, _invAtlasHeight, _blockAnimations, renderOptions } from 'world'
import { getblock, gotopos } from 'ant'
import * as pointer from './pointer.js'
import { drawLayer, options, _renderPhases, renderBoxes, renderF3, drawText, calcText, textShadeCol, _networkUsage, networkUsage, listen, _tickPhases, renderUI } from 'api'
import { BlockIDs } from 'definitions'
import { VERSION } from '../server/version.js'
import { performLightUpdates } from './lighting.js'

const chunkShader = Shader(`
vec3 blend(vec4 col, ivec2 blockpos){
	ivec3 q = ivec3(blockpos.x>>4|blockpos.y>>2&12,64,arg1);
	vec2 bp = vec2(blockpos & 15)*.0625;
	uint t = uGetPixel(arg0, q, 0).x; q.x += 16;
	uvec2 th = uvec2(t, uGetPixel(arg0, q, 0).x);
	ivec2 biome = ivec2(mix(mix(vec2(th&255u), vec2(th>>8u&255u), bp.x),
	mix(vec2(th>>16u&255u), vec2(th>>24u&255u), bp.x), bp.y)+.5)>>2;
	int x = (biome.y&3)*192+biome.x+16, y = biome.y>>2;
	vec4 a = getPixel(uni0, ivec3(x,y,0), 0);
	vec4 b = getPixel(uni0, ivec3(x+64,y,0), 0);
	vec4 c = getPixel(uni0, ivec3(x+128,y,0), 0);
	return vec3(dot(a,col),dot(b,col),dot(c,col));
}
void main(){
	ivec2 ipos = ivec2(uv*1024.), ipos0 = ipos>>4u;
	uint n = uGetPixel(arg0, ivec3(ipos0,arg1), 0).x;
	vec4 light = getPixel(uni0, ivec3(n&15u, n>>4u&15u, 0), 0);
	n >>= 8u; ipos &= 15;
	if(n==0u){
		color = vec4(0,0,0,light.w);
	}else{
		ivec3 p = ivec3(int((n&255u)<<4u), int(n>>4u&4080u),int(n>>16u&63u));
		p.xy |= ipos; p.xy >>= uni1;
		color = getPixel(uni0, p, int(uni1));
		uint b = n>>22u;
		if(b!=0u){
			if((b&2u)==0u) color.rgb = blend(color, ipos0);
			else{
				// Second layer blend
				n++;
				ivec3 p = ivec3(int((n&255u)<<4u), int(n>>4u&4080u),int(n>>16u&63u));
				p.xy |= ipos; p.xy >>= uni1;
				vec4 color2 = getPixel(uni0, p, int(uni1));
				color2.rgb = blend(color2, ipos0);
				color = color*(1.-color2.a) + color2;
			}
		}
		color.xyz *= light.xyz;
		color.a += light.w*(1.-color.a);
	}
}`, [UTEXTURE, UINT], _, [TEXTURE, UINT, FLOAT], _, FIXED)

Shader.BLOCK = Shader(`
vec3 blend(vec4 col){
	ivec2 biome = ivec2(31,31);
	int x = (arg2&192)*3+(arg2&63)+16, y = arg2>>8;
	vec4 a = getPixel(uni0, ivec3(x,y,0), 0);
	vec4 b = getPixel(uni0, ivec3(x+64,y,0), 0);
	vec4 c = getPixel(uni0, ivec3(x+128,y,0), 0);
	return vec3(dot(a,col),dot(b,col),dot(c,col));
}
void main(){
	color = arg0();
	if(arg2!=-1) color.rgb = blend(color);
	color *= arg1;
}`, [COLOR, VEC4, INT], [vec4.zero,vec4.one,-1], [TEXTURE, INT])

const borderTex = Texture(8, 8, 1, REPEAT)
let a = new Uint8Array(256)
for(let i = 0; i < 64; i++){
	const v = (i-(~i>>3)&7)
	a[i<<2|1] = a[i<<2|2] = a[i<<2|3] = v>3?v*30-30:0
}
borderTex.pasteData(a); a=null
const chunkLineCol = vec4(0, .4, 1, 1)
const axisLineCol = vec4(.5, 0, 1, 1)
let visibleChunks = 0
const day = vec3(.93), night = vec3(.28,.26,.35)
const block = vec3(2, 1.8, 1.5), netherBase = vec3(.45,.39,.30), endBase = vec3(.35,.39,.34)
listen('gamma', () => setGamma(options.gamma))
drawLayer('none', 200, (ctx, w, h) => {
	if(renderOptions.lightUpdates) performLightUpdates()
	const a = cam.z / 12
	const chunkSublineCol = vec4(0, .53*a, a, a)
	const hitboxes = renderBoxes + buttons.has(KEYS.LEFT_OF_1)
	cam.transform(ctx)
	ctx.shader = chunkShader
	const mipmap = max(0, min(4, 4-round(log2(SCALE)+.05)))
	prep(mipmap, world.animTick)
	if(world.type == WorldType.overworld){
		const time = world.tick % 24000, light = time < 1800 ? time / 1800 : time < 13800 ? 1 : time < 15600 ? (15600 - time) / 1800 : 0
		genLightmap(light, block, night, day, light)
	}else if(world.type == WorldType.nether){
		genLightmap(-1, block, day, vec3.zero, 0, netherBase, 0)
	}else if(world.type == WorldType.end){
		genLightmap(-2, block, day, vec3.zero, 0, endBase, 0)
	}else genLightmap(1, block, vec3.zero, day, 1, vec4.zero, 0)
	chunkShader.uniforms(blockAtlas, mipmap, _invAtlasHeight*.0625)
	const sr = sin(cam.f), cr = cos(cam.f)
	const limX = (abs(ctx.width*cr)+abs(ctx.height*sr)+(cam.nausea*.333*ctx.height))/2, limY = (abs(ctx.width*sr)+abs(ctx.height*cr)+(cam.nausea*.333*ctx.width))/2
	const S = 64*SCALE
	const lineWidth = .5/min(1024,S)
	visibleChunks = 0
	for(const chunk of map.values()){
		const x0 = ifloat((chunk.x << 6) - cam.x) * SCALE
		const y0 = ifloat((chunk.y << 6) - cam.y) * SCALE
		if(x0+S <= -limX || y0+S <= -limY || x0 >= limX || y0 >= limY){ if(chunk.ctx) chunk.hide(); continue }
		visibleChunks++
		if(!chunk.ctx) chunk.draw()
		const b = chunk.updateBounds
		if(b != 258111){
			chunk.updateBounds = 258111
			chunk.uploadData(b)
		}
		ctx.drawRect(x0, y0, S, S, chunk.ctx, chunk.layer)
	}
	ctx.shader = Shader.BLOCK
	const b = borderTex.sub(-t,-t,128>>mipmap,128>>mipmap)
	for(const chunk of map.values()){
		if(!chunk.ctx) continue
		const cxs = chunk.x << 6, cys = chunk.y << 6
		const x0 = ifloat(cxs - cam.x) * SCALE
		const y0 = ifloat(cys - cam.y) * SCALE
		const a = ctx.sub()
		a.box(x0, y0, S, S)
		const l = a.sub()
		for(const i of chunk.rerenders){
			l.box((i&63)*.015625, (i>>6)*.015625, .015625, .015625)
			const b = chunk[i]
			const j = chunk.light[i]<<2
			lightTint.x = lightArr[j]*.003921568627451; lightTint.y = lightArr[j|1]*.003921568627451; lightTint.z = lightArr[j|2]*.003921568627451; lightTint.w = 1
			const bi = i>>3&6
			const tl = chunk.biomes[bi], tr = chunk.biomes[bi+2]
			const hl = chunk.biomes[bi+1], hr = chunk.biomes[bi+3]
			const xf = (i&15)*.0625
			const biome = floor(tl+(tr-tl)*xf+.5)>>2|floor(hl+(hr-hl)*xf+.5)>>2<<6
			gotopos(chunk, i)
			void(b==65535?chunk.tileData.get(i):BlockIDs[b]).render(l, lightTint, biome)
			l.resetTo(a)
		}
		if(chunk.flags&1) a.draw(b)
		if(hitboxes){
			if(hitboxes >= 2){
				for(let i = .25; i < 1; i += .25)
					a.drawRect(i - lineWidth*.75, 0, lineWidth*1.5, 64, chunkSublineCol)
				for(let i = .25; i < 1; i += .25)
					a.drawRect(0, i - lineWidth*.75, 64, lineWidth*1.5, chunkSublineCol)
			}
			a.drawRect(0, 0, lineWidth*2, 1, chunkLineCol)
			a.drawRect(0, 0, 1, lineWidth*2, chunkLineCol)
			a.drawRect(1, 0, -lineWidth*2, 1, chunkLineCol)
			a.drawRect(0, 1, 1, -lineWidth*2, chunkLineCol)
		}
	}
	ctx.shader = null
	ctx.scale(SCALE)
	const lineWidth2 = 1/min(8,SCALE)
	if(hitboxes >= 2){
		if(abs(cam.x) <= W2 + 0.0625)
			ctx.drawRect((-cam.x-lineWidth2*.5),-H2,lineWidth2,H2*2, axisLineCol)
		if(abs(cam.y) <= H2 + lineWidth2*.5)
			ctx.drawRect(-W2,(-cam.y-lineWidth2*.5),W2*2,lineWidth2, axisLineCol)
		if(abs(ifloat(cam.x + 2147483648)) <= W2 + lineWidth2*.5)
			ctx.drawRect(ifloat(-cam.x+2147483648-lineWidth2*.5),-H2,lineWidth2,H2*2, axisLineCol)
		if(abs(ifloat(cam.y + 2147483648)) <= H2 + lineWidth2*.5)
			ctx.drawRect(-W2,ifloat(-cam.y+2147483648-lineWidth2*.5),W2*2,lineWidth2, axisLineCol)
	}
})
drawLayer('none', 300, ctx => {
	for(const ev of gridEventMap.values()){
		toBlockExact(ctx, ev.x, ev.y)
		if(!map.has((ev.x>>>6)+(ev.y>>>6)*0x4000000) || ev(ctx)) gridEventMap.delete(ev.i)
	}
})
const entityHitboxCol = vec4(1), entityHitboxHeadCol = vec4(.8,0,0,1), entityHitboxFacingCol = vec4(.8, .64, 0, 1)
function renderEntity(ctx, entity, a=1){
	if(!entity.render) return
	const hitboxes = buttons.has(KEYS.LEFT_OF_1) + renderBoxes
	if(entity == me || dt > 1/30) entity.ix = entity.x, entity.iy = entity.y
	else{
		entity.ix += ifloat(entity.x - entity.ix) * dt * 20
		entity.iy += ifloat(entity.y - entity.iy) * dt * 20
	}
	ctx.translate(ifloat(entity.ix - cam.x), ifloat(entity.iy - cam.y))
	const tint = getTint(entity.ix, entity.iy, a)
	entity.render(ctx.sub(), tint)
	if(hitboxes){
		if(entity.head && hitboxes >= 2){
			const L = entity == me ? hypot(pointer.x, pointer.y) : 0.8
			const ct2 = ctx.sub()
			ct2.translate(0, entity.head)
			ct2.rotate(entity.f)
			ct2.drawRect(-0.015625,-0.015625,0.03125,L,entityHitboxFacingCol)
			ct2.translate(0,L); ct2.rotate(PI * -1.25)
			ct2.drawRect(-0.015625,-0.015625,0.03125,0.2,entityHitboxFacingCol)
			ct2.drawRect(-0.015625,-0.015625,0.2,0.03125,entityHitboxFacingCol)
			ctx.drawRect(-entity.width + 0.04, entity.head - 0.02, entity.width*2 - 0.08, 0.04, entityHitboxHeadCol)
		}
		ctx.drawRect(-entity.width, .04, .04, entity.height-.08, entityHitboxCol)
		ctx.drawRect(-entity.width, 0, entity.width*2, .04, entityHitboxCol)
		ctx.drawRect(entity.width, .04, -.04, entity.height-.08, entityHitboxCol)
		ctx.drawRect(-entity.width, entity.height, entity.width*2, -.04, entityHitboxCol)
	}
}
drawLayer('world', 350, ctx => {
	for(const e of entityMap.values()) renderEntity(ctx.sub(), e)
	if(!me.linked && !(me.health<=0) && renderUI)
		renderEntity(ctx.sub(), me, .2)
})

function toString(big, num, precision = 3){
	let v
	if(!precision){
		v = (big + BigInt(floor(num))).toString()
	}else if(-num <= big) v = (big + BigInt(floor(num))).toString() + (num%1+1).toFixed(precision).slice(1)
	else{
		const x = big + BigInt(ceil(num))
		v = (x?'':'-') + x.toString() + (num%1-1).toFixed(precision).slice(2)
	}
	if(v.length > 50) v = v.slice(0, 10) + '...' + v.slice(-39)
	return v
}

const f3LeftInfo = `\\+e[Game version]\\+f (:3 thx for playing)
FPS: \\+a[Frames per second]\\+f (\\+a[time spent drawing frame]\\+f)
Net: \\+a[Network usage]\\+f${performance.memory?', Mem: \\+a[Memory usage]\\+f':''}
Draw: \\+a[GPU upload bandwidth]\\+f/\\+a[Sprite count]\\+f/\\+a[GL draw calls]\\+f
Ch: \\+a[Visible chunks]\\+f/\\+a[Cached chunks]\\+f, E: \\+a[Entities]\\+f, P: \\+a[Particles]\\+f
XY: \\+3[Player feet position]\\+f
ChXY: \\+3[Position w/in chunk]\\+f in \\+3[Chunk coords]\\+f
ChXY: \\+a[chTileIndex]\\+f in \\+a[chKey]\\+f
Facing: \\+c[\\4+L\\0+eft/\\4+R\\0+ight]\\+f \\+d[head direction in deg]\\+f (\\+d[in rad]\\+f)`
const f3RightInfo = `Gamma w/ \\+e[Renderer (GL/Vulkan/WebGPU) version]\\+f
Tick \\+d[dimension age]\\+f, Day \\+d[current MC day]\\+f, Time \\+d[and time]\\+f
Dim: \\+e[Current dimension ID]\\+f, Biome: \\+d[Temperature]\\+f/\\+d[Humidity]\\+f
Looking at: \\+3[Coordinate of block under pointer]\\+f
Light: \\+a[Light value]\\+f, sky=\\+a[sky light]\\+f, block=\\+a[block light]\\+f \\0+
Block: \\+e[block under pointer]\\+f (\\+a[ID for that block]\\+f)
Block.texture: \\+a[Atlas tex ID of that block]\\+f[\\+d[Animation frames]\\+f]
Item.texture: \\+a[Atlas tex ID of held item]\\+f[\\+d[Animation frames]\\+f]`
const minif3Info = `\\27[Game version]\\0f; \\+a[FPS]\\+f; \\4+[Player position]\\0+; \\+3[MC day & time]\\+f; [Looking at block]`

const glVer = gl.getParameter(gl.VERSION) + (globalThis.netscape ? ' (Gecko)' : '')
function f3Text(detail){
	const trueX = toString(bigintOffset.x, me.x, detail<2?0:3), trueY = toString(bigintOffset.y, me.y, detail<2?0:3)
	const day = floor((world.tick+6000)/24000), time = floor((world.tick/1000+6)%24).toString().padStart(2,'0')+':'+(floor((world.tick/250)%4)*15).toString().padStart(2,'0')
	const mex = floor(me.x) >> 3 & 6, mexi = (floor(me.x) & 15) / 16
	const lookingAt = getblock(floor(pointer.x + me.x), floor(pointer.y + me.y + me.head))
	const holding = me.inv[me.selected]
	const pointX = floor(pointer.x + me.x)|0, pointY = floor(pointer.y + me.y + me.head)|0, light = getLightValue(pointX, pointY)
	const mei = floor(me.x)&63|(floor(me.y)&63)<<6
	const mek = (floor(me.x)>>>6)+(floor(me.y)>>>6)*0x4000000
	if(detail < 2) return `\\27${VERSION}\\0f; \\+${(fps<20?'9':fps<50?'3':fps<235?'a':'d')+fps}\\+f fps; \\4+x: ${trueX}, y: ${trueY}\\0+; \\+3Day ${day} ${time}\\+f; ${(lookingAt.id?'':'\\+8')+lookingAt.className}\\+f`
	return [`Paper MC ${VERSION} (\\4+SHIFT\\0+ = \\+ehelp\\+f)
FPS: \\+${(fps<20?'9':fps<50?'3':fps<235?'a':'d')+fps}\\+f (${(timeToFrame*1000).toFixed(2).padStart(5,'\u2007')}ms)
Net: ${Number.formatData(networkUsage)}/s${performance.memory ? ', Mem: '+Number.formatData(performance.memory.usedJSHeapSize) : ''}
Draw: ${Number.formatData(frameData)}/${frameSprites}/${frameDrawCalls}
Ch: ${visibleChunks}/${map.size}, E: ${entityMap.size}, P: ${particles.size}
XY: \\4+${trueX} / ${trueY}\\0+
ChXY: ${(mei&63).toString().padStart(2,'\u2007')} ${(mei>>6).toString().padStart(2,'\u2007')} in ${toString(bigintOffset.x>>6n,floor(me.x) >> 6, 0)} ${toString(bigintOffset.y>>6n,floor(me.y) >> 6, 0)}
ChKey: ${mei} in ${mek}
Facing: ${(me.f >= 0 ? 'R' : 'L') + (90 - abs(me.f / PI2 * 360)).toFixed(1).padStart(5, '\u2007')} (${me.f.toFixed(3)})`,`\\+3Gamma\\+f w/ ${glVer}
Tick ${world.tick}, Day ${day}, Time ${time}
Dim: ${WorldTypeStrings[world.type]}, Biome: ${me.chunk ? round(me.chunk.biomes[mex] * (1 - mexi) + me.chunk.biomes[mex+2] * mexi) : 0}/${me.chunk ? round(me.chunk.biomes[mex+1] * (1 - mexi) + me.chunk.biomes[mex+3] * mexi) : 0}
Looking at: \\4+${toString(bigintOffset.x, pointX, 0)} ${toString(bigintOffset.y, pointY, 0)}\\0+
Light: 0x${light.toHex().slice(6)}, sky=${light>>4}, block=${light&15}
Block: ${lookingAt.className+(lookingAt.savedata?' {...}':'')} (${lookingAt.id})
Block.texture: ${lookingAt.texture>0?`0x${lookingAt.texture.toHex().slice(2)}[${_blockAnimations.find(a=>a.id==lookingAt.texture)?.frames??1}]`+(lookingAt.render?'\\+3*\\+f':''):lookingAt.render?'\\+8na\\+3*\\+f':'\\+8na\\+f'}
Item.texture: ${holding?.texture>0?`0x${holding.texture.toHex().slice(2)}[${_blockAnimations.find(a=>a.id==holding.texture)?.frames??1}]`+(holding.render?'\\+3*\\+f':''):holding?.render?'\\+8na\\+3*\\+f':'\\+8na\\+f'}`]
}
let didGc = false, r
if(globalThis.FinalizationRegistry){
	r = new FinalizationRegistry(() => {didGc = true; r.register({})})
	r.register({})
}
let dts = new Float32Array(256), dti = 0
drawLayer('ui', 999, (ctx, w, h) => {
	const f3 = min(renderF3+buttons.has(KEYS.LEFT_OF_1), 2)
	if(!f3) return
	const c = ctx.sub()
	c.translate(0, h)
	let text = buttons.has(KEYS.SHIFT)?f3<2?minif3Info:w<5?t%6<3?f3LeftInfo:['',f3RightInfo]:[f3LeftInfo,f3RightInfo]:f3Text(f3)
	const tl = typeof text == 'object' ? text[0] ? calcText(text[0], Infinity, 15) : [] : text ? calcText(text, Infinity, 15) : []
	const tr = typeof text == 'object' && text[1] ? calcText(text[1], Infinity, 15) : []
	const l = max(tl.length, tr.length)
	for(let i = 0; i < l; i++){
		let lineA = null, lineB = null
		let fontSize = min(1, (w-7)*.125/((i<tl.length?(lineA=tl[i]).width:0)+(i<tr.length?(lineB=tr[i]).width:0)))*8
		c.translate(0, -fontSize-2)
		if(lineA){
			c.drawRect(1, -1, lineA.width*fontSize+2, fontSize+2, textShadeCol)
			drawText(c, lineA, 2, 0, fontSize, 1)
		}
		if(lineB){
			const wid = lineB.width*fontSize
			c.drawRect(w-1, -1, -wid-2, fontSize+2, textShadeCol)
			drawText(c, lineB, w-wid-2, 0, fontSize, 1)
		}
	}
	const v = max(log2(dt) + 6.75, .75) * .5
	dts[dti] = didGc ? -v : v; dti = dti+1&127
	didGc = false
	if(renderF3 == 2){
		const c = ctx.sub()
		
		let dtj = dti
		do{
			const a = dts[dtj]
			if(a<0) c.drawRect(0,0,1,a*-8, vec4(.5,0,1,1))
			else c.drawRect(0,0,1,a*8, vec4(a,2-a,0,1))
			c.translate(1,0)
		}while((dtj=dtj+1&127)!=dti)
	}
	
})