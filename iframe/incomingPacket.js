import { setblock, addEntity, moveEntity, removeEntity } from "./world.js"
import { Chunk } from "./chunk.js"
import { queue } from "./sounds.js"

function rubberPacket(data){
	meid = data.uint32() + data.uint16() * 4294967296
	let e = entities.get(meid)
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
function chunkPacket(data){
	const chunk = new Chunk(data)
	const k = (chunk.x&67108863)+(chunk.y&67108863)*67108864
	if(map.has(k))trashtrap.add(k)
	map.set(k, chunk)
	while(data.left){
		let e = EntityIDs[0]({
			x: data.double(), y: data.double(),
			_id: data.int() + data.short() * 4294967296,
			state: data.short(),
			dx: data.float(), dy: data.float(),
			f: data.float(), chunk
		})
		data.read(e.savedata, e)
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
	setblock(buf.int(), buf.int(), BlockIDs[buf.short()]())
}
function entityPacket(buf){
	while(buf.left){
		let mv = buf.byte()
		const id = buf.uint32() + buf.uint16() * 4294967296
		let e = entities.get(id)
		if(!mv){if(e)removeEntity(e);continue}
		if(!e){
			if(mv & 128)mv |= 256, e = EntityIDs[buf.short()]({x:0,y:0,_id: id,dx:0,dy:0,f:0,chunk:null})
			else e = EntityIDs[0]({x:0,y:0,_id:id,dx:0,dy:0,f:0,chunk:null}) //PANIC safe-guard
		}else if(mv & 128)Object.setPrototypeOf(e, EntityIDs[buf.short()]._)
		if(mv & 1)if(abs(e.x - (e.x = buf.double())) > 16 || e == me)e.ix = e.x
		if(mv & 2)if(abs(e.y - (e.y = buf.double())) > 16 || e == me)e.iy = e.y
		if(mv & 4)e.state = buf.short()
		if(mv & 8)e.dx = buf.float()
		if(mv & 16)e.dy = buf.float()
		if(mv & 32)e.f = buf.float()
		if(mv & 64)buf.read(e.savedata, e)
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