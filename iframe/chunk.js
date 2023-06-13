import { BlockIDs, EntityIDs } from 'definitions'
const canvasPool = []
export class Chunk{
	constructor(buf){
		this.x = buf.int() << 6 >> 6
		this.y = buf.int() << 6 >> 6
		this.ref = 0
		this.tiles = []
		this.entities = new Set()
		this.ctx = null
		//read buffer palette
		let palettelen = buf.short() + 1
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
		if(palettelen<1024)for(let i = 0;i<palettelen;i++) palette.push(BlockIDs[buf.short()])
		if(palettelen<2){
			for(let j=0;j<4096;j++)this.tiles.push(palette[0])
		}else if(palettelen == 2){
			for(let j=0;j<512;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&1])
				this.tiles.push(palette[(byte>>1)&1])
				this.tiles.push(palette[(byte>>2)&1])
				this.tiles.push(palette[(byte>>3)&1])
				this.tiles.push(palette[(byte>>4)&1])
				this.tiles.push(palette[(byte>>5)&1])
				this.tiles.push(palette[(byte>>6)&1])
				this.tiles.push(palette[byte>>7])
			}
		}else if(palettelen <= 4){
			for(let j=0;j<1024;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&3])
				this.tiles.push(palette[(byte>>2)&3])
				this.tiles.push(palette[(byte>>4)&3])
				this.tiles.push(palette[byte>>6])
			}
		}else if(palettelen <= 16){
			for(let j=0;j<2048;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&15])
				this.tiles.push(palette[(byte>>4)])
			}
		}else if(palettelen <= 256){
			for(let j=0;j<4096;j++){
				this.tiles.push(palette[buf.byte()])
			}
		}else if(palettelen < 1024){
			for(let j=0;j<6144;j+=3){
				let byte2
				this.tiles.push(palette[buf.byte() + (((byte2 = buf.byte())&0x0F)<<8)])
				this.tiles.push(palette[buf.byte() + ((byte2&0xF0)<<4)])
			}
		}else for(let j=0;j<4096;j++){
			this.tiles.push(BlockIDs[buf.short()])
		}
		//parse block entities
		for(let j=0;j<4096;j++){
			const block = this.tiles[j]
			if(!block){this.tiles[j] = Blocks.air; continue}
			if(!block.savedata)continue
			//decode data
			this.tiles[j] = buf.read(block.savedatahistory[buf.flint()] || block.savedata, block())
		}
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
				const {texture, render} = this.tiles[x|(y<<6)]
				if(render) this.rerenders.push(x|(y<<6))
				if(texture)
					this.ctx.drawImage(texture.canvas,texture.x,texture.y,texture.w,texture.h,x*TEX_SIZE,(63-y)*TEX_SIZE,TEX_SIZE,TEX_SIZE)
			}
		}
	}
}