import { keyMsg, win } from './iframe.js'
import { pause } from '../uis/pauseui.js'
import { ui, NONE, ptrFail, ptrSuccess } from './ui.js'

onkeydown = e => {
	if(document.activeElement != document.body && e.key != 'Escape') return
	e.preventDefault()
	if(e.repeat) return
	if(cbs[e.key]){for(const f of cbs[e.key])f(); return}
	if(e.key == 'Escape') return
	if(win) keyMsg(e.keyCode)
}
onkeyup = e => {
	if(document.activeElement != document.body && e.key != 'Escape') return
	else if(e.key == 'Escape'){
		if(ignoreEsc){ignoreEsc = false; return}
		if(ui && ui.esc) ui.esc()
		return
	}
	if(cbs[e.key]) return
	if(win) keyMsg(~e.keyCode)
	e.preventDefault()
}
document.onmousedown = e => void(win && (!ui || (ui instanceof Comment)) && keyMsg(e.button))
document.onmouseup = e => void(win && keyMsg(~e.button))

let mtarget = null
document.onmousemove = ({movementX, movementY, clientX, clientY, target}) => {
	if(mtarget) mtarget.classList.remove('hover')
	while(target && target.nodeName!='BTN' && target.nodeName!='INPUT' && !target.classList.contains('selectable')) target=target.parentElement
	;(mtarget=target)?.classList.add('hover')
	if(!win) return
	if(ui === NONE){
		const v = ui.rowI!=undefined&&ui.rows[ui.rowI]
		if(v){
			v.classList.remove('hover')
			ui.rowI = undefined
			const n = v.columnI!=undefined&&v.columns[v.columnI]
			if(n) n.classList.remove('hover'), v.columnI = undefined
		}
		win.postMessage([clientX, clientY], '*')
		return
	}else if(ui) return
	const movementScale = globalThis.netscape ? devicePixelRatio : /Opera|OPR\//.test(navigator.userAgent) ? 1/devicePixelRatio : 1
	win.postMessage([movementX * movementScale, -movementY * movementScale], '*')
}

document.onwheel = ({deltaY}) => {
	if(!win) return
	const movementScale = devicePixelRatio ** (globalThis.netscape ? 1 : /Opera|OPR\//.test(navigator.userAgent) ? -1 : 0)
	win.postMessage([deltaY * movementScale], '*')
}

let gamepadButtons = new Set, odxs = [0,0], odys = [0,0], dxs = [0,0], dys = [0,0]
let wasShowingUI = true
requestAnimationFrame(function checkInputs(){
	requestAnimationFrame(checkInputs)
	dxs.fill(0), dys.fill(0)
	if (navigator.getGamepads) for(const d of navigator.getGamepads()){
		if(!d) continue
		if(d.mapping != 'standard'){
			let i = 320
			for(const b of d.buttons){
				if(b.pressed || b == 1){
					if(!gamepadButtons.has(i)){
						gamepadButtons.add(i); keyMsg(i)
						if(i===320 && ui && ui.esc) ui.esc()
						else if(i===320) document.exitPointerLock()
					}
				}else if(gamepadButtons.has(i))
					gamepadButtons.delete(i), keyMsg(~i)
				i++
			}
			continue
		}
		let i = 256
		for(const b of d.buttons){
			if(b.pressed || b == 1){
				if(!gamepadButtons.has(i)){
					gamepadButtons.add(i), keyMsg(i)
					a: if(i===256){
						if(!ui || ui.rowI==undefined) break a
						const v = ui.rows[ui.rowI]
						if(v.columnI==undefined) break a
						const e = v.columns[v.columnI]
						if(!e || !e.click) break a
						e.click()
					}else if(i === 257 && ui && ui.esc && ui !== NONE) ui.esc()
				}
			}else if(gamepadButtons.has(i))
				gamepadButtons.delete(i), keyMsg(~i)
			i++
		}
		dxs[0] += d.axes[0], dys[0] -= d.axes[1], dxs[1] += d.axes[2], dys[1] -= d.axes[3]
	}
	// Normalize to min(|vec|, 1) then send
	const showingUI = ui && !(ui instanceof Comment)
	for(let i = 0; i < 2; i++){
		let d = dxs[i]*dxs[i]+dys[i]*dys[i]
		if(d > 1) d = Math.sqrt(d), dxs[i] /= d, dys[i] /= d
		if(!wasShowingUI){
			if(showingUI) keyMsg([i, 0, 0])
			else if(dxs[i] != odxs[i] || dys[i] != odys[i])
				keyMsg([i, dxs[i], dys[i]])
		}else if(!showingUI) keyMsg([i, dxs[i], dys[i]])
	}
	wasShowingUI = showingUI
	a: if(showingUI){
		const X = Math.abs(odxs[0])<0.4?dxs[0]>=0.4?1:dxs[0]<=-0.4?-1:0:0
		const Y = Math.abs(odys[0])<0.4?dys[0]>=0.4?1:dys[0]<=-0.4?-1:0:0
		if(!X&&!Y) break a
		if(mtarget) mtarget.classList.remove('hover'), mtarget = null
		ui.rows ??= ui.querySelectorAll('row:not(row row), :not(row) > btn:not(.disabled)')
		if(!ui.rows.length) break a
		if(ui.rowI == undefined)
			ui.rows[ui.rowI = Y>0?ui.rows.length-1:0].classList.add('hover')
		else if(Y){
			const s = ui.rows[ui.rowI]
			s.classList.remove('hover')
			if(s.columnI!=undefined) s.columns[s.columnI].classList.remove('hover'),s.columnI=undefined
			ui.rowI = (ui.rowI - Y + ui.rows.length) % ui.rows.length
			ui.rows[ui.rowI].classList.add('hover')
		}
		const s = ui.rows[ui.rowI]
		s.columns ??= s.nodeName === 'BTN' ? [s] : s.querySelectorAll('img,btn:not(.disabled),input,.selectable')
		if(!s.columns.length) break a
		if(s.columnI == undefined)
			s.columns[s.columnI = X<0?s.columns.length-1:0].classList.add('hover')
		else if(X){
			s.columns[s.columnI].classList.remove('hover')
			s.columnI = (s.columnI + X + s.columns.length) % s.columns.length
			s.columns[s.columnI].classList.add('hover')
		}
	}
	a: if(showingUI){
		const dx = dxs[1]
		if(ui.rowI == undefined) break a
		const s = ui.rows[ui.rowI]
		if(s.columnI == undefined) break a
		const n = s.columns[s.columnI]
		if(n.parentElement?.nodeName != 'BTN') break a
		const track = n.parentElement
		track.value = Math.max(0, Math.min(1, track.value + dx/50))
		const {0:t,1:v} = track.change(track.value)
		n.style.setProperty('--value', v)
		track.firstChild.textContent = t
	}
	void([odxs, odys, dxs, dys] = [dxs, dys, odxs, odys])
})

const cbs = {}
export function key(key, handler){
	const keyname = key.toLowerCase()
	if(!cbs[keyname])cbs[keyname] = [handler]
	cbs[keyname].push(handler)
}

// Don't prompt if live server or local server
window.onbeforeunload = () => (location.host != '127.0.0.1' && location.host != 'localhost' && ws &&
	![].find.call(document.body.childNodes, a =>
		a instanceof Comment && a.data.trim() == 'Code injected by live-server')) || undefined
HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || Function.prototype //Safari fullscreen is broken
let wasFullscreen = false
let ignoreEsc = false
document.onpointerlockerror = document.onpointerlockchange = function(e){
	if(e.type == 'error' || e.type == 'pointerlockerror') ptrFail()//, keyMsg(true)
	else if(e.type == 'pointerlockchange' && document.pointerLockElement){
		ptrSuccess()
		keyMsg(false)
		//if(wasFullscreen)document.documentElement.requestFullscreen()
	}else{
		//keyMsg(true)
		wasFullscreen = !!(!ui && document.fullscreenElement)
		if(wasFullscreen)document.exitFullscreen ? document.exitFullscreen().catch(Function.prototype) : document.webkitExitFullscreen()
		if(!ui)pause(), ignoreEsc = true
	}
}