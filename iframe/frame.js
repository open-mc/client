import { entityMap, map, cam, world, WorldType, WorldTypeStrings, bigintOffset, me, genLightmap, lightTint, lightTex, lightArr, setGamma, getTint, getLightValue, W2, H2, SCALE } from 'world'
import { getblock, gotopos } from 'ant'
import * as pointer from './pointer.js'
import { drawLayer, options, _renderPhases, renderBoxes, renderF3, drawText, calcText, textShadeCol, _networkUsage, networkUsage, listen, _tickPhases, renderUI } from 'api'
import { particles, blockAtlas, _recalcDimensions, prep, BlockIDs } from 'definitions'
import { VERSION } from '../server/version.js'
import { performLightUpdates } from './lighting.js'

const chunkShader = Shader(`void main(){
	ivec2 ipos = ivec2(pos*1024.);
	uvec2 a = uGetPixel(arg0, ivec3(ipos>>4u,0), 0).xy;
	uint light = uGetPixel(arg1, ivec3(ipos>>4u,0), 0).x;
	if(a.y>=65535u){
		if(light>=uni1.z) discard;
		color = vec4(0,0,0,1.-float(light>>4u)*.066666666);
	}else{
		if(a.y>255u){
			a.x += uni1.x%((a.y>>8u)+1u);
			a.y &= 255u;
			if(a.x>65535u){ a.y += a.x>>8u&65280u; a.x &= 65535u; }
		}
		ivec3 p = ivec3(int(a.x&255u)<<4|ipos.x&15, int(a.x>>8u)<<4|ipos.y&15,a.y);
		p.xy >>= uni1.y;
		color = getPixel(uni0, p, int(uni1.y)) * getPixel(uni2, ivec3(light, 0, 0), 0);
		if(color.a < 1. && light < uni1.z){
			color += vec4(0,0,0,1.-float(light>>4u)*.066666666)*(1.-color.a);
		}
	}
}`, [UTEXTURE, UTEXTURE], [TEXTURE, UVEC4, TEXTURE], FIXED)
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
	performLightUpdates()
	const a = cam.z / 12
	const chunkSublineCol = vec4(0, .53*a, a, a)
	const hitboxes = renderBoxes + buttons.has(KEYS.SYMBOL)
	cam.transform(ctx)
	ctx.shader = chunkShader
	prep()
	const mipmap = max(0, min(4, 4-round(log2(SCALE)+.05)))
	if(world.type == WorldType.overworld){
		const time = world.tick % 24000, light = time < 1800 ? time / 1800 : time < 13800 ? 1 : time < 15600 ? (15600 - time) / 1800 : 0
		genLightmap(light, block, night, day, light)
	}else if(world.type == WorldType.nether){
		genLightmap(-1, block, day, vec3.zero, 0, netherBase)
	}else if(world.type == WorldType.end){
		genLightmap(-2, block, day, vec3.zero, 0, endBase)
	}else genLightmap(1, block, vec3.zero, day, 1)
	chunkShader.uniforms(blockAtlas, vec4(world.animTick, mipmap, world.type == WorldType.overworld ? 240 : 0, (t%1)*1e6), lightTex)
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
		if(chunk.changed&1) chunk.changed&=-2, chunk.ctx2.pasteData(chunk.light)
		ctx.drawRect(x0, y0, S, S, chunk.ctx, chunk.ctx2)
	}
	ctx.shader = null
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
			gotopos(chunk, i)
			void(b==65535?chunk.tileData.get(i):BlockIDs[b]).render(l, lightTint)
			l.resetTo(a)
		}
		if(chunk.flags&1) a.draw(b)
		if(hitboxes){
			if(hitboxes >= 2){
				for(let i = .125; i < 1; i += .125)
					a.drawRect(i - lineWidth*.5, 0, lineWidth, 64, chunkSublineCol)
				for(let i = .125; i < 1; i += .125)
					a.drawRect(0, i - lineWidth*.5, 64, lineWidth, chunkSublineCol)
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
const entityHitboxCol = vec4(1), entityHitboxHeadCol = vec4(.8,0,0,1), entityHitboxFacingCol = vec4(.8, .64, 0, 1)
function renderEntity(ctx, entity, a=1){
	if(!entity.render) return
	const hitboxes = buttons.has(KEYS.SYMBOL) + renderBoxes
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
drawLayer('world', 350, (ctx, w, h) => {
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
Draw: \\+a[GPU mem bandwidth]\\+f/\\+a[Sprite count]\\+f/\\+a[GL draw calls]\\+f
Ch: \\+a[Visible chunks]\\+f/\\+a[Cached chunks]\\+f, E: \\+a[Entities]\\+f, P: \\+a[Particles]\\+f
XY: \\+3[Player feet position]\\+f
ChXY: \\+3[Position w/in chunk]\\+f in \\+3[Chunk coords]\\+f
ChXY: \\+a[chTileIndex]\\+f in \\+a[chKey]\\+f
Facing: \\+c[\\4+L\\0+eft/\\4+R\\0+ight]\\+f \\+d[head direction in deg]\\+f (\\+d[in rad]\\+f`
const f3RightInfo = `Tick \\+d[dimension age]\\+f, Day \\+d[current day in MC days]\\+f, Time \\+d[time within MC day]\\+f
Dimension: \\+e[current dimension ID]\\+f
Biome: \\+d[Humidity]\\+f/\\+d[Temperature]\\+f
Looking at: \\+3[Coordinate of block under pointer]\\+f
Light: \\+a[Light value]\\+f, sky=\\+a[sky light]\\+f, block=\\+a[block light]\\+f \\0+
Block: \\+e[block under pointer]\\+f (\\+a[ID for that block]\\+f)
Block.texture: \\+a[Atlas tex ID of that block]\\+f[\\+d[Animation frames]\\+f]
Item.texture: \\+a[Atlas tex ID of held item]\\+f[\\+d[Animation frames]\\+f]`
const minif3Info = `\\27[Game version]\\0f; \\+a[FPS]\\+f; \\4+[Player position]\\0+; \\+6[MC day & time]\\+f; [Looking at block]`


function f3Text(detail){
	const trueX = toString(bigintOffset.x, me.x, detail<2?0:3), trueY = toString(bigintOffset.y, me.y, detail<2?0:3)
	const day = floor((world.tick+6000)/24000), time = floor((world.tick/1000+6)%24).toString().padStart(2,'0')+':'+(floor((world.tick/250)%4)*15).toString().padStart(2,'0')
	const mex = floor(me.x) >> 3 & 6, mexi = (floor(me.x) & 15) / 16
	const lookingAt = getblock(floor(pointer.x + me.x), floor(pointer.y + me.y + me.head))
	const holding = me.inv[me.selected]
	const pointX = floor(pointer.x + me.x)|0, pointY = floor(pointer.y + me.y + me.head)|0, light = getLightValue(pointX, pointY)
	const mei = floor(me.x)&63|(floor(me.y)&63)<<6
	const mek = (floor(me.x)>>>6)+(floor(me.y)>>>6)*0x4000000
	if(detail < 2) return `\\27${VERSION}\\0f; \\+${(fps<20?'9':fps<50?'3':fps<235?'a':'d')+fps}\\+f fps; \\4+x: ${trueX}, y: ${trueY}\\0+; \\+6Day ${day} ${time}\\+f; ${(lookingAt.id?'':'\\+8')+lookingAt.className}\\+f`
	return [`Paper MC ${VERSION} (Ctrl for f3 help)
FPS: \\+${(fps<20?'9':fps<50?'3':fps<235?'a':'d')+fps}\\+f (${(timeToFrame*1000).toFixed(2).padStart(5,'\u2007')}ms)
Net: ${Number.formatData(networkUsage)}/s${performance.memory ? ', Mem: '+Number.formatData(performance.memory.usedJSHeapSize) : ''}
Draw: ${Number.formatData(frameData)}/${frameSprites}/${frameDrawCalls}
Ch: ${visibleChunks}/${map.size}, E: ${entityMap.size}, P: ${particles.size}
XY: \\4+${trueX} / ${trueY}\\0+
ChXY: ${(mei&63).toString().padStart(2,'\u2007')} ${(mei>>6).toString().padStart(2,'\u2007')} in ${toString(bigintOffset.x>>6n,floor(me.x) >> 6, 0)} ${toString(bigintOffset.y>>6n,floor(me.y) >> 6, 0)}
ChKey: ${mei} in ${mek}
Facing: ${(me.f >= 0 ? 'R' : 'L') + (90 - abs(me.f / PI2 * 360)).toFixed(1).padStart(5, '\u2007')} (${me.f.toFixed(3)})`,`Tick ${world.tick}, Day ${day}, Time ${time}
Dimension: ${WorldTypeStrings[world.type]}
Biome: ${me.chunk ? round(me.chunk.biomes[mex] * (1 - mexi) + me.chunk.biomes[mex+2] * mexi) : 0}/${me.chunk ? round(me.chunk.biomes[mex+1] * (1 - mexi) + me.chunk.biomes[mex+3] * mexi) : 0}
Looking at: \\4+${toString(bigintOffset.x, pointX, 0)} ${toString(bigintOffset.y, pointY, 0)}\\0+
Light: 0x${light.toHex().slice(6)}, sky=${light>>4}, block=${light&15}
Block: ${lookingAt.className+(lookingAt.savedata?' {...}':'')} (${lookingAt.id})
Block.texture: 0x${lookingAt.texture>=0?`${lookingAt.texture.toHex().slice(2)}[${(lookingAt.texture>>>24)+1}]`+(lookingAt.render?'*':''):lookingAt.render?'na*':'na'}
Item.texture: 0x${holding?.texture>=0?`${holding.texture.toHex().slice(2)}[${(holding.texture>>>24)+1}]`+(holding.render?'*':''):holding?.render?'na*':'na'}`]
}

drawLayer('ui', 999, (ctx, w, h) => {
	const f3 = min(renderF3+buttons.has(KEYS.SYMBOL), 2)
	if(!f3) return
	ctx.translate(0, h)
	let text = buttons.has(KEYS.CTRL)?f3<2?minif3Info:w<5?t%6<3?f3LeftInfo:['',f3RightInfo]:[f3LeftInfo,f3RightInfo]:f3Text(f3)
	const tl = typeof text == 'object' ? text[0] ? calcText(text[0], Infinity, 15) : [] : text ? calcText(text, Infinity, 15) : []
	const tr = typeof text == 'object' && text[1] ? calcText(text[1], Infinity, 15) : []
	const l = max(tl.length, tr.length)
	for(let i = 0; i < l; i++){
		let lineA = null, lineB = null
		let fontSize = min(1, (w-7)*.125/((i<tl.length?(lineA=tl[i]).width:0)+(i<tr.length?(lineB=tr[i]).width:0)))*8
		ctx.translate(0, -fontSize-2)
		if(lineA){
			ctx.drawRect(1, -1, lineA.width*fontSize+2, fontSize+2, textShadeCol)
			drawText(ctx, lineA, 2, 0, fontSize, 1)
		}
		if(lineB){
			const wid = lineB.width*fontSize
			ctx.drawRect(w-1, -1, -wid-2, fontSize+2, textShadeCol)
			drawText(ctx, lineB, w-wid-2, 0, fontSize, 1)
		}
	}
})