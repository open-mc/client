globalThis.BitField = class BitField extends Array{
	static parse(a){
		if(!Array.isArray(a)) return new BitField 
		return Object.setPrototypeOf(a, BitField.prototype)
	}
	static copyFrom(a){
		const b = new BitField
		if(Array.isArray(a))
			b.push(...a)
		return b
	}
	of(...n){
		const b = new BitField
		for(const i of n) b.set(i)
		return b
	}
	set(pos){
		while((pos >> 5) >= this.length) super.push(0)
		this[pos >> 5] |= 1 << (pos & 31)
	}
	unset(pos){
		let i = this.length
		if((pos >> 5) >= i) return
		this[pos >> 5] &= ~(1 << (pos & 31))
		while(i && !this[--i]) super.pop()
	}
	toggle(pos){
		let i = this.length
		while((pos >> 5) >= i) super.push(0)
		this[pos >> 5] ^= 1 << (pos & 31)
		while(i && !this[--i]) super.pop()
	}
	has(pos){
		if((pos >> 5) >= this.length) return false
		return !!(this[pos >> 5] & (1 << (pos & 31)))
	}
	pop(pos){
		if((pos >> 5) >= this.length) return false
		let i = pos >> 5
		const a = !!(this[i] ^ (this[i] &= ~(1 << (pos & 31))))
		if(i == this.length - 1) while(i >= 0 && !this[i--]) super.pop()
		return a
	}
	put(pos){
		let i = pos >> 5
		while(i >= this.length) super.push(0)
		return !!(this[i] ^ (this[i] |= 1 << (pos & 31)))
	}
	xor(other){
		let l = this.length
		if(l == other.length){
			while(l && this[--l] == other[l]) super.pop()
		}else{
			let l2 = l; l--
			while(l2 < other.length) super.push(other[l2++])
		}
		for(let i = l; i >= 0; i--) this[i] ^= other[i]
	}
	and(other){
		let l = this.length
		if(this.length > other.length) l = this.length = other.length
		while(l && !(this[--l] & other[l])) super.pop()
		while(l > 0) this[--l] &= other[l]
	}
	or(other){
		let l = this.length - 1, l2 = l
		while(++l2 < other.length) super.push(other[l2])
		for(let i = l; i >= 0; i--) this[i] |= other[i]
	}
	firstUnset(){
		let i = -1
		while(++i < this.length){
			const a = ~this[i]
			if(a) return i<<5|31-Math.clz32(a&-a)
		}
		return i<<5
	}
	firstSet(){
		let i = -1
		while(++i < this.length)
			if(this[i]) return i<<5|31-Math.clz32(this[i]&-this[i])
		return -1
	}
	lastSet(){
		let i = this.length
		while(--i >= 0)
			if(this[i]) return i<<5|31-Math.clz32(this[i])
		return -1
	}
	popFirst(){
		let i = -1
		while(++i < this.length)
			if(this[i]){
				let s = 31-Math.clz32(this[i]&-this[i])
				this[i] &= ~(1 << s)
				s = i<<5|s
				i = this.length
				while(i && !this[--i]) super.pop()
				return s
			}
		return -1
	}
	popLast(){
		let i = this.length
		while(--i >= 0)
			if(this[i]){
				let s = 31-Math.clz32(this[i])
				this[i] &= ~(1 << s)
				s = i<<5|s
				i = this.length
				while(i && !this[--i]) super.pop()
				return s
			}
		return -1
	}
	clear(){ this.length = 0 }
}
const _mac = navigator.platform.startsWith('Mac')
Object.assign(globalThis, {
	buttons: new BitField(), changed: new BitField(), touches: new Map(), gesture: {dx: 0, dy: 0, scale: 1, rot: 0},
	cursor: {x: 0, y: 0, dx: 0, dy: 0, mx: 0, my: 0, jlx: 0, jly: 0, jrx: 0, jry: 0},
	LBUTTON: 0, RBUTTON: 2, MBUTTON: 1, KEYS: Object.freeze({
		A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76,
		M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88,
		Y: 89, Z: 90, NUM_0: 48, NUM_1: 49, NUM_2: 50, NUM_3: 51, NUM_4: 52, NUM_5: 53, NUM_6: 54,
		NUM_7: 55, NUM_8: 56, NUM_9: 57, SPACE: 32, LEFT_OF_1: _mac ? 192 : 223, TAB: 9, BACK: 8,
		SHIFT: 16, CTRL: 17, ALT: 18, ESC: 27, META: 91, METARIGHT: 93, CAPSLOCK: 20, UP: 38,
		RIGHT: 39, DOWN: 40, LEFT: 37, MOD: _mac ? 91 : 17, F1: 112, F2: 113, F3: 114, F4: 115,
		F5: 116, F6: 117, F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123, MINUS: 189,
		PLUS: 187, OPENBR: 219, CLOSEBR: 221, SEMICOLON: 186, APOS_HASH: 222, BACKSLASH: 220,
		COMMA: 188, DOT: 190, SLASH: 191, ENTER: 13, CLEAR: 12, HOME: 36, END: 35, PAGE_UP: 33,
		PAGE_DOWN: 34, INS: 45, DEL: 46, CTX_MENU: 93, PAD_0: 96, PAD_1: 97, PAD_2: 98, PAD_3: 99,
		PAD_4: 100, PAD_5: 101, PAD_6: 102, PAD_7: 103, PAD_8: 104, PAD_9: 105, SCROLL_LOCK: 145,
		PAUSE: 19, PAD_DIV: 111, PAD_MULT: 106, PAD_SUB: 109, PAD_ADD: 107, AT: 192
	}),
	GAMEPAD: Object.freeze({ A: 256, B: 257, X: 258, Y: 259, LB: 260, RB: 261, LT: 262, RT: 263, UP: 268, DOWN: 269, LEFT: 270, RIGHT: 271, MENU: 300 })
})
touches[Symbol.iterator] = touches.values
Uint8Array.fromHex = function(hex){
	const res = new Uint8Array(hex.length>>>1)
	let r = 1, i = 0
	for(let j = 0; j < hex.length; j++){
		const c = hex.charCodeAt(j)
		if(c>47&&c<58) r = r<<4|c-48
		else if(c>64&&c<71) r = r<<4|c-55
		else if(c>96&&c<103) r = r<<4|c-87
		if(r&256) res[i++] = r, r = 1
	}
	return res.slice(0, i)
}
const h = '0123456789abcdef'
Number.prototype.toHex = function(){return h[this>>>28]+h[this>>24&15]+h[this>>20&15]+h[this>>16&15]+h[this>>12&15]+h[this>>8&15]+h[this>>4&15]+h[this&15]}
Number.formatData = bytes => bytes < 512 ? bytes.toFixed(0)+'B' : bytes < 524288 ? (bytes/1024).toFixed(1)+'KiB' : bytes < 536870912 ? (bytes/1048576).toFixed(1)+'MiB' : bytes < 549755813888 ? (bytes/1073741824).toFixed(1)+'GiB' : (bytes/1099511627776).toFixed(1)+'TiB'
Math.ifloat = globalThis.ifloat = x => {
	let f = Math.floor(x)
	return (f >> 0) + (x - f)
}
Object.defineProperties(Array.prototype, {
	best: {enumerable: false, value(pred, best = -Infinity){
		let el = undefined
		const length = this.length
		for(let i = 0; i < length; i++){
			const a = this[i], score = pred(a, i, this)
			if(score >= best) best = score, el = a
		}
		return el
	}},
	remove: {enumerable: false, value(a){
		let i = this.indexOf(a)
		if(i>-1){while(i<this.length)this[i]=this[++i];this.pop()}
	}},
	mmap: {enumerable: false, value(fn){
		const len = this.length
		for(let i = 0; i < len; i++)
			this[i] = fn(this[i])
		return this
	}},
	bind: {enumerable: false, value(fn,idx=-1){
		if((idx>>>=0)>=this.length)return this.push(fn);let a;while(idx<this.length)a=this[idx],this[idx++]=fn,fn=a;return this.push(a)
	}},
	fire: {enumerable: false, value(...v){
		for(const r of this) try{r(...v)}catch(e){Promise.reject(e)}
	}},
	mapFire: {enumerable: false, value(...v){
		const res = new Array(this.length)
		for(const r of this) try{res.push(r(...v))}catch(e){Promise.reject(e);res.push(undefined)}
		return res
	}}
})
const nul = new Array(100).fill(null)
Array.null = len => {
	if(len <= 100) return nul.slice(0, len)
	const a = new Array(len)
	while(len > 0) a[--len] = null
	return a
}

const actx = globalThis.actx = new AudioContext({latencyHint: 'interactive'})
globalThis.bgGain = actx.createGain()
bgGain.connect(actx.destination)
globalThis.masterVolume = 1
globalThis.audioOut = null

const c = document.createElement('canvas').getContext('2d')
globalThis.ImgData = (src, x=0,y=0,w=0,h=0, prem=false) => {
	const b = typeof src == 'string' ? __import__.map.get(src) : src
	const ibo = {imageOrientation: 'flipY', colorSpaceConversion: 'none', premultiplyAlpha: prem?'premultiply':'none'}
	return (b ? createImageBitmap(b, ibo) : fetch(src, {credentials: 'omit', priority: 'high'}).then(a => a.blob()).then(a => createImageBitmap(a, ibo))).then(i => {
		c.canvas.width = w ||= i.width; c.canvas.height = h ||= i.height
		c.drawImage(i, -x, -y)
		const d = c.getImageData(0, 0, w, h)
		c.canvas.width = c.canvas.height = 0
		return d
	})
}

globalThis.Wave = src => {
	let buf = null
	return function play(vol = 1, pitch = 1, pan = 0, start = 0, end = NaN, ends = true, bg = false){
		if(buf === null){
			buf = []
			void (typeof src == 'string' ? (__import__.map.get(src)?.arrayBuffer() ?? fetch(src, {credentials: 'omit', priority: 'high'}).then(a => a.arrayBuffer())) : src.arrayBuffer()).then(a => actx.decodeAudioData(a, b => {
				const l = buf; buf = b
				for(let i = 0; i < l.length; i++) l[i][0] = play(...l[i]), l[i].length = 1
			}))
		}
		if(Array.isArray(buf)){
			const a = [vol,pitch,pan,start,end,ends,bg]
			buf.push(a)
			return () => {
				if(Array.isArray(buf)){
					const i = buf.indexOf(a)
					if(i > -1) buf.splice(i, 1)
				}else a[0]()
			}
		}
		const source = actx.createBufferSource()
		source.buffer = buf
		if(bg) source.connect(bgGain)
		else{
			let s = source
			const volume = masterVolume * vol
			source.playbackRate.value = pitch
			if(volume != 1){
				const gain = actx.createGain()
				gain.gain.value = volume
				s.connect(gain)
				s = gain
			}
			if(pan != 0){
				const panner = actx.createStereoPanner()
				panner.pan.value = min(1, max(-1, pan))
				s.connect(panner)
				s = panner
			}
			if(audioOut) s.connect(audioOut)
			s.connect(actx.destination)
		}
		if(source.loop = !ends){
			source.loopStart = start
			if(end == end) source.loopEnd = end
			source.start(0, start)
		}else{
			source.start(0, start, end == end ? end - start : buf.duration)
			if(typeof ends == 'function') source.onended = ends
		}
		return (fire=false) => (fire || (source.onended = null), source.stop())
	}
}

import './gamma.js'

let ow = 0, oh = 0
globalThis.ctxSupersample = 1
Gamma(undefined, globalThis).loop(() => {
	const s = visualViewport.scale, px = devicePixelRatio * ctxSupersample
	const w = visualViewport.width*s, h = visualViewport.height*s
	globalThis.pixelRatio = px
	if(ow!=(ow=round(w*px))|oh!=(oh=round(h*px))) setSize(ow, oh)
	globalThis.canvas.style.transform = `scale(${1/px})`
	globalThis.canvas.style.imageRendering = ctxSupersample > 1 ? 'auto' : 'pixelated'
})
document.head.insertAdjacentHTML('beforeend', `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">`)
glLost = () => {
	document.body.textContent = 'WebGL2 context lost :('
	document.body.style = 'color:white;background:#000;text-align:center;line-height:90vh;font-size:32px;font-family:monospace;'
}
if(!gl) throw glLost(), 'Please reload app'
document.body.append(canvas)
canvas.style = `position: fixed; inset: 0; touch-action: none; background: #000; user-select: none; -webkit-user-select: none; transform-origin: 0 0`