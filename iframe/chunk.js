import { BlockIDs, EntityIDs } from 'definitions'
import { world } from 'world'
import { Classes } from './definitions.js'

const canvasPool = []
const lightData = new ImageData(64, 64)

//export const lightToRgba = Array.from({length:1024}, (_,i) => )

export class Chunk extends Uint16Array{
	constructor(buf){
		super(4096)
		this.light = new Uint16Array(4096)
		this.tileData = new Map
		this.x = buf.int()
		this.y = buf.int()
		this.ref = 0
		this.entities = new Set()
		this.ctx2 = this.ctx = null
		this.lastFrame = 0
		this.animatedTiles = new Uint32Array(128)
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
		canvasPool.push(this.ctx, this.ctx2)
		this.ctx.clearRect(0, 0, 64, 64)
		this.ctx = null
		this.rerenders.length = 0
		for(let i = 0; i < 128; i++) this.animatedTiles[i] = 0
	}
	draw(det){
		if(this.ctx) this.hide()
		this.ctx = canvasPool.pop()
		this.ctx2 = canvasPool.pop()
		if(!this.ctx)this.ctx = Can(det*64, det*64), this.ctx.scale(det,det), this.ctx2 = Can(64, 64)
		else if(this.ctx.w != det*64){
			this.ctx.resize(det*64, det*64)
			this.ctx.scale(det,det)
		}
		this._draw()
	}
	_draw(){
		for(let x = 0; x < 64; x++){
			for(let y = 0; y < 64; y++){
				const i = x|(y<<6)
				const b = this[i]
				const {texture, render} = b==65535 ? this.tileData.get(x|(y<<6)) : BlockIDs[b]
				if(render) this.rerenders.push(x|(y<<6))
				if(texture){
					const frames = floor(texture.h / texture.w)
					if(frames > 1)
						this.animatedTiles[i>>5] |= 1<<(i&31)
					this.ctx.drawImage(texture.canvas,texture.x,texture.y + (world.tick % floor(texture.h / texture.w)) * texture.w,texture.w,texture.w,x,63-y,1,1)
				}
			}
		}
		this.lastFrame = world.tick
		for(let i = 0; i < 4096; i += 8){

		}
		this.ctx2.putImageData(lightData, 0, 0)
	}
	animate(){
		if(this.lastFrame == world.tick) return
		this.lastFrame = world.tick
		for(let i = 0; i < 128; i++){
			let int = this.animatedTiles[i]
			if(!int) continue
			while(int){
				let pos = i<<5|(31-clz32(int))
				int &= ~(1 << (pos&31))
				const b = this[pos]
				const {texture} = b==65535 ? this.tileData.get(pos) : BlockIDs[b]
				const x = (pos&63), y = (63-(pos>>6))
				this.ctx.clearRect(x, y, 1, 1)
				this.ctx.drawImage(texture.canvas, texture.x, texture.y + (world.tick % floor(texture.h / texture.w)) * texture.w, texture.w, texture.w, x, y, 1, 1)
			}
		}
	}
}

Classes[1] = Chunk

setTimeout(() => {
	if(canvasPool.length > 10) canvasPool.length = 0
}, 10e3)