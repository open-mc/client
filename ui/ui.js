import { reconnect } from "../lib/connectme.js"

export function dirtDcreenMessage(text, style = 15, buttons = {}){
	hideUI(false)
	document.exitPointerLock()
	dirtbg.style.display = 'block'
	dirtbgmsg.innerText = text
	dirtbgmsg.classList = `c${style&15} s${style>>4}`
	dirtbgbuttons.innerHTML=''
	for(const name in buttons){
		const btn = document.createElement('btn')
		btn.innerText = name
		btn.onclick = buttons[name]
		dirtbgbuttons.appendChild(btn)
	}
}
export function clearDirtScreenMessage(){
	dirtbg.style.display = 'none'
}
export const btns = [
	{ 'Reconnect': reconnect }
]

let uis = {}
export let currentUI = ''
await fetch('./ui/ui.html').then(a=>a.text()).then(a=>{
	ui.insertAdjacentHTML('afterbegin', a)
	for(const c of ui.children){
		if(!c.id)continue
		c.style.display = 'none'
		c.classes = c.getAttribute('classes') || ""
		uis[c.id] = c
	}
})
export async function hideUI(pl = true){
	if(pl)await chunks.requestPointerLock()
	ui.style.display = 'none'
	if(currentUI)uis[currentUI].style.display = 'none', (uis[currentUI].finish||Function.prototype)()
	currentUI = ''
}
export function showUI(id){
	if(dirtbg.style.display != 'none')return
	if(!uis[id])return
	document.exitPointerLock()
	if(currentUI)uis[currentUI].style.display = 'none', (uis[currentUI].finish||Function.prototype)()
	uis[id].style.display = ''
	ui.className = uis[id].classes
	ui.style.display = 'flex'
	currentUI = id
}

export function toggleUI(id){
	if(currentUI)hideUI()
	else showUI(id)
}

const selchange = new Set
document.onselectionchange = () => {
	for(const c of selchange){
		if(!c.parentElement)selchange.delete(c)
		else c.onselchange()
	}
}
const earr = [''], fnode = document.createElement('f')
function newnode(v, k, t){
	let n = v.children[v.i++]
	if(n){
		n.textContent = t
		n.className = k
		return n
	}
	n = fnode.cloneNode(true)
	n.className = k
	n.textContent = t
	v.append(n)
	return n
}
function clear(){
	this.firstChild.value = ''
	this.firstChild.os = this.firstChild.oe = 0
	this.lastChild.innerHTML = '<f class="__cursor">_</f>'
}
function value(a){if(a != undefined)this.firstChild.value=a,this.firstChild.onselchange();return this.firstChild.value}
export function bindInput(el, r){
	for(const k in r)if(r[k].flags!='y')r[k] = new RegExp(r[k].source, 'y')
	const t = document.createElement(el.getAttribute('type') == 'textarea' ? 'textarea' : 'input'), v = document.createElement('div')
	newnode(v, '__cursor', '_')
	t.os = 0
	t.oe = 0
	v.vi = 0
	el.clear = clear
	el.val = value
	el.focus = () => t.focus()
	el.blur = () => t.blur()
	for(const k of el.getAttributeNames()){
		if(k == 'id')continue
		t.setAttribute(k, el.getAttribute(k))
		el.removeAttribute(k)
	}
	t.placeholder = el.textContent
	el.innerHTML = ''
	el.append(t, v)
	t.onscroll = () => v.scrollTo(t.scrollLeft, t.scrollTop)
	t.onkeydown = e=>{if(el.key)el.key(e.key,e.shiftKey)}
	t.onselchange = t.oninput = () => {
		let s = t.selectionStart, e = t.selectionEnd
		if(s == t.os && e == t.oe)return
		t.os = s; t.oe = e
		const {value} = t
		let i = 0
		v.i = 0
		const cur = s == e ? s : -1
		while(i < value.length){
			let k, length = 0
			for(k in r){
				const reg = r[k]
				reg.lastIndex = i
				;[{length}] = value.match(reg) || earr
				if(length)break
			}
			if(!length)length = 1, k = '__invalid'
			if(cur >= i && cur < i + length){
				if(i != cur)newnode(v, k, value.slice(i, cur))
				newnode(v, '__cursor', '_')
				newnode(v, k, value.slice(cur, i += length))
			}else newnode(v, k, value.slice(i, i += length))
		}
		if(i == cur)newnode(v, '__cursor', '_')
		let c; while(c = v.children[v.i])c.remove()
	}
	selchange.add(t)
}
let thumbx = -1, curtrack = null
function pointermove(e){
		if(curtrack){
			curtrack.value = Math.fclamp((e.clientX - curtrack.offsetLeft - thumbx) / (curtrack.offsetWidth - curtrack.lastChild.offsetWidth))
			let v = +curtrack.change(curtrack.value)
			curtrack.lastChild.style.setProperty('--value', v == v ? v : curtrack.value)
		}
}
addEventListener('pointermove', pointermove)
addEventListener('pointerup', () => {
	if(curtrack)curtrack.lastChild.classList.remove('highlighted')
	curtrack = null
	thumbx = -1
})
export function bindThumb(el, change, value = 0){
	let txt = document.createElement('span')
	txt.style = 'z-index:1;position:relative;pointer-events:none'
	for(const c of el.childNodes)txt.append(c)
	let thumb = document.createElement('btn')
	thumb.className = 'thumb'
	el.append(txt)
	el.append(thumb)
	el.change = change
	value = change(value)
	el.value = value
	thumb.style.setProperty('--value', value)
	el.onpointerdown = e => (curtrack = el, thumb.classList.add('highlighted'), pointermove(e))
	el.style.position = 'relative'
	
}