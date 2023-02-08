import { setblock, addEntity, moveEntity, removeEntity, blockEvents, blockEventDefs, blockEventIfns, entityEvents } from "./world.js"
import { Chunk } from "./chunk.js"
import { queue } from "./sounds.js"

function rubberPacket(data){
	meid = data.uint32() + data.uint16() * 4294967296
	const e = entities.get(meid)
	if(e && (e != me)) addEntity(e)
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
	if(map.has(k))trashtrap.add(k)
	map.set(k, chunk)
	while(buf.left){
		let e = EntityIDs[0](buf.double(), buf.double())
		e._id = buf.uint32() + buf.short() * 4294967296
		e.name = buf.string(); e.state = buf.short()
		e.dx = buf.float(); e.dy = buf.float()
		e.f = buf.float(); e.age = buf.double()
		e.chunk = chunk
		buf.read(e.savedatahistory[buf.flint()] || e.savedata, e)
		addEntity(e)
		chunk.entities.add(e)
		if(e.appeared)e.appeared()
	}
}
const trashtrap = new Set()
function chunkDeletePacket(data){
	while(data.left){
		const cx = data.int(), cy = data.int()
		const k = (cx&67108863)+(cy&67108863)*67108864
		if(trashtrap.has(k)){trashtrap.delete(k);continue}
		const chunk = map.get(k)
		chunk.hide()
		map.delete(k)
		//for(const e of chunk.entities)removeEntity(e)
	}
}
function blockSetPacket(buf){
	while(buf.left){
		const type = buf.byte()
		if(type == 255) blockEvents.delete(buf.uint32())
		else if(type > 0){
			const x = buf.int(), y = buf.int()
			const id = buf.uint32()
			const v = blockEventIfns[type] ? blockEventIfns[type](x, y) : undefined
			if(blockEventDefs[type])
				blockEvents.set(id, [x, y, type+id*256, v])
		}else{
			const x = buf.int(), y = buf.int()
			const block = BlockIDs[buf.short()]()
			setblock(x, y, block)
			if(block.savedata) buf.read(block.savedata, block)
		}
	}
}
function entityPacket(buf){
	while(buf.left){
		let mv = buf.byte()
		if(!mv){
			const type = buf.byte()
			if(!type)removeEntity(entities.get(buf.uint32() + buf.uint16() * 4294967296))
			else if(type == 255)entityEvents.delete(buf.uint32())
			else{
				const e = entities.get(buf.uint32() + buf.uint16() * 4294967296)
				const id = buf.uint32()
				if(e)
					e.immevent(type),
					entityEvents.set(id, [e, type+id*256])
			}
			continue
		}
		const id = buf.uint32() + buf.uint16() * 4294967296
		let e = entities.get(id)
		if(!e){
			if(mv & 128)mv |= 256, e = EntityIDs[buf.short()](0,0),e._id=id,e.dx=e.dy=e.f=0,e.chunk=null
			else throw 'Not supposed to happen!'
		}else if(mv & 128)Object.setPrototypeOf(e, EntityIDs[buf.short()].prototype)
		if(mv & 1)if(abs(e.x - (e.x = buf.double())) > 16 || e == me)e.ix = e.x
		if(mv & 2)if(abs(e.y - (e.y = buf.double())) > 16 || e == me)e.iy = e.y
		if(mv & 4)e.name = buf.string()
		if(mv & 8)e.state = buf.short()
		if(mv & 16)e.dx = buf.float()
		if(mv & 32)e.dy = buf.float()
		if(mv & 64)e.f = buf.float()
		if(mv & 128)buf.read(e.savedata, e)
		if(mv & 256){
			addEntity(e)
			if(e.appeared)e.appeared()
		}
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

onpacket = (c, cb) => codes[c] = cb