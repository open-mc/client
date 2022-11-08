import { bind, ctrl, key } from "./ui/events.js";
import { setselected, getselected } from "./me.js";
import { ui, showUI, hideUI } from "./ui/ui.js";
import { showInventory } from "./uis/inventory.js";
import { pause } from "./uis/pauseui.js";

bind(['arrowright', 'd'], function(){
	me.dx = 5
})
bind(['arrowleft', 'a'], function(){
	me.dx = -5
})
bind(['arrowup', 'w'], function(){
	me.dy = 5
})
bind(['arrowdown', 's'], function(){
	me.dy = -5
})
function toggleF3(){
	f3.style.display = (f3.style.display == 'none' ? 'flex' : 'none')
}
function toggleGUI(){
	hotbar.style.display = (hotbar.style.display == 'none' ? 'flex' : 'none')
	if(hotbar.style.display == 'none')f3.style.display = 'none'
}
key('f3', toggleF3)
key('tab', toggleF3)
key('f1', toggleGUI)
ctrl('dypsfgl,[]-='.split(""), () => {})
key('123456789'.split(""), e => setselected(e.key - 1))
key('e', () => {showInventory()})
key('escape', () => {hideUI()}, true)
chunks.onwheel = e => {
	if(e.wheelDeltaY === (e.deltaY * -3) || e.deltaMode == 0){
	}else{
		if(e.deltaY > 0){
			setselected((getselected() + 1) % 9)
		}else{
			setselected((getselected() + 8) % 9)
		}
	}
}