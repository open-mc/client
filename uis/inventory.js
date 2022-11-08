import { Div, hideUI, showUI, ui, UI } from "../ui/ui.js"
import { getslot, render_slot, setslot } from "../me.js"

export const inventoryui = UI('inv',
	Div('inv')
)

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
				setslot(41,  Items[i.name](i.count - (i.count = Math.floor(i.count / 2))))
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
				if(me.dragging.count > 1){
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
}

export function showInventory(){
	if(ui == inventoryui)return hideUI()
	showUI(inventoryui)
	inventoryui.append(inventory)
}