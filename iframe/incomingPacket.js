import { setblock, gridEventMap, gridEvents } from "world"
import { Chunk } from "./chunk.js"
import { queue } from "./sounds.js"
import { moveEntity } from "./entity.js"
import { EntityIDs, BlockIDs } from 'definitions'
import { getblock } from "./world.js"
import { foundMe } from "./defs.js"

function rubberPacket(data){
	meid = data.uint32() + data.uint16() * 4294967296
	const e = entityMap.get(meid)
	if(e && (e != me)) foundMe(e)
	r = data.byte()
	TPS = data.float()
}
function dimPacket(data){
	queue(world = data.string())
	gx = data.float()
	gy = data.float()
	ticks = data.double()
}
function clockPacket(data){
	ticks = data.double()
}
function chunkPacket(buf){
	const chunk = new Chunk(buf)
	const k = (chunk.x&67108863)+(chunk.y&67108863)*67108864
	const {ref} = map.get(k) || chunk
	chunk.ref = ref + 1
	map.set(k, chunk)
	while(buf.left){
		let e = EntityIDs[0]()
		e.x = buf.double(); e.y = buf.double()
		e.netId = buf.uint32() + buf.short() * 4294967296
		e.name = buf.string(); e.state = buf.short()
		e.dx = buf.float(); e.dy = buf.float()
		e.f = buf.float(); e.age = buf.double()
		e.chunk = chunk
		buf.read(e.savedatahistory[buf.flint()] || e.savedata, e)
		e.place()
		chunk.entities.add(e)
	}
}
function chunkDeletePacket(data){
	while(data.left){
		const cx = data.int(), cy = data.int()
		const k = (cx&67108863)+(cy&67108863)*67108864
		const chunk = map.get(k)
		if(!--chunk.ref){
			chunk.hide()
			map.delete(k)
		}
	}
}
function blockSetPacket(buf){
	while(buf.left){
		const type = buf.byte()
		if(type == 255){
			const type2 = buf.byte()
			if(type2 == 255){
				gridEventMap.delete(buf.uint32())
				continue
			}else if(type2 > 0){
				const x = buf.int(), y = buf.int()
				const id = buf.uint32()
				if(!gridEvents[type2]) continue
				const v = gridEvents[type2](buf, x, y)
				if(v){
					v.x = x; v.y = y; v.i = id
					gridEventMap.set(id, v)
				}
				continue
			}
		}
		if(type > 0){
			const x = buf.int(), y = buf.int()
			const bl = getblock(x, y)
			if(type in bl)bl[type](buf, x, y)
		}else{
			const x = buf.int(), y = buf.int()
			const id = buf.short()
			const block = BlockIDs[id]()
			setblock(x, y, block)
			if(block.savedata) buf.read(block.savedata, block)
		}
	}
}
function entityPacket(buf){
	while(buf.left){
		let mv = buf.byte()
		const id = buf.uint32() + buf.uint16() * 4294967296
		let e = entityMap.get(id)
		if(!mv){e.remove();continue}
		if(!e){
			if(mv & 64){
				mv |= 256
				e = EntityIDs[buf.short()]()
				e.netId = id
				e.age = buf.double()
				buf.read(e.savedata, e)
			}else throw 'Not supposed to happen!'
		}else if(mv & 64)Object.setPrototypeOf(e, EntityIDs[buf.short()].prototype), e.age = buf.double(), buf.read(e.savedata, e)
		if(mv & 1)if(abs(e.x - (e.x = buf.double())) > 16 || e == me)e.ix = e.x
		if(mv & 2)if(abs(e.y - (e.y = buf.double())) > 16 || e == me)e.iy = e.y
		if(mv & 4)e.dx = buf.float(), e.dy = buf.float()
		if(mv & 8)e.f = buf.float(), e.state = buf.short()
		if(mv & 16)e.name = buf.string()
		if(mv & 32){
			let id
			while(id = buf.byte())
				e[id](buf)
		}
		if(mv & 256) e.place()
		moveEntity(e)
	}
}
export const codes = Object.assign(new Array(256), {
	1: rubberPacket,
	2: dimPacket,
	3: clockPacket,
	8: blockSetPacket,
	16: chunkPacket,
	17: chunkDeletePacket,
	20: entityPacket,
})

export const onpacket = (c, cb) => codes[c] = cb