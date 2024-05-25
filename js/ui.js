import { options } from './save.js'

let defaultUI
export function setDefaultUI(fn){defaultUI = fn}

const Sound = src => {
	const arr = [new Audio]
	fetch(src).then(a => a.blob()).then(a => arr[0].src = URL.createObjectURL(a))
	return () => {
		let a = arr.length > 1 ? arr.pop() : arr[0].cloneNode(true)
		a.volume = Math.min(1, options.sound)
		a.onended = () => {
			a.onended = null
			if(arr.length<3)arr.push(a)
		}
		a.play().catch(a.onended)
	}
}
export const click = Sound('./img/click.mp3')
export const ping = Sound('./img/ping.mp3')

HTMLElement.prototype.attr = function(a, b){this.setAttribute(a, b); return this}

for(const n of [HTMLCollection, NodeList])Object.setPrototypeOf(n.prototype, Array.prototype)

export const NONE = new Comment()
NONE.esc = hideUI
document.body.append(NONE)

export let ptrSuccess = Function.prototype, ptrFail = Function.prototype
const ptrLockOpts = {unadjustedMovement: true}
export const ptrlock = () => new Promise((r, c) => {
	const fs = options.fsc ? document.documentElement.requestFullscreen({navigationUI: 'hide'}) : undefined
	if(fs instanceof Promise) fs.catch(e=>null).then(() => document.body.requestPointerLock?.(ptrLockOpts)?.catch(e=>null))
	else document.body.requestPointerLock?.(ptrLockOpts)?.catch(e=>null)
	ptrSuccess = r; ptrFail = c
})

export let ui = null
export async function hideUI(){
	if(!ui) return
	try{
		await ptrlock()
		ui.replaceWith(NONE)
		void (ui.finish||Function.prototype)()
		ui = null
	}catch(e){ defaultUI() }
}

export function showUI(a = null){
	if(a instanceof Element && document.fullscreenElement && (a.classList.contains('dirtbg') || !a.classList.contains('noshade'))) document.exitFullscreen()
	document.exitPointerLock?.()
	void (ui && ui.finish || Function.prototype)()
	void (ui || NONE).replaceWith(ui = a || NONE)
}

const selchange = new Set
document.onselectionchange = () => {
	for(const c of selchange){
		if(!c.parentElement)selchange.delete(c)
		else c.onselchange()
	}
}
const earr = [''], fnode = document.createElement('f')
function newnode(v, k, text){
	let n = v.children[v.i++]
	if(n){
		n.textContent = text
		n.className = k
		return n
	}
	n = fnode.cloneNode(true)
	n.className = k
	n.textContent = text
	v.append(n)
	return n
}
function clear(){
	this.firstChild.value = ''
	this.firstChild.os = this.firstChild.oe = 0
	this.lastChild.innerHTML = '<f class="__cursor">_</f>'
}
const {prototype: InputPrototype} = class extends HTMLElement{
	get value(){return this.t.value}
	set value(a){this.t.value = a;this.t.onselchange()}
	focus(){this.t.focus()}
	blur(){this.t.blur()}
	clear(){this.t.value='',this.t.os = this.t.oe = 0;this.v.innerHTML = '<f class="__cursor">_</f>'}
	set disabled(a){this.t.disabled = a}
	get disabled(){return this.t.disabled}
}
const {prototype: BtnPrototype} = class extends HTMLElement{
	set disabled(a){if(a)this.classList.add('disabled');else this.classList.remove('disabled')}
	get disabled(){return this.classList.contains('disabled')}
	get text(){return super.textContent}
	set text(a){super.textContent = a}
}
export const Input = (type, placeholder, tokenizers = {txt:/[^]*/y}) => {
	const el = document.createElement('in')
	for(const k in tokenizers)if(tokenizers[k].flags!='y')tokenizers[k] = new RegExp(tokenizers[k].source, 'y')
	const t = document.createElement(type == 'long' ? 'textarea' : 'input'), v = document.createElement('div')
	newnode(v, '__cursor', '_')
	t.autocomplete = 'off'; t.name = '\0'
	el.os = el.oe = 0
	el.t = t
	el.clear = clear
	t.placeholder = placeholder
	el.innerHTML = ''
	el.v = v
	el.append(t, v)
	Object.setPrototypeOf(el, InputPrototype)
	t.onscroll = () => v.scrollTo(t.scrollLeft, t.scrollTop)
	t.onkeydown = e=>{if(el.key)el.key(e.key,e.shiftKey)}
	t.onselchange = t.oninput = () => {
		let s = t.selectionStart, e = t.selectionEnd
		if(s == t.os && e == t.oe) return
		t.os = s; t.oe = e
		const {value} = t
		let i = 0
		v.i = 0
		const cur = s == e ? s : -1
		while(i < value.length){
			let k, length = 0
			for(k in tokenizers){
				const reg = tokenizers[k]
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
	return el
}
let thumbx = -1, curtrack = null
function pointermove(e){
	if(curtrack){
		curtrack.value = Math.max(0, Math.min(1, (e.clientX - curtrack.offsetLeft - thumbx) / (curtrack.offsetWidth - curtrack.lastChild.offsetWidth)))
		const {0:t,1:v} = curtrack.change(curtrack.value)
		curtrack.lastChild.style.setProperty('--value', v)
		curtrack.firstChild.textContent = t
	}
}
addEventListener('pointermove', pointermove)
addEventListener('pointerup', () => {
	if(curtrack)curtrack.lastChild.classList.remove('highlighted')
	curtrack = null
	thumbx = -1
})
function _scale(c, change){
	let el = document.createElement('btn')
	el.className = c
	el.style.position = 'relative'
	let txt = document.createElement('span')
	txt.style = 'z-index:1;position:relative;pointer-events:none'
	let thumb = document.createElement('btn')
	thumb.className = 'thumb'
	el.append(txt)
	el.append(thumb)
	el.change = change
	let [t, value] = change()
	txt.textContent = t
	el.value = value
	thumb.style.setProperty('--value', value)
	el.onpointerdown = e => (curtrack = el, thumb.classList.add('highlighted'), pointermove(e))
	el.style.position = 'relative'
	return el
}
export const ScaleSmall = _scale.bind(undefined, 'disabled small scale')
export const Scale = _scale.bind(undefined, 'disabled scale')

export const Btn = (text, onclick, classes = '') => {
	let btn = document.createElement('btn')
	if(classes)btn.className = classes
	btn.append(text)
	btn.onclick = e => {
		if(btn.disabled) return
		click()
		e.stopPropagation()
		onclick(btn)
	}
	Object.setPrototypeOf(btn, BtnPrototype)
	return btn
}
export const Row = (...a) => {
	let row = document.createElement('row')
	row.append(...a)
	return row
}
export const Label = (txt) => {
	let label = document.createElement('span')
	label.append(txt)
	return label
}

export const UI = (cl, ...els) => {
	let ui = document.createElement('div')
	ui.id = 'ui'
	ui.className = cl
	for(const el of els)ui.append(el)
	ui.show = showUI.bind(undefined, ui)
	return ui
}

export const Spacer = (a) => {
	const space = document.createElement('div')
	space.style.flexBasis = a + 'rem'
	return space
}
Spacer.grow = (a=1) => {
	const space = document.createElement('div')
	space.style.flexGrow = a
	return space
}

export const Div = (id, ...a) => {
	const div = document.createElement('div')
	div.id = id
	for(const el of a)div.append(el)
	return div
}

export const Img = (src) => {
	const img = document.createElement('img')
	img.src = src
	return img
}

export const Column = (...a) => {
	const el = document.createElement('column')
	for(const c of a)el.append(c)
	return el
}
if(devicePixelRatio == 1){
	document.body.style.left = '0.4px'
	onresize = () => {
		document.body.style.width = (innerWidth+1&-2)+'px'
		document.body.style.height = (innerHeight+1&-2)+'px'
	}
	onresize()
}

const hexToInt = a => a>47&&a<58?a-48:a>64&&a<71?a-55:a>96&&a<103?a-87:a==43?131072:65536
export const styleToHtml = (str, node) => {
	let i = 0, res = ''
	node.textContent = ''
	node.classList.add('textc')
	let style = 15
	while(i < str.length){
		let c = str.charCodeAt(i++)
		if(c != 92){ res += str[i-1]; continue }
		c = str.charCodeAt(i++)
		if(c > 96) c -= 32
		if(c == 92){ res += '\\'; continue }
		if(c == 78){ res += '\n'; continue }
		if(c == 84){ res += '\t'; continue }
		if(c == 88 || c == 85){
			c = (parseInt(str.slice(i,i+=(c==85?4:2)),16)+1||65534)-1
			if(c == 127) c = 0x2421
			if(c < 32) c |= 0x2400
			res += String.fromCharCode(c); continue
		}
		const s = style; style = hexToInt(c)<<4|hexToInt(str.charCodeAt(i++))
		if(style&131072) style = style&-131088|s&15
		if(style&2097152) style = style&-2097393|s&240
		if(style>65535) continue
		if(res){
			const e = document.createElement('span')
			e.textContent = res; res = ''
			e.className = `s${s >> 4} c${s & 15}`
			node.append(e)
		}
	}
	if(res){
		console.log(res, style)
		const e = document.createElement('span')
		e.textContent = res; res = ''
		e.className = `s${style >> 4} c${style & 15}`
		node.append(e)
	}
}