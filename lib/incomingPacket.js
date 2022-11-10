import { finished } from "./connectme.js"
import { setblock } from "../me.js"
import { Chunk } from "./chunk.js"
import { BlockIDs, EntityIDs } from "./definitions.js"
import { reconn } from "../uis/dirtscreen.js"
import { addEntity, removeEntity } from "./entity.js"
import { queue } from "../ui/sounds.js"
const onerror = function(_, str){
	finished()
	const code = parseInt(str.slice(0,2), 16)
	reconn(str.slice(2), code)
}

export const onstring = function(str){
	if(!str.length){
		onbeforeunload = () => {}
		for(;;)location=''
	}
	const style = parseInt(str.slice(0,2), 16)
	if(style == -1)return onerror(style, str.slice(2))
	if(style != style)return
	const box = chat.children[9] || document.createElement('div')
	box.textContent = str.slice(2)
	chat.insertAdjacentElement('afterbegin', box)
	box.classList = `c${style&15} s${style>>4}`
}

function helloPacket(data){
	meid = data.uint32() + data.uint16() * 4294967296
	queue(data.string())
}

function chunkPacket(data){
	const chunk = new Chunk(data)
	const k = (chunk.x&67108863)+(chunk.y&67108863)*67108864
	if(map.has(k))trashtrap.add(k)
	map.set(k, chunk)
	while(data.left){
		let e = EntityIDs[0]({x: data.double(), y: data.double(), _id: data.int() + data.short() * 4294967296, dx: data.float(), dy: data.float(), f: data.float()})
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
		for(const e of chunk.entities)removeEntity(e)
	}
}

function blockSetPacket(buf){
	setblock(buf.int(), buf.int(), BlockIDs[buf.short()]())
}

function rubberPosPacket(data){
	r = data.byte()
	let x = data.double(), y = data.double()
	let rubcam = (me.x - x) * (me.x - x) + (me.y - y) * (me.y - y) > 1024
	me.x = x, me.y = y
	data.read({w: String, dx: Float, dy: Float, f: Float}, me)
	if(rubcam)cam.x = me.x, cam.y = me.y
}

function entityPacket(buf){
	while(buf.left){
		let mv = buf.byte()
		if(!mv){removeEntity(entities.get(buf.uint32() + buf.short() * 4294967296));continue}
		let e
		if(mv & 128){
			e = EntityIDs[buf.short()]({_id: buf.uint32() + buf.short() * 4294967296})
		}else e = entities.get(buf.uint32() + buf.uint16() * 4294967296)
		if(mv & 1)e == me ? e.x = buf.double() : e.tx = buf.double()
		if(mv & 2)e == me ? e.y = buf.double() : e.ty = buf.double()
		if(mv & 4)e.dx = buf.float()
		if(mv & 8)e.dy = buf.float()
		if(mv & 16)e.f = buf.float()
		if(mv & 32)buf.read(e.savedata, e)
		if(mv & 128){addEntity(e)}
	}
}
export const codes = Object.assign(new Array(256), {
	1: helloPacket,
	4: rubberPosPacket,
	8: blockSetPacket,
	16: chunkPacket,
	17: chunkDeletePacket,
	20: entityPacket,
})