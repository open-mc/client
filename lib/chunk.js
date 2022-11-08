import { zoom_correction } from "../index.js";
import { TEX_SIZE } from "../textures.js";
import { BlockIDs } from "./definitions.js";
const canvasPool = []
export class Chunk{
	constructor(buffer){
		const x = buffer.int(), y = buffer.int()
		this.x = x << 6 >> 6
		this.y = y << 6 >> 6
		this.tiles = []
		this.entities = new Set()
		this.node = this.ctx = null
		this.r1 = 0
		this.r2 = 0
		//read buffer palette
		let palettelen = (x >>> 26) + (y >>> 26) * 64 + 1
		let id = buffer.short()
		while(id){
			const e = EntityIDs[id]({
				x: buffer.short() / 1024 + (this.x << 6),
				y: buffer.short() / 1024 + (this.y << 6),
				_id: buffer.int() + buffer.short() * 4294967296,
				dx: buffer.float(), dy: buffer.float(),
				f: buffer.float()
			})
			if(e.savedata)buffer.read(e.savedata, e)
			entities.set(e._id, e)
			this.entities.add(e)
			id = buffer.short()
		}
		let palette = []
		let i = 0
		for(;i<palettelen;i++){
			palette.push(BlockIDs[buffer.short()]._)
		}
		let j = 0; i = 11 + i * 2
		if(palettelen<2){
			for(;j<4096;j++)this.tiles.push(palette[0])
		}else if(palettelen == 2){
			for(;j<512;j++){
				const byte = buffer.byte()
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
				const byte = buffer.byte()
				this.tiles.push(palette[byte&3])
				this.tiles.push(palette[(byte>>2)&3])
				this.tiles.push(palette[(byte>>4)&3])
				this.tiles.push(palette[byte>>6])
			}
		}else if(palettelen <= 16){
			for(;j<2048;j++){
				const byte = buffer.byte()
				this.tiles.push(palette[byte&15])
				this.tiles.push(palette[(byte>>4)])
			}
		}else if(palettelen <= 256){
			for(;j<4096;j++){
				this.tiles.push(palette[buffer.byte()])
			}
		}else{
			for(;j<6144;j+=3){
				let byte2
				this.tiles.push(palette[buffer.byte() + (((byte2 = buffer.byte())&0x0F)<<8)])
				this.tiles.push(palette[buffer.byte() + ((byte2&0xF0)<<4)])
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
		return new Chunk(new DataReader(Uint8Array.of(16, x >> 24, x >> 16, x >> 8, x, y >> 24, y >> 16, y >> 8, y, 0, 0, block.id >> 8, block.id)))
	}
	hide(){
		if(!this.node)return
		this.node.remove()
		canvasPool.push(this.node)
		this.node = this.ctx = null
		this.r1 = 0
		this.r2 = 0
	}
	updaterender(){
		const x0 = Math.floor(Math.fclamp(Math.ifloat(cam.x - W2 - (this.x << 6)) / 8, 8))
		const x1 = Math.ceil(Math.fclamp(Math.ifloat(cam.x + W2 - (this.x << 6)) / 8, 8))
		const y0 = Math.floor(Math.fclamp(Math.ifloat(cam.y - H2 - (this.y << 6)) / 8, 8))
		const y1 = Math.ceil(Math.fclamp(Math.ifloat(cam.y + H2 - (this.y << 6)) / 8, 8))
		if(x0 == x1 || y0 == y1)return this.hide()
		if(!this.node){
			this.node = canvasPool.pop() || document.createElement('canvas')
			this.ctx = this.node.getContext('2d')
			this.node.width = this.node.height = 64 * TEX_SIZE //1024 = 64 * 16 //1024
			this.position()
			chunks.appendChild(this.node)
		}
		for(let x = x0; x < x1; x++){
			for(let y = y0; y < y1; y++){
				if(y < 4){
					if(this.r1 >> (x + (y*8)) & 1)continue
					this.draw(x, y)
					this.r1 |= (1 << (x + (y*8)))
				}else{
					if(this.r2 >> (x + (y*8)) & 1)continue
					this.draw(x, y)
					this.r2 |= (1 << (x + (y*8)))
				}
			}
		}
	}
	draw(ax, ay){
		const xa = ax * 8 + 8
		const ya = ay * 8 + 8
		for(let x = xa - 8; x < xa; x++){
			for(let y = ya - 8; y < ya; y++){
				const t = this.tiles[x+y*64].texture
				if(!t)continue
				this.ctx.drawImage(t,x*TEX_SIZE,(63-y)*TEX_SIZE,TEX_SIZE,TEX_SIZE)
			}
		}
	}
	position(){
		let x = Math.ifloat(this.x * 64 - cam.x)
		let y = Math.ifloat(this.y * 64 - cam.y)
		if(this.node)this.node.style.transform = `translate(${Math.floor(innerWidth / 2) + zoom_correction * x * TEX_SIZE}px, ${Math.ceil(innerHeight / -2) + zoom_correction * -y * TEX_SIZE}px)`
	}
}