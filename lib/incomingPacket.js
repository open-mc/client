import { finished } from "./connectme.js"
import { render_slot, setblock } from "../me.js"
import { resetPointer } from "../ui/pointer.js"
import { Chunk } from "./chunk.js"
import { BlockIDs, EntityIDs } from "./definitions.js"
import { hideUI } from "../ui/ui.js"
import { queue } from "../ui/sounds.js"
import { reconn } from "../uis/dirtscreen.js"
import { pause } from "../uis/pauseui.js"
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
	me = EntityIDs[0]({
		x: data.double(), y: data.double(), r: 0,
		world: data.string(),
		_id: data.int() + data.short() * 4294967296,
		selected: 0,
		dragging: null,
		dx: data.float(),
		dy: data.float(),
		f: data.float(),
		...data.read(EntityIDs[0]._.savedata)
	})
	entities.set(me._id, me)
	cam.x = me.x
	cam.y = me.y
	resetPointer()
	running = true
	hideUI()
	for(let i = 0; i < 36; i++)render_slot(i)
	queue(me.world)
}

function chunkPacket(data){
	const chunk = new Chunk(data)
	const k = (chunk.x&67108863)+(chunk.y&67108863)*67108864
	if(map.has(k))trashtrap.add(k)
	map.set(k, chunk)
	while(data.left){
		let e = EntityIDs[0]({x: data.double(), y: data.double(), _id: data.int() + data.short() * 4294967296, dx: data.float(), dy: data.float(), f: data.float()})
		data.read(e.savedata, e)
		entities.set(e._id, e)
	}
}
const trashtrap = new Set()
function chunkDeletePacket(data){
	for(let i = 0; i < data.length; i += 2){
		const cx = data[i], cy = data[i + 1]
		const k = (cx&67108863)+(cy&67108863)*67108864
		if(trashtrap.has(k)){trashtrap.delete(k);continue}
		const chunk = map.get(k)
		chunk.hide()
		map.delete(k)
		for(const e of chunk.entities){
			if(e.node)e.node.remove()
			entities.delete(e)
		}
	}
}
chunkDeletePacket.type = [Int]

function blockSetPacket({x, y, id}){
	setblock(x, y, BlockIDs[id]())
}
blockSetPacket.type = {x: Int, y: Int, id: Short}

function rubberPosPacket(a){
	let rubcam = (me.x - a.x) * (me.x - a.x) + (me.y - a.y) * (me.y - a.y) > 1024
	Object.assign(me, a)
	if(rubcam)cam.x = me.x, cam.y = me.y
}
rubberPosPacket.type = {r: Byte, x: Double, y: Double, w: String, dx: Float, dy: Float, f: Float}

export const codes = Object.assign(new Array(256), {
	1: helloPacket,
	4: rubberPosPacket,
	8: blockSetPacket,
	16: chunkPacket,
	17: chunkDeletePacket
})
export const types = codes.map(a => a.type)