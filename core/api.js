export const _cbs = [], _cbs1 = []
export const _renderPhases = [], _tickPhases = []
export const _optionListeners = {}
export const ongesture = [], onpress = []
const coords = {__proto__: null, none: 0, ui: 1, world: 2}

export function tickPhase(prio=0, fn){
	let i = _tickPhases.push(null) - 2
	while(i >= 0 && _tickPhases[i].prio > prio)
		_tickPhases[i+1] = _tickPhases[i--]
	fn.prio = prio
	_tickPhases[i+1] = fn
}
export function drawLayer(coord, prio=0, fn){
	let i = _renderPhases.push(null) - 2
	while(i >= 0 && _renderPhases[i].prio > prio)
		_renderPhases[i + 1] = _renderPhases[i--]
	fn.prio = prio
	fn.coordSpace = coords[coord] || 0
	_renderPhases[i+1] = fn
}



export const onwheel = []
export const onmousemove = []

export const onkey = (...keys) => {
	const cb = keys.pop()
	for(const key of keys)
		(_cbs[key] || (_cbs[key] = [])).push(cb)
}
export const onrelease = (...keys) => {
	const cb = keys.pop()
	for(const key of keys)
		(_cbs1[key] || (_cbs1[key] = [])).push(cb)
}

export const options = {}
globalThis.options = options

export const listen = (...keys) => {
	const cb = keys.pop()
	for(const key of keys){
		(_optionListeners[key] || (_optionListeners[key] = [])).push(cb)
		if(key in options) cb(options[key])
	}
}
export let paused = true, playing = false
export const setPlaying = (p=true) => {playing=p}
export const quit = () => parent.postMessage(NaN, '*')

export const onfocus = []
export const onblur = []
export const preframe = []


export let renderF3 = 0, renderBoxes = 0, renderUI = true
listen('autof3', () => {renderF3 = min(options.autof3,2); renderBoxes = (options.autof3 > 2)*2})
onkey(KEYS.F1, () => {renderUI = !renderUI})
onkey(KEYS.F3, GAMEPAD.UP, () => {
	if(buttons.has(GAMEPAD.UP)){
		++renderF3>=3&&(renderF3=0,renderBoxes=(renderBoxes+1)%3)
	}else if(buttons.has(KEYS.ALT) | buttons.has(KEYS.SHIFT) | buttons.has(KEYS.MOD)) renderBoxes = (renderBoxes+1)%3
	else renderF3 = (renderF3+1)%3
})

export const packets = new Array(256)

let bytes = 0
export let networkUsage = 0
export const _networkUsage = () => {
	const p = 0.5**(dt*2)
	networkUsage = (bytes *= p) * (1-p)/dt
}
export const _onPacket = data => {
	bytes += data.byteLength
	const packet = new DataReader(data)
	const code = packet.byte()
	if(!packets[code]) return
	try{
		packets[code](packet)
	}catch(e){
		Promise.reject(e)
		console.warn(packet, packet.i)
	}
}
export const send = buf => void(parent.postMessage(buf = (buf.build ? buf.build().buffer : buf.buffer || buf), '*'), bytes += buf.byteLength ?? buf.length)

export const download = blob => parent.postMessage(blob, '*')
export const copy = blob => parent.postMessage(globalThis.ClipboardItem ? [blob] : blob, '*')

export let _onvoice = null

export function voice(fn){
	parent.postMessage(Infinity, '*')
	if(typeof fn == 'function') _onvoice = fn
	voice.active = true
}
voice.stop = () => {
	_onvoice = null
	parent.postMessage(-Infinity, '*')
	voice.active = false
}
export const ping = () => parent.postMessage(undefined, '*')
voice.sampleRate = 0
voice.active = false

export function uiButton(c, x0, y0, w, h){
	const {x, y} = c.from(cursor)
	if(x<x0|x>x0+w|y<y0|y>y0+h) return 0
	if(changed.has(LBUTTON) && buttons.pop(LBUTTON)) return 2
	if(changed.has(RBUTTON) && buttons.pop(RBUTTON)) return 3
	return 1
}

const ptrLockOpts = !navigator.platform.startsWith('Linux') && Intl.v8BreakIterator ? {unadjustedMovement: true} : {}
export const movementScale = ptrLockOpts.unadjustedMovement ? 1 : globalThis.netscape ? devicePixelRatio : /Opera|OPR\//.test(navigator.userAgent) ? 1/devicePixelRatio : 1
export const ptrlock = () => {
	const el = gl.canvas
	const fs = options.fsc && !document.fullscreenElement ? document.body.requestFullscreen?.() : undefined
	if(fs instanceof Promise) fs.catch(e=>null).then(() => el.requestPointerLock?.(ptrLockOpts)?.catch(e=>null))
	else el.requestPointerLock?.(ptrLockOpts)?.catch(e=>null)
}
let exited = false
export const exitPtrlock = () => {
	exited = true
	document.exitPointerLock?.()
}
document.onpointerlockerror = document.onpointerlockchange = function(e){
	if(e.type == 'pointerlockchange' && document.pointerLockElement){
		top.postMessage(false, '*')
		paused = false
	}else{
		if(!exited) top.postMessage(paused = true, '*'), document.fullscreenElement && document.exitFullscreen?.(), document.documentElement.style.cursor = 'pointer'
		exited = false
	}
}

const selchange = new Set()
document.onselectionchange = () => {
	for(const c of selchange){
		if(!c.parentElement) selchange.delete(c)
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
const {prototype: InputPrototype} = class extends HTMLElement{
	get placeholder(){return this.t.placeholder}
	set placeholder(a){this.t.placeholder = a}
	get value(){return this.t.value}
	set value(a){this.t.value = a;this.t.onselchange()}
	focus(){this.t.focus()}
	blur(){this.t.blur()}
	on(a,b,c){this.t.addEventListener(a,b,c);return this}
	clear(){this.t.value='',this.t.os = this.t.oe = 0;this.v.innerHTML = '<f class="__cursor">_</f>'}
	set disabled(a){this.t.disabled = a}
	get disabled(){return this.t.disabled}
}
export const Input = (type, placeholder, tokenizers = {txt:/[^]*/y}) => {
	const el = document.createElement('in')
	for(const k in tokenizers) if(tokenizers[k].flags!='y') tokenizers[k] = new RegExp(tokenizers[k].source, 'y')
	const t = document.createElement(type == 'long' ? 'textarea' : 'input'), v = document.createElement('div')
	newnode(v, '__cursor', '_')
	t.autocomplete = 'off'; t.name = '\0'
	el.os = el.oe = 0
	el.t = t
	t.placeholder = placeholder
	el.innerHTML = ''
	el.v = v
	el.append(t, v)
	Object.setPrototypeOf(el, InputPrototype)
	t.onscroll = () => v.scrollTo(t.scrollLeft, t.scrollTop)
	t.onkeydown = e => {if(el.key) el.key(e.keyCode,e.key,e.shiftKey)&&e.preventDefault();e.stopPropagation()}
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
				if(length) break
			}
			if(!length) length = 1, k = '__invalid'
			if(cur >= i && cur < i + length){
				if(i != cur) newnode(v, k, value.slice(i, cur))
				newnode(v, '__cursor', '_')
				newnode(v, k, value.slice(cur, i += length))
			}else newnode(v, k, value.slice(i, i += length))
		}
		if(i == cur) newnode(v, '__cursor', '_')
		let c; while(c = v.children[v.i]) c.remove()
	}
	selchange.add(t)
	return el
}
export const css = (...f) => {for(const c of f) document.styleSheets[0].insertRule(c) }

import mcFont from "/core/img/font.woff"

mcFont.family = 'mc'
document.fonts.add(mcFont)
css(`*{
	margin:0;box-sizing:border-box;
	padding:0;line-height:12rem;min-width:0;
	flex-shrink:0;-webkit-tap-highlight-color:transparent;
	overscroll-behavior: none; touch-action: manipulation;
	scrollbar-width: none;
}`,
`@keyframes blink{
	0%{opacity: 1} 49.99% {opacity: 1} 50%{opacity: 0} 100%{opacity: 0}
}`,
`body{font-size:8rem;color:white;font-family:mc}`,
`input, textarea{
	font: inherit;
	border: unset;
	-webkit-appearance: none;
	appearance: none;
	outline: none;
	border-radius: unset;
	resize: none;
	background: none;
	color: transparent;
	caret-color: transparent;
}`,
`in{
	display: block;
	background: #000;
	border: 1rem #a0a0a0 solid;
	position: relative;
	z-index: 0;
	--padding: 3rem;
	width: 200rem;
	height: 20rem;
	overflow: hidden;
}`,
`in div, in input{
	position: absolute;
	top: 0; height: 100%;
	left: 0; width: 100%;
	overflow: auto;
	overflow-wrap: break-word;
	padding: var(--padding);
	white-space: pre;
}`,
`f.__cursor{
	display: none;
	letter-spacing: -50rem;
	animation: blink 1.2s steps(2) infinite;
}`,
`input::selection, textarea::selection{
	background-color: #fffd;
	color: blue;
}`,
...`in > div{ z-index: -1 }
f.__invalid{ color: red }
in textarea:focus + div > f.__cursor, in input:focus + div > f.__cursor{display: inline;}
.c0{ color: #000; --tc: #0004; text-shadow: 1rem 1rem var(--tc); }
.c1{ color: #a00; --tc: #2a0000; text-shadow: 1rem 1rem var(--tc); }
.c2{ color: #0a0; --tc: #002a00; text-shadow: 1rem 1rem var(--tc); }
.c3{ color: #fa0; --tc: #2a2a00; text-shadow: 1rem 1rem var(--tc); }
.c4{ color: #00a; --tc: #00002a; text-shadow: 1rem 1rem var(--tc); }
.c5{ color: #a0a; --tc: #2a002a; text-shadow: 1rem 1rem var(--tc); }
.c6{ color: #0aa; --tc: #002a2a; text-shadow: 1rem 1rem var(--tc); }
.c7{ color: #aaa; --tc: #2a2a2a; text-shadow: 1rem 1rem var(--tc); }
.c8{ color: #555; --tc: #15151544; text-shadow: 1rem 1rem var(--tc); }
.c9{ color: #f55; --tc: #3f1515; text-shadow: 1rem 1rem var(--tc); }
.c10{ color: #5f5; --tc: #153f15; text-shadow: 1rem 1rem var(--tc); }
.c11{ color: #ff5; --tc: #3f3f15; text-shadow: 1rem 1rem var(--tc); }
.c12{ color: #55f; --tc: #15153f; text-shadow: 1rem 1rem var(--tc); }
.c13{ color: #f5f; --tc: #3f153f; text-shadow: 1rem 1rem var(--tc); }
.c14{ color: #5ff; --tc: #153f3f; text-shadow: 1rem 1rem var(--tc); }
.c15, in > div{ color: #fff; --tc: #3f3f3f; text-shadow: 1rem 1rem var(--tc); }
.s1, .s3 { text-shadow: .5rem 0, 1rem 0, 1rem 1rem var(--tc), 1.5rem 1rem var(--tc), 2rem 1rem var(--tc); letter-spacing: 1rem; }
.s2, .s3, .s6, .s7, .s10, .s11, .s14, .s15{ font-style: italic; }
.s4, .s5, .s6, .s7 { text-decoration: underline 1rem }
.s8, .s9, .s10, .s11 { text-decoration: line-through 1rem }
.s12, .s13, .s14, .s15 { text-decoration: underline line-through 1rem }
.s4, .s5, .s6, .s7, .s8, .s9, .s10, .s11, .s12, .s13, .s14, .s15 { text-shadow: none; filter: drop-shadow(1rem 1rem var(--tc)) }
.s5, .s7, .s9, .s11, .s13, .s15{ text-shadow: .75rem 0; letter-spacing: 1rem; }`.split('\n'))


listen('guiScale', v => {
	document.documentElement.style.fontSize = v*2 + 'px'
})

HTMLElement.prototype.attr = function(a, b=''){this.setAttribute(a, b); return this}
HTMLElement.prototype.css = function(b){Object.assign(this.style, b); return this}
HTMLElement.prototype.on = function(a, b, c){this.addEventListener(a, b, c); return this}
Object.defineProperty(Node.prototype, 'text', Object.getOwnPropertyDescriptor(Node.prototype, 'textContent'))

let parity = 0
export function uptElements(){
	const n = document.body.childNodes
	for(let i = n.length-1;i; i--){
		if(n[i].parity !== parity) n[i].remove()
	}
	parity ^= 1
}
export const element = el => void(el.parity=parity,el.parentElement||document.body.append(el))

export { drawText, calcText, textShadeCol } from './font.js'