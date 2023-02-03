import { addEntity } from "./world.js"

const canvasPool = []
export class Chunk{
	constructor(buf){
		const x = buf.int(), y = buf.int()
		this.x = x << 6 >> 6
		this.y = y << 6 >> 6
		this.tiles = []
		this.entities = new Set()
		this.ctx = null
		this.r1 = 0
		this.r2 = 0
		//read buffer palette
		let palettelen = (x >>> 26) + (y >>> 26) * 64 + 1
		let id = buf.short()
		while(id){
			const e = EntityIDs[id]({
				x: buf.short() / 1024 + (this.x << 6),
				y: buf.short() / 1024 + (this.y << 6),
				_id: buf.uint32() + buf.uint16() * 4294967296,
				name: buf.string(), state: buf.short(),
				dx: buf.float(), dy: buf.float(),
				f: buf.float(), chunk: this
			})
			if(e.savedata)buf.read(e.savedata, e)
			addEntity(e)
			this.entities.add(e)
			if(e.appeared)e.appeared()
			id = buf.short()
		}
		this.biomes = [buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte()]
		let palette = []
		let i = 0
		for(;i<palettelen;i++){
			palette.push(BlockIDs[buf.short()]._)
		}
		let j = 0; i = 11 + i * 2
		if(palettelen<2){
			for(;j<4096;j++)this.tiles.push(palette[0])
		}else if(palettelen == 2){
			for(;j<512;j++){
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
			for(;j<1024;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&3])
				this.tiles.push(palette[(byte>>2)&3])
				this.tiles.push(palette[(byte>>4)&3])
				this.tiles.push(palette[byte>>6])
			}
		}else if(palettelen <= 16){
			for(;j<2048;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&15])
				this.tiles.push(palette[(byte>>4)])
			}
		}else if(palettelen <= 256){
			for(;j<4096;j++){
				this.tiles.push(palette[buf.byte()])
			}
		}else{
			for(;j<6144;j+=3){
				let byte2
				this.tiles.push(palette[buf.byte() + (((byte2 = buf.byte())&0x0F)<<8)])
				this.tiles.push(palette[buf.byte() + ((byte2&0xF0)<<4)])
			}
		}
		//parse block entities
		for(j=0;j<4096;j++){
			let type = this.tiles[j].savedata
			if(!type)continue
			//decode data
			let data = {}
			Object.setPrototypeOf(data, this.tiles[j])
			this.tiles[j] = data
		}
	}
	static of(block, x, y){
		return new Chunk(new DataReader(Uint8Array.of(16, x >> 24, x >> 16, x >> 8, x, y >> 24, y >> 16, y >> 8, y, 0, 0, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, block.id >> 8, block.id)))
	}
	hide(){
		if(!this.ctx)return
		canvasPool.push(this.ctx)
		this.ctx.clearRect(0, 0, TEX_SIZE << 6, TEX_SIZE << 6)
		this.ctx = null
	}
	draw(){
		if(this.ctx)return
		this.ctx = canvasPool.pop()
		if(!this.ctx)this.ctx = Can(TEX_SIZE << 6, TEX_SIZE << 6)
		for(let x = 0; x < 64; x++){
			for(let y = 0; y < 64; y++){
				const t = this.tiles[x|(y<<6)].texture
				if(!t)continue
				this.ctx.image(t,x*TEX_SIZE,(63-y)*TEX_SIZE,TEX_SIZE,TEX_SIZE)
			}
		}
	}
}