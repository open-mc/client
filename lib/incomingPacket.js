import { finished } from "./connectme.js"
import { setblock } from "../me.js"
import { Chunk } from "./chunk.js"
import { BlockIDs, EntityIDs } from "./definitions.js"
import { pendingConnection, reconn } from "../uis/dirtscreen.js"
import { addEntity, moveEntity, removeEntity } from "./entity.js"
import { queue } from "../ui/sounds.js"
const onerror = function(str){
	finished()
	const code = parseInt(str.slice(0,2), 16)
	reconn(str.slice(2), code)
}
const onpending = function(str){
	const code = parseInt(str.slice(0,2), 16)
	pendingConnection(str.slice(2), code)
}

export const onstring = function(str){
	if(!str.length){
		onbeforeunload = () => true
		for(;;)location=''
	}
	const style = parseInt(str.slice(0,2), 16)
	if(style == -1)return onerror(str.slice(2))
	else if(style == -2)return onpending(str.slice(2))
	if(style != style)return
	const box = chat.children[9] || document.createElement('div')
	box.textContent = str.slice(2)
	chat.insertAdjacentElement('afterbegin', box)
	box.classList = `c${style&15} s${style>>4}`
}

function rubberPacket(data){
	meid = data.uint32() + data.uint16() * 4294967296
	let e = entities.get(meid)
	if(me._id > -1 && me._id != meid){
		if(e){
			addEntity(e)
		}else me._id = -1
	}else if(me._id == -1 && e)addEntity(e)
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
		if(!mv){removeEntity(entities.get(id));continue}
		let e = entities.get(id)
		
		if(!e)
			if(mv & 128)mv |= 256, e = EntityIDs[buf.short()]({x:0,y:0,_id: id,dx:0,dy:0,f:0,chunk:null})
			else e = EntityIDs[0]({x:0,y:0,_id:id,dx:0,dy:0,f:0,chunk:null}) //ERROR
		else if(mv & 128)Object.setPrototypeOf(e, EntityIDs[buf.short()]._)
		if(mv & 1)if(Math.abs(e.x - (e.x = buf.double())) > 16 || e == me)e.ix = e.x
		if(mv & 2)if(Math.abs(e.y - (e.y = buf.double())) > 16 || e == me)e.iy = e.y
		if(mv & 4)e.state = buf.short()
		if(mv & 8)e.dx = buf.float()
		if(mv & 16)e.dy = buf.float()
		if(mv & 32)e.f = buf.float()
		if(mv & 64)buf.read(e.savedata, e)
		if(mv & 256)addEntity(e)
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