import { BlockIDs, EntityIDs, Classes } from 'definitions'

const texturePool = []
const chunkUVData = new Uint16Array(8192)
export class Chunk extends Uint16Array{
	constructor(buf){
		super(4096)
		this.light = new Uint16Array(4096)
		this.tileData = new Map
		this.x = buf.int()
		this.y = buf.int()
		this.ref = 0
		this.entities = new Set()
		this.ctx2 = this.ctx = this.writeCtx = null
		this.lastFrame = 0
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
			e.netId = buf.uint32() + buf.uint16() * 4294967296
			e.name = buf.string(); e.state = buf.short()
			e.dx = buf.float(); e.dy = buf.float()
			e.f = buf.float(); e.age = buf.double()
			e.chunk = this
			if(e.savedata)buf.read(e.savedatahistory[buf.flint()] || e.savedata, e)
			e.place()
			this.entities.add(e)
		}
		this.biomes = [buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte()]
		let palette = []
		if(palettelen) for(let i = 0;i<palettelen;i++) palette.push(buf.short())
		if(palettelen == 1){
			for(let j=0;j<4096;j++)this[j] = palette[0]
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
			if(!block.savedata)continue
			this[j] = 65535
			this.tileData.set(j, buf.read(block.savedatahistory[buf.flint()] || block.savedata, new block))
		}
		buf.read(Schema, this)
		this.rerenders = []
	}
	static savedatahistory = []
	hide(){
		if(!this.ctx) return
		texturePool.push(this.ctx, this.ctx2)
		this.ctx = this.ctx2 = this.writeCtx = null
		this.rerenders.length = 0
	}
	draw(){
		if(this.ctx) return
		// ctx2 went in last, ctx2 comes out first
		this.ctx2 = texturePool.pop()
		this.ctx = texturePool.pop()
		if(!this.ctx){
			this.ctx = Texture(64, 64, 1, 0, Formats.RG16)
			this.ctx2 = Texture(64, 64, 1, 0, Formats.R16)
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
		this.ctx.pasteData(chunkUVData)
	}
	updateDrawn({texture, render}, i){
		if(!this.ctx) return
		if(!this.writeCtx){
			const ctx = this.writeCtx = this.ctx.drawable()
			ctx.box(.0078125, .0078125, .015625, .015625)
			ctx.geometry = pointGeometry
			ctx.shader = ctxWriteShader
		}
		let j = this.rerenders.indexOf(i)
		if((j == -1) & (render != undefined)) this.rerenders.push(i)
		else if((j > -1) & (render == undefined)) this.rerenders.splice(j, 1)
		this.writeCtx.drawRect(i&63,i>>6,1,1,texture)
	}
}
const pointGeometry = Geometry(POINTS, [0, 0])
const ctxWriteShader = Shader(`void main(){
	color.xy = uvec2(arg0&0xffffu, arg0>>16);
}`, [UINT], _, UINT)

Classes[1] = Chunk

setTimeout(() => {
	if(texturePool.length > 10){
		for(const s of texturePool) s.delete()
		texturePool.length = 0
	}
}, 10e3)