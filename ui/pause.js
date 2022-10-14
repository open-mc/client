import { finished } from "../lib/connectme.js";
import { getslot, render_slot, setslot } from "../me.js";
import { sounds } from "./sounds.js";
import { bindInput, bindThumb, btns, dirtDcreenMessage, hideUI, showUI } from "./ui.js";

feedbackui.finish = () => {
	fbText.clear()
	fbText.firstChild.removeAttribute('disabled')
	fbSend.classList.add('disabled')
}
unpause.onclick = () => {
	sounds.click()
	hideUI()
}
quit.onclick = () => {
	sounds.click()
	finished()
	ws.onclose = () => {}
	dirtDcreenMessage('You disconnected', 0x0f, btns[0])
}

feedback.onclick = () => {
	sounds.click()
	return open('https://discord.com/invite/NUUwFNUHkf')
	showUI('feedbackui')
}
options.onclick = () => {
	sounds.click()
	showUI('optionsui')
}
fbBack.onclick = ok.onclick = optBack.onclick = () => {
	sounds.click()
	showUI('pauseui')
}
bindInput(fbText, {txt:/[^]*/y})
fbText.oninput = () => {
	if(fbText.firstChild.value){
		fbSend.classList.remove('disabled')
	}else fbSend.classList.add('disabled')
}

fbBug.onclick = () => {
	if(fbBug.classList.contains('disabled'))return
	sounds.click()
	fbBug.classList.add('disabled')
	fbImp.classList.remove('disabled')
}

fbImp.onclick = () => {
	if(fbImp.classList.contains('disabled'))return
	sounds.click()
	fbBug.classList.remove('disabled')
	fbImp.classList.add('disabled')
}
fbSend.onclick = async () => {
	const feedback = fbText.val()
	if(!feedback)return
	sounds.click()
	fbSend.classList.add('disabled')
	fbText.firstChild.setAttribute('disabled', '')
	//send
	try{
		//wait a some time, then throw an error 😈
		let timeToWait = 200
		while(Math.random() < 0.7)timeToWait += 200
		await new Promise(r => setTimeout(r,timeToWait))
		throw 1
	}catch(e){
		popupLabel.textContent = 'Failed to send feedback'
		fbSend.classList.remove('disabled')
		showUI('popup')
		return
	}
	fbSend.classList.remove('disabled')
	popupLabel.textContent = 'Feedback sent!'
	showUI('popup')
}

bindThumb(optZoom, a => {
	let v = Math.round(a * 5)
	optZoom.firstChild.textContent = 'Zoom: '+(cam.z = 2 ** (v-1))/2
	return localStorage.zoom = v / 5
}, +(localStorage.zoom ?? 0.4))
let scale = +(localStorage.scale ?? 1)
function renderScale(){
	optGui.textContent = 'GUI scale: ' + scale
	document.documentElement.style.fontSize = scale * 2 + 'px'
}
renderScale()
optGui.onclick = () => {
	sounds.click()
	scale *= 2
	if(scale == 8)scale = 0.5
	localStorage.scale = scale
	renderScale()
}

ui.onclick = function(e){
	const {slotid} = e.target
	if(e.target.nodeName == 'ITEM'){
		if(slotid !== undefined){
			const i = getslot(slotid)
			const d = me.dragging
			if(i && d && i.name == d.name && !i._savedata){
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
ui.oncontextmenu = function(e){
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
			}else if(me.dragging.name == i.name && !i._savedata && i.count < 64){
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
ui.onmousemove = function({clientX, clientY}){
	draggingNode.style.top = clientY + 'px'
	draggingNode.style.left = clientX + 'px'
}