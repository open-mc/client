import { connection, finished, reconnect } from "./connectme.js"
import { render_slot, setblock } from "../me.js"
import { resetPointer } from "../ui/pointer.js"
import { Chunk } from "./chunk.js"
import { BlockIDs, EntityIDs } from "./definitions.js"
import { dirtDcreenMessage, clearDirtScreenMessage, btns } from "../ui/ui.js"
import { queue } from "../ui/music.js"
const onerror = function(code, str){
	finished()
	ws.onclose = () => {}
	dirtDcreenMessage(str.slice(2), parseInt(str.slice(0,2), 16), btns[~code])
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
		x: 0, y: 0, r: 0,
		world: 'overworld',
		selected: 0,
		dragging: null,
		...data
	})
	entities.add(me)
	cam.x = me.x
	cam.y = me.y
	resetPointer()
	running = true
	clearDirtScreenMessage()
	showUI('pauseui')
	for(let i = 0; i < 36; i++)render_slot(i)
	queue(me.world)
}
helloPacket.type = {x:Double,y:Double,w:String,...EntityIDs[0]._._savedata}

function chunkPacket(data){
	const chunk = new Chunk(data)
	const k = (chunk.x&67108863)+(chunk.y&67108863)*67108864
	if(map.has(k))trashtrap.add(k)
	map.set(k, chunk)
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
	}
}
chunkDeletePacket.type = [Int]

function blockSetPacket({x, y, id}){
	setblock(x, y, BlockIDs[id]())
}
blockSetPacket.type = {x: Int, y: Int, id: Short}

function rubberPosPacket(a){
	Object.assign(me, a)
}
rubberPosPacket.type = {r: Byte, x: Double, y: Double, dx: Float, dy: Float, f: Float}

export const codes = Object.assign(new Array(256), {
	1: helloPacket,
	4: rubberPosPacket,
	8: blockSetPacket,
	16: chunkPacket,
	17: chunkDeletePacket
})
export const types = codes.map(a => a.type)