import { Blocks, Entities } from "./lib/definitions.js";
import { TEX_SIZE } from "./textures.js";
globalThis.map = new Map()
globalThis.meid = -1
globalThis.me = Entities.player({x:0,y:0,_id:-1,dx:0,dy:0,f:0})
globalThis.r = 0
globalThis.dragging = null
globalThis.cam = {x: 0, y: 0, z: 2}
globalThis.running = false
export function setblock(x, y, b){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	if(!ch)return
	const lx = x & 63
	const ly = y & 63
	ch.tiles[lx + (ly << 6)] = b
	ch.ctx.clearRect(lx * TEX_SIZE, (63 - ly) * TEX_SIZE, TEX_SIZE, TEX_SIZE)
	if(b.texture)ch.ctx.drawImage(b.texture, lx * TEX_SIZE, (63 - ly) * TEX_SIZE)
}
export function getblock(x, y){
	const k = (x>>>6)+(y>>>6)*67108864
	const ch = map.get(k)
	return ch ? ch.tiles[(x & 63) + ((y & 63) << 6)] : Blocks.air()
}
let selected = 0
export const getselected = () => selected
export function setselected(_id){
	const id = (_id % 9 + 9) % 9
	slot.style.left = id * 40 - 2 + 'px'
	selected = id
}

let item, s
const renderitem = (node) => {
	node.style.background = item && item.texture ? `url(${item.texture.src}) top/16rem` : ''
	if(item)node.setAttribute('count', item.count == 1 ? '' : item.count), node.style.color = item.count < 0 ? 'red' : ''
	else node.removeAttribute('count')
	node.slotid = s
}
export function render_slot(id){
	s = id; item = getslot(id)
	if(id < 9){
		renderitem(hotbar.children[id])
		renderitem(inventory.children[28 + id])
	}else if(id == 41)renderitem(draggingNode)
	else if(id < 36){
		renderitem(inventory.children[id - 9])
	}
}
export function setslot(id, a){
	if(id < 36)me.inv[id] = a
	else if(id == 41)dragging = a
	render_slot(id)
}
export function getslot(id){
	if(id < 36)return me.inv[id]
	else if(id == 41)return dragging
}