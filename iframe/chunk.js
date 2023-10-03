import { BlockIDs, EntityIDs } from 'definitions'
const canvasPool = []
export class Chunk extends Uint16Array{
	constructor(buf){
		super(4096)
		this.tileData = new Map
		this.x = buf.int()
		this.y = buf.int()
		this.ref = 0
		this.entities = new Set()
		this.ctx = null

		const Schema = Chunk.savedatahistory[buf.flint()] || Chunk.savedata
		//read buffer palette
		let palettelen = buf.byte() + 1 & 0xFF
		let id
		while((id = buf.short()) != 65535){
			const e = EntityIDs[id]()
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
		if(palettelen == 0){
			const arr = buf.uint8array(8192)
			this.set(new Uint16Array(arr.buffer, arr.byteOffset, arr.byteLength))
		}else if(palettelen == 1){
			for(let j=0;j<4096;j++)this[j] = palette[0]
		}else if(palettelen == 2){
			for(let j=0;j<4096;j+=8){
				const byte = buf.byte()
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
			for(let j=0;j<4096;j+=4){
				const byte = buf.byte()
				this[j  ] = palette[byte&3]
				this[j+1] = palette[(byte>>2)&3]
				this[j+2] = palette[(byte>>4)&3]
				this[j+3] = palette[byte>>6]
			}
		}else if(palettelen <= 16){
			for(let j=0;j<4096;j+=2){
				const byte = buf.byte()
				this[j  ] = palette[byte&15]
				this[j+1] = palette[(byte>>4)]
			}
		}else for(let j=0;j<4096;j++) this[j] = palette[buf.byte()]
		//parse block entities
		for(let j=0;j<4096;j++){
			const block = BlockIDs[this[j]]
			if(!block.savedata)continue
			this[j] = 65535
			this.tileData.set(j, buf.read(block.savedatahistory[buf.flint()] || block.savedata, block()))
		}
		buf.read(Schema, this)
		this.rerenders = []
	}
	static savedatahistory = []
	hide(){
		if(!this.ctx) return
		canvasPool.push(this.ctx)
		this.ctx.clearRect(0, 0, TEX_SIZE << 6, TEX_SIZE << 6)
		this.ctx = null
		this.rerenders.length = 0
	}
	draw(){
		if(this.ctx) return
		this.ctx = canvasPool.pop()
		if(!this.ctx)this.ctx = Can(TEX_SIZE << 6, TEX_SIZE << 6)
		for(let x = 0; x < 64; x++){
			for(let y = 0; y < 64; y++){
				const b = this[x|(y<<6)]
				const {texture, render} = b==65535 ? this.tileData.get(x|(y<<6)) : BlockIDs[b]
				if(render) this.rerenders.push(x|(y<<6))
				if(texture)
					this.ctx.drawImage(texture.canvas,texture.x,texture.y,texture.w,texture.h,x*TEX_SIZE,(63-y)*TEX_SIZE,TEX_SIZE,TEX_SIZE)
			}
		}
	}
}