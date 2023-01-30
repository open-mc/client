import { options } from "./save.js"

const arr = [new Audio('./img/click.mp3')]
export const click = () => {
	let a = arr.length > 1 ? arr.pop() : arr[0].cloneNode(true)
	a.volume = options.sound
	a.onended = () => {
		a.onended = null
		if(arr.length<3)arr.push(a)
	}
	a.play().catch(a.onended)
}

HTMLElement.prototype.attr = function(a, b){this.setAttribute(a, b); return this}

for(const n of [HTMLCollection, NodeList])Object.setPrototypeOf(n.prototype, Array.prototype)

const NONE = document.createComment('')
document.body.append(NONE)
export let ui = null
export async function hideUI(){
	if(!ui)return
	//chunks.requestPointerLock()
	await document.body.requestPointerLock()
	ui.replaceWith(NONE)
	void (ui.finish||Function.prototype)()
	ui = null
}

export function showUI(a = this){
	document.exitPointerLock()
	void (ui && ui.finish || Function.prototype)()
	void (ui || NONE).replaceWith((ui = a) || NONE)
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
		if(s == t.os && e == t.oe)return
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
		let [t, v] = curtrack.change(curtrack.value)
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
export const ScaleSmall = _scale.bind(undefined, 'disabled small')
export const Scale = _scale.bind(undefined, 'disabled')

export const Btn = (text, onclick, classes = '') => {
	let btn = document.createElement('btn')
	if(classes)btn.className = classes
	btn.append(text)
	btn.onclick = e => {
		if(btn.disabled)return
		click()
		e.stopPropagation()
		onclick(btn)
	}
	Object.setPrototypeOf(btn, BtnPrototype)
	return btn
}
export const Row = (a, b) => {
	let row = document.createElement('row')
	row.append(a); row.append(b)
	return row
}
export const Label = (txt) => {
	let label = document.createElement('label')
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
	let space = document.createElement('div')
	space.style.flexBasis = a + 'rem'
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