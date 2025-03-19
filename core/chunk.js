import { BlockIDs, EntityIDs, Classes } from 'definitions'
import { _add, _addDark } from './lighting.js'
import { map } from 'world'

const texturePool = []
const chunkUVData = new Int32Array(4096+64)
let awaitingIds = []
let awI = 0
export class Chunk extends Uint16Array{
	constructor(buf){
		super(4096)
		this.updateBounds = 258111 // Packed u6,u6,u6,u6
		this.light = new Uint8Array(4096)
		this.tileData = new Map()
		this.x = buf.int()&0x3ffffff
		this.y = buf.int()&0x3ffffff
		this.up = this.left = this.right = this.down = null
		this.lightI = -2
		this.ticks = new Map()
		this.entities = new Set()
		this.ctx = null
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
			if(block.light>>4&15) _add(this, j)
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
		if(this.av.push(this.layer) == 1) texturePool.push({ctx: this.ctx, av: this.av, added: Date.now()})
		this.ctx = null
		this.rerenders.length = 0
	}
	draw(){
		if(this.ctx) return
		if(texturePool.length){
			void ({av: this.av, ctx: this.ctx} = texturePool[texturePool.length-1])
			this.layer = this.av.pop()
			if(!this.av.length) texturePool.pop()
		}else{
			const layers = max(4, min(Texture.MAX_LAYERS, map.size>>3))
			this.ctx = Texture(64, 65, layers, 0, Formats.R32)
			this.av = []
			this.layer = 0
			if(layers > 1){
				for(let i=1;i<layers;i++) this.av.push(i)
				texturePool.push({ctx: this.ctx, av: this.av, added: Date.now()})
			}
		}
		for(let i = 0; i < 4096; i++){
			const b = this[i]
			const {texture, render} = b==65535 ? this.tileData.get(i) : BlockIDs[b]
			if(render) this.rerenders.push(i)
			chunkUVData[i] = texture<<8|this.light[i]
		}
		for(let i=0;i<4;i++){
			const tl = this.biomes[i<<1], tr = this.biomes[i+1<<1]
			const hl = this.biomes[i<<1|1], hr = this.biomes[i+1<<1|1]
			chunkUVData[4096+i] =
			chunkUVData[4096+i+4] =
			chunkUVData[4096+i+8] =
			chunkUVData[4096+i+12] = tl|tr<<8|tl<<16|tr<<24
			chunkUVData[4096+i+16] =
			chunkUVData[4096+i+20] =
			chunkUVData[4096+i+24] =
			chunkUVData[4096+i+28] = hl|hr<<8|hl<<16|hr<<24
		}
		this.ctx.pasteData(chunkUVData, 0, 0, this.layer, 64, 65, 1)
	}
	uploadData(b){
		const minX = b&63, maxX = (b>>6&63)+1, minY = b>>12&63, maxY = (b>>18)+1
		let j = 0
		for(let y = minY; y < maxY; y++) for(let x = minX; x < maxX; x++){
			const i = x|y<<6, b = this[i]
			const {texture} = b==65535 ? this.tileData.get(i) : BlockIDs[b]
			chunkUVData[j++] = texture<<8|this.light[i]
		}
		this.ctx.pasteData(new Int32Array(chunkUVData.buffer, 0, j), minX, minY, this.layer, maxX-minX, maxY-minY, 1)
	}
	updateDrawn(i, b, ob){
		if(b.flags&128){if(!ob.flags&128){
			const y = this.y<<6|i>>6
			if(((this.exposure[i&63]-y)|0)<=0) this.exposure[i&63] = y+1|0
		}}else if(ob.flags&128){
			let y = (this.y<<6|i>>6)+1|0
			let i2 = i, ch = this
			if(this.exposure[i&63]==y){
				while(true){
					if(i2<64){ const c = ch.down; if(!c){ i2=ch.y<<6; break }; ch=c; i2 += 4096 }
					const b = ch[i2-=64], {flags} = b==65535?ch.tileData.get(i2):BlockIDs[b]
					if(flags&128){ i2 = (ch.y<<6|i2>>6)+1|0; break }
				}
				this.exposure[i&63] = i2
			}
		}
		const {light:l2} = b, {light:l1} = ob
		if((l2&15)>(l1&15)||(l2>>4&15)<(l1>>4&15)||(l2>>8&15)<(l1>>8&15)) _addDark(this, i)
		if((l2&15)<(l1&15)||(l2>>4&15)>(l1>>4&15)||(l2>>8&15)>(l1>>8&15)) _add(this, i)
		if(!this.ctx) return
		const j = this.rerenders.indexOf(i), r = b.render != undefined
		if((j == -1) & r) this.rerenders.push(i)
		else if((j > -1) & !r) this.rerenders.splice(j, 1)
		const ub = this.updateBounds, x = i&63, y = i>>6
		const x0 = ub&63, x1 = ub>>6&63, y0 = ub>>12&63, y1 = ub>>18&63
		this.updateBounds = (x<x0?x:x0)|(x>x1?x:x1)<<6|(y<y0?y:y0)<<12|(y>y1?y:y1)<<18
	}
	redrawBlock(i, b){
		_addDark(this, i)
		_add(this, i)
		if(b.flags&128){
			const y = this.y<<6|i>>6
			if((this.exposure[i&63]-y)|0<=0) this.exposure[i&63] = y+1|0
		}else{
			let y = (this.y<<6|i>>6)+1|0
			let i2 = i, ch = this
			if(this.exposure[i&63]==y){
				while(true){
					if(i2<64){ const c = ch.down; if(!c){ i2=ch.y<<6; break }; ch=c; i2 += 4096 }
					const b = ch[i2-=64], {flags} = b==65535?ch.tileData.get(i2):BlockIDs[b]
					if(flags&128){ i2 = (ch.y<<6|i2>>6)+1|0; break }
				}
				this.exposure[i&63] = i2
			}
		}
		if(!this.ctx) return
		const j = this.rerenders.indexOf(i), r = b.render != undefined
		if((j == -1) & r) this.rerenders.push(i)
		else if((j > -1) & !r) this.rerenders.splice(j, 1)
		const ub = this.updateBounds, x = i&63, y = i>>6
		const x0 = ub&63, x1 = ub>>6&63, y0 = ub>>12&63, y1 = ub>>18&63
		this.updateBounds = (x<x0?x:x0)|(x>x1?x:x1)<<6|(y<y0?y:y0)<<12|(y>y1?y:y1)<<18
	}
}

Classes[1] = Chunk

setInterval(() => {
	const exp = Date.now()-30e3

	for(let i = 0; i < texturePool.length; i++){
		const o = texturePool[i]
		if(o.added > exp) break
		if(o.av.length < o.ctx.layers) continue
		o.ctx.delete()
		texturePool.splice(i--, 1)
	}
}, 10e3)
export function gotId(id){
	const e = awaitingIds[awI++]
	if(e) e.netId = id, e.place()
	if(awI == awaitingIds.length) awaitingIds.length = 0, awI = 0
	else if(awI > 15 && awI > (awaitingIds.length>>1)) awaitingIds = awaitingIds.slice(awI), awI = 0
}