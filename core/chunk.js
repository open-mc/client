import { BlockIDs, EntityIDs, Classes } from 'definitions'
import { _add, _addDark } from './lighting.js'
import { map } from 'world'

const texturePool = []
const chunkUVData = new Uint16Array(8192)
let awaitingIds = []
let awI = 0
export class Chunk extends Uint16Array{
	constructor(buf){
		super(4096)
		this.light = new Uint8Array(4096)
		this.tileData = new Map()
		this.x = buf.int()&0x3ffffff
		this.y = buf.int()&0x3ffffff
		this.up = this.left = this.right = this.down = null
		this.lightI = -2
		this.ticks = new Map()
		this.entities = new Set()
		this.ctx2 = this.ctx = this.writeCtx = null
		this.av = null
		this.lastFrame = 0
		this.layer = 0
		this.flags = 0
		const Schema = Chunk.savedatahistory[buf.flint()] || Chunk.savedata
		const l = buf.short()
		buf.i += l * 2
		//read buffer palette
		let palettelen = buf.byte() + 1
		let id
		while((id = buf.short()) != 65535){
			const e = new EntityIDs[id]()
			e.x = buf.short() / 1024 + (this.x << 6)
			e.y = buf.short() / 1024 + (this.y << 6)
			buf.i += 6
			e.name = buf.string(); e.state = buf.short()
			e.dx = buf.float(); e.dy = buf.float()
			e.f = buf.float(); e.age = buf.double()
			e.chunk = this
			if(e.savedata) buf.read(e.savedatahistory[buf.flint()] || e.savedata, e)
			awaitingIds.push(e)
			this.entities.add(e)
		}
		this.biomes = [buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte()]
		let palette = []
		if(palettelen) for(let i = 0;i<palettelen;i++) palette.push(buf.short())
		if(palettelen == 1){
			for(let j=0;j<4096;j++) this[j] = palette[0]
		}else if(palettelen == 2){
			const u8 = buf.uint8array(512)
			for(let j=0;j<4096;j+=8){
				const byte = u8[j>>3]
				this[j  ] = palette[byte&1]
				this[j+1] = palette[(byte>>1)&1]
				this[j+2] = palette[(byte>>2)&1]
				this[j+3] = palette[(byte>>3)&1]
				this[j+4] = palette[(byte>>4)&1]
				this[j+5] = palette[(byte>>5)&1]
				this[j+6] = palette[(byte>>6)&1]
				this[j+7] = palette[byte>>7]
			}
		}else if(palettelen <= 4){
			const u8 = buf.uint8array(1024)
			for(let j=0;j<4096;j+=4){
				const byte = u8[j>>2]
				this[j  ] = palette[byte&3]
				this[j+1] = palette[(byte>>2)&3]
				this[j+2] = palette[(byte>>4)&3]
				this[j+3] = palette[byte>>6]
			}
		}else if(palettelen <= 16){
			const u8 = buf.uint8array(2048)
			for(let j=0;j<4096;j+=2){
				const byte = u8[j>>1]
				this[j  ] = palette[byte&15]
				this[j+1] = palette[(byte>>4)]
			}
		}else{
			const u8 = buf.uint8array(4096)
			for(let j=0;j<4096;j++) this[j] = palette[u8[j]]
		}
		//parse block entities
		for(let j=0;j<4096;j++){
			if(this[j] == 65535) this[j] = buf.short()
			const block = BlockIDs[this[j]]
			if(block.brightness) _add(this, j)
			if(!block.savedata) continue
			this[j] = 65535
			const b = buf.read(block.savedatahistory[buf.flint()] || block.savedata, new block)
			const v = b.parsed?.()
			if(v!==undefined) this.ticks.set(j, v)
			this.tileData.set(j, b)
		}
		buf.read(Schema, this)
		this.rerenders = []
	}
	static savedatahistory = []
	hide(){
		if(!this.ctx) return
		if(this.av.push(this.layer) == 1) texturePool.push({ctx: this.ctx, ctx2: this.ctx2, av: this.av, added: Date.now()})
		this.ctx = this.ctx2 = this.writeCtx = null
		this.rerenders.length = 0
	}
	draw(){
		if(this.ctx) return

		if(texturePool.length){
			void ({av: this.av, ctx: this.ctx, ctx2: this.ctx2} = texturePool[texturePool.length-1])
			this.layer = this.av.pop()
			if(!this.av.length) texturePool.pop()
		}else{
			const layers = max(4, min(Texture.MAX_LAYERS, map.size>>3))
			this.ctx = Texture(64, 64, layers, 0, Formats.RG16)
			this.ctx2 = Texture(64, 64, layers, 0, Formats.R8)
			this.av = []
			if(layers > 1){
				for(let i=1;i<layers;i++) this.av.push(i)
				texturePool.push({ctx: this.ctx, ctx2: this.ctx2, av: this.av, added: Date.now()})
			}
		}
		for(let i = 0; i < 4096; i++){
			const b = this[i]
			const {texture, render} = b==65535 ? this.tileData.get(i) : BlockIDs[b]
			if(render) this.rerenders.push(i)
			if(texture>=0){
				chunkUVData[i<<1] = texture
				chunkUVData[i<<1|1] = texture>>16
			}else chunkUVData[i<<1|1] = 65535
		}
		this.ctx.pasteData(chunkUVData, 0, 0, this.layer, 64, 64, 1)
		this.ctx2.pasteData(this.light, 0, 0, this.layer, 64, 64, 1)
		this.changed = 0
	}
	updateDrawn(i, b, ob){
		if(b.solid){if(!ob.solid){
			const y = this.y<<6|i>>6
			if(((this.exposure[i&63]-y)|0)<=0) this.exposure[i&63] = y+1|0
		}}else if(ob.solid){
			let y = (this.y<<6|i>>6)+1|0
			let i2 = i, ch = this
			if(this.exposure[i&63]==y){
				while(true){
					if(i2<64){ const c = ch.down; if(!c){ i2=ch.y<<6; break }; ch=c; i2 += 4096 }
					const b = ch[i2-=64], {solid} = b==65535?ch.tileData.get(i2):BlockIDs[b]
					if(solid){ i2 = (ch.y<<6|i2>>6)+1|0; break }
				}
				this.exposure[i&63] = i2
			}
		}
		const {opacity:o2,brightness:b2} = b
		const {opacity:o1,brightness:b1} = ob
		if(o2>o1||b2<b1) _addDark(this, i)
		if(o2<o1||b2>b1) _add(this, i)
		if(!this.ctx) return
		if(!this.writeCtx){
			const ctx = this.writeCtx = this.ctx.drawable(this.layer)
			ctx.box(.0078125, .0078125, .015625, .015625)
			ctx.geometry = pointGeometry
			ctx.shader = ctxWriteShader
		}
		const j = this.rerenders.indexOf(i), r = b.render != undefined
		if((j == -1) & r) this.rerenders.push(i)
		else if((j > -1) & !r) this.rerenders.splice(j, 1)
		this.writeCtx.drawRect(i&63,i>>6,1,1,b.texture)
	}
	redrawBlock(i, b){
		_addDark(this, i)
		_add(this, i)
		if(b.solid){
			const y = this.y<<6|i>>6
			if((this.exposure[i&63]-y)|0<=0) this.exposure[i&63] = y+1|0
		}else{
			let y = (this.y<<6|i>>6)+1|0
			let i2 = i, ch = this
			if(this.exposure[i&63]==y){
				while(true){
					if(i2<64){ const c = ch.down; if(!c){ i2=ch.y<<6; break }; ch=c; i2 += 4096 }
					const b = ch[i2-=64], {solid} = b==65535?ch.tileData.get(i2):BlockIDs[b]
					if(solid){ i2 = (ch.y<<6|i2>>6)+1|0; break }
				}
				this.exposure[i&63] = i2
			}
		}
		if(!this.ctx) return
		if(!this.writeCtx){
			const ctx = this.writeCtx = this.ctx.drawable(this.layer)
			ctx.box(.0078125, .0078125, .015625, .015625)
			ctx.geometry = pointGeometry
			ctx.shader = ctxWriteShader
		}
		const j = this.rerenders.indexOf(i), r = b.render != undefined
		if((j == -1) & r) this.rerenders.push(i)
		else if((j > -1) & !r) this.rerenders.splice(j, 1)
		this.writeCtx.drawRect(i&63,i>>6,1,1,b.texture)
	}
	changed = 0
}
const pointGeometry = Geometry(POINTS, [0, 0, 0, 0])
const ctxWriteShader = Shader(`void main(){
	color.xy = uvec2(arg0&0xffffu, arg0>>16);
}`, [UINT], _, UINT)

Classes[1] = Chunk

setInterval(() => {
	const exp = Date.now()-30e3

	for(let i = 0; i < texturePool.length; i++){
		const o = texturePool[i]
		if(o.added > exp) break
		if(o.av.length < o.ctx.layers) continue
		o.ctx.delete()
		o.ctx2.delete()
		texturePool.splice(i--, 1)
	}
}, 10e3)
export function gotId(id){
	const e = awaitingIds[awI++]
	if(e) e.netId = id, e.place()
	if(awI == awaitingIds.length) awaitingIds.length = 0, awI = 0
	else if(awI > 15 && awI > (awaitingIds.length>>1)) awaitingIds = awaitingIds.slice(awI), awI = 0
}