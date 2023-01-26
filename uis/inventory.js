import { Div, hideUI, showUI, ui, UI } from "../ui/ui.js"
import { render } from "../lib/entity.js"
import { on } from "../lib/prototype.js"
export const inventoryui = UI('inv',
	Div('inv')
)
export const inventory = document.getElementById('inventory')
inventoryui.onclick = function(e){
	const {slotid} = e.target
	if(e.target.nodeName == 'ITEM'){
		if(slotid !== undefined){
			const i = getslot(slotid)
			const d = me.dragging
			if(i && d && i.name == d.name && !i.savedata){
				i.count += d.count
				if(i.count > 64)d.count = i.count - 64, i.count=64, render_slot(41)
				else d.count = 0, setslot(41, null)
				render_slot(slotid)
			}else{
				setslot(41, i)
				setslot(slotid, d)
			}
		}
		return
	}
}
inventoryui.oncontextmenu = function(e){
	const {slotid} = e.target
	if(e.target.nodeName == 'ITEM'){
		if(slotid !== undefined){
			const i = getslot(slotid)
			if(!me.dragging){
				if(!i)return
				setslot(41,  Items[i.name](i.count - (i.count >>= 1)))
				if(!i.count)setslot(slotid, null)
				else render_slot(slotid)
			}else if(!i){
				if(me.dragging.count==1){
					setslot(slotid, me.dragging)
					setslot(41, null)
				}else{
					me.dragging.count--
					render_slot(41)
					setslot(slotid, Items[me.dragging.name](1))
				}
			}else if(me.dragging.name == i.name && !i.savedata && i.count < 64){
				i.count++
				render_slot(slotid)
				if(me.dragging.count != 1){
					me.dragging.count--
					render_slot(41)
				}else setslot(41, null)
			}
		}
		return
	}
}
inventoryui.onmousemove = function({clientX, clientY}){
	draggingNode.style.top = clientY + 'px'
	draggingNode.style.left = clientX + 'px'
	if(puppet){
		const {bottom, left, width, height} = puppet.getBoundingClientRect()
		f = Math.atan2(clientX - left - width/2, ((bottom - height*me.head/me.height) - clientY))
	}
}
let puppet = null, f = 0
on('me', () => {
	if(puppet)puppet.remove()
	puppet = me.textures.cloneNode(true)
	inventory.append(puppet)
})
inventoryui.frame = () => {
	if(puppet){
		f += me.f; me.f = f - me.f
		render(me, puppet)
		me.f = f - me.f; f -= me.f
	}
}
export function showInventory(){
	if(ui == inventoryui)return hideUI()
	showUI(inventoryui)
	inventoryui.append(inventory)
}
let selected = 0
export const getselected = () => selected
export function setselected(_id){
	const id = (_id % 9 + 9) % 9
	slot.style.left = id * 20 - 1 + 'rem'
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
	else if(id == 41)me.dragging = a
	render_slot(id)
}
export function getslot(id){
	if(id < 36)return me.inv[id]
	else if(id == 41)return me.dragging
}