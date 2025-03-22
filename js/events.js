import { ui, NONE } from './ui.js'

onkeydown = e => {
	if(document.activeElement != document.body && e.key != 'Escape') return
	e.preventDefault()
	if(e.repeat) return
	if(cbs[e.key]) for(const f of cbs[e.key]) f()
}
onkeyup = e => {
	if(document.activeElement != document.body && e.key != 'Escape') return
	else if(e.key == 'Escape'){
		if(ui && ui.esc) ui.esc()
		return
	}
	e.preventDefault()
}

let mtarget = null
document.onmousemove = ({target}) => {
	while(target && target.nodeName!='BTN' && target.nodeName!='INPUT' && !target.classList.contains('selectable')) target=target.parentElement
	if(target != mtarget) mtarget?.classList.remove('hover'),(mtarget=target)?.classList.add('hover')
	if(ui === NONE){
		const v = ui.rowI!=undefined&&ui.rows[ui.rowI]
		if(v){
			v.classList.remove('hover')
			ui.rowI = undefined
			const n = v.columnI!=undefined&&v.columns[v.columnI]
			if(n) n.classList.remove('hover'), v.columnI = undefined
		}
	}
}
let dx1 = 0
let odx = 0, ody = 0, dx = 0, dy = 0, opressed = false, opressed1 = false
export const onFrame = []
requestAnimationFrame(function checkInputs(){
	for(const f of onFrame) f()
	requestAnimationFrame(checkInputs)
	if(!navigator.getGamepads) return
	let pressed = false, pressed1 = false
	dx = dy = 0
	let dx2 = 0
	for(const d of navigator.getGamepads()){
		if(d?.mapping != 'standard') continue
		if(!opressed && (d.buttons[0]==1||d.buttons[0].pressed)) pressed = opressed = true
		else if(opressed && (d.buttons[0]==0||!d.buttons[0].pressed)) opressed = false
		if(!opressed1 && (d.buttons[1]==1||d.buttons[1].pressed)) pressed1 = opressed1 = true
		else if(opressed1 && (d.buttons[1]==0||!d.buttons[1].pressed)) opressed1 = false
		dx += d.axes[0], dy -= d.axes[1]; dx1 += d.axes[2]*.02; dx2 += d.axes[2]
	}
	let d = Math.hypot(dx, dy)
	if(d > 1) dx /= d, dy /= d
	a: if(pressed && ui && ui.rowI != undefined){
		const v = ui.rows[ui.rowI]
		if(v.columnI==undefined) break a
		const e = v.columns[v.columnI]
		e?.click?.()
	}else if(pressed1 && ui && ui.esc && ui !== NONE) ui.esc()
	const showingUI = ui && !(ui instanceof Comment)
	if(Math.abs(dx2) < .1) dx1 = 0
	a: if(showingUI){
		const X = Math.abs(odx)<0.4?dx>=0.4?1:dx<=-0.4?-1:0:0
		const Y = Math.abs(ody)<0.4?dy>=0.4?1:dy<=-0.4?-1:0:0
		if(!X&&!Y) break a
		if(mtarget) mtarget.classList.remove('hover'), mtarget = null
		ui.rows ??= ui.querySelectorAll('row:not(row row), :not(row) > btn:not(.disabled)')
		if(!ui.rows.length) break a
		if(ui.rowI == undefined){
			const r = ui.rows[ui.rowI = Y>0?ui.rows.length-1:0]
			if(r.classList.contains('controller-selectable')) r.classList.add('hover')
		}
		else if(Y){
			const s = ui.rows[ui.rowI]
			s.classList.remove('hover')
			if(s.columnI!=undefined) s.columns[s.columnI].classList.remove('hover'),s.columnI=undefined
			ui.rowI = (ui.rowI - Y + ui.rows.length) % ui.rows.length
			const r = ui.rows[ui.rowI]
			if(r.classList.contains('controller-selectable')) r.classList.add('hover')
		}
		const s = ui.rows[ui.rowI]
		s.columns ??= s.nodeName === 'BTN' ? [s] : s.querySelectorAll('btn:not(.disabled),input,.selectable,.controller-selectable')
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
		if(ui.rowI == undefined) break a
		const s = ui.rows[ui.rowI]
		if(s.columnI == undefined) break a
		const n = s.columns[s.columnI]
		if(n.parentElement?.nodeName != 'BTN') break a
		const track = n.parentElement
		const v = Math.max(0, Math.min(1, track.value + dx1))
		track.set(v)
		dx1 = v-track.value
	}
	odx = dx; dx = 0
	ody = dy; dy = 0
})

const cbs = {}
export function key(key, handler){
	const keyname = key.toLowerCase()
	if(!cbs[keyname]) cbs[keyname] = [handler]
	cbs[keyname].push(handler)
}

window.onbeforeunload = () => !(location.protocol != 'https:' || !ws)||void-0