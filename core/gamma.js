document.head.insertAdjacentHTML('beforeend', `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">`)
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
	buttons: new BitField, changed: new BitField, touches: new Map, gesture: {dx: 0, dy: 0, scale: 1, rot: 0},
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
{let i=0,m=new MessageChannel,c=new Map;m.port1.onmessage=({data:i},j=c.get(i))=>(c.delete(i)&&j());m=m.port2;globalThis.setImmediate=(f,...a)=>(c.set(++i,a.length?f.bind(undefined,...a):f),m.postMessage(i),i);globalThis.clearImmediate=i=>c.delete(i)}
Math.fclamp = (a, b = 1) => a < 0 ? 0 : (a > b ? b : a)
Math.ifloat = x => {
	let f = Math.floor(x)
	return (f >> 0) + (x - f)
}
Math.randint = () => Math.random() * 4294967296 | 0
Math.PI2 = Math.PI*2
Object.defineProperties(globalThis, Object.getOwnPropertyDescriptors(Math))
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
		let i = 0, j = 0
		for(; j < this.length; j++){
			if(j > i) this[i] = this[j]
			if(this[i] != a) i++
		}
		return this.length = i
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
globalThis.ctxSupersample = 1
globalThis.ctxFramerate = -1
globalThis.pixelRatio = 1
globalThis.t = performance.now()/1000; globalThis.dt = 0
let T=document.body
T.parentElement.style.overflow='hidden'
T.append(T=document.createElement('canvas'))
T.style = 'position:fixed;inset:0;width:100%;height:100%;background:#000'
T.width = T.height = 0
/** @type WebGL2RenderingContext */
export const gl = T.getContext('webgl2', {preserveDrawingBuffer: false, antialias: false, depth: false, premultipliedAlpha: true, stencil: true})
function glLost(){
	parent.postMessage(false, '*')
	document.body.textContent = 'WebGL2 context lost :('
	document.body.style = 'color:white;background:#000;text-align:center;line-height:90vh;font-size:32px;font-family:monospace;'
}
if(!gl) throw glLost(), 'Please reload app'
gl.pixelStorei(37440,1) // unpack flip-y
gl.stencilMask(1)
gl.clearStencil(0)
gl.disable(2929) // depth test
gl.enable(3042) // blend
gl.disable(3024) // dither
gl.pixelStorei(3317, 1)
gl.pixelStorei(3333, 1)
let pma = 1
const ibo = {imageOrientation: 'flipY', premultiplyAlpha: 'none'}
class img{
	get format(){return this.t.f}
	get width(){return this.t.w}
	get height(){return this.t.h}
	get layers(){return this.t.d}
	get subWidth(){return this.t.w*this.w}
	get subHeight(){return this.t.h*this.h}
	get aspectRatio(){return this.t.w*this.w/(this.t.h*this.h)}
	constructor(t,x=0,y=0,w=1,h=1,l=0){
		this.t = t; this.x = x; this.y = y
		this.w = w; this.h = h; this.l = l
	}
	get src(){return this.t.src}
	set src(a){ if(this.t.src===null) return; this.t.src=a?Array.isArray(a)?a:[a]:[];if(this.t.tex) this.delete() }
	get loaded(){return this.t.d!=0}
	get then(){return this.t.d==0?this.#then:null}
	load(){if(!this.t.tex) img.load(this.t)}
	sub(x=0, y=0, w=1, h=1, l=this.l){
		return new img(this.t, this.x+x*this.w, this.y+y*this.h, this.w*w, this.h*h, l)
	}
	sup(x=0,y=0,w=1,h=1){
		const tw = this.w/w, th = this.h/h
		return new img(this.t, this.x-x*tw, this.y-y*th, tw, th)
	}
	crop(x=0, y=0, w=1, h=1, l=this.l){
		const {t,x:X,y:Y,h:H}=this
		if(t.d!=0) return new img(t, X+x/t.w, Y+H-(y+h)/t.h, w/t.w, h/t.h, l)
		const i = new img(t, 0, 0, 0, 0, l)
		;(t.cbs??=[]).push(() => {
			i.x = X+x/t.w
			i.y = Y+H-(y+h)/t.h
			i.w = w/t.w; i.h = h/t.h
		},undefined,undefined)
		if(!t.tex) img.load(t)
		return i
	}
	layer(l=this.l){return new img(this.t, this.x, this.y, this.w, this.h, l)}
	#then(cb, rj){
		const {t}=this
		if(t.d) return void cb(this)
		;(t.cbs??=[]).push(cb,rj,this)
		if(!t.tex) img.load(t)
	}
	static load(t){
		t.tex = gl.createTexture()
		if(!t.src.length){
			img.fakeBind(t)
			gl.texStorage3D(35866, 1, t.f[0], t.w=1, t.h=1, t.d=1)
			if(t.i<0) gl.bindTexture(35866, null)
			if(t.cbs) for(let i = 0; i < t.cbs.length; i+=3) t.cbs[i]?.(t.cbs[i+2])
			t.cbs = null
			return
		}
		let toLoad = t.src.length
		let w=0, h=0
		const rj = e => {
			toLoad = -1
			oU=-2; this.options = t.o; oU=0
			gl.texStorage3D(35866, t.m||1, t.f[0], t.w=w=1, t.h=h=1, t.d=imgs.length)
			if(!pma) gl.pixelStorei(37440,1),gl.pixelStorei(37441,pma=1)
			if(t.m) gl.generateMipmap(35866)
			if(t.i<0) gl.bindTexture(35866, null)
			if(t.cbs) for(let i = 1; i < t.cbs.length; i+=3) t.cbs[i]?.(t.cbs[i+1])
			t.cbs = null
		}
		let p
		const imgs = t.src.map((a,i)=>(typeof a=='string'?(p=__import__.map.get(a))?createImageBitmap(p, ibo):fetch(a).then(a=>a.blob()).then(a=>createImageBitmap(a, ibo)):a instanceof Blob?createImageBitmap(a, ibo):a).then(bmp => {
			imgs[i] = bmp
			if(toLoad==imgs.length) w=bmp.width, h=bmp.height
			else if(w!=bmp.width||h!=bmp.height) return gl.deleteTexture(t.tex), rj('Failed to load image: all layers must be the same size')
			if(--toLoad) return
			oU=-2; this.options = t.o; oU=0
			gl.texStorage3D(35866, t.m||1, t.f[0], t.w=w, t.h=h, t.d=imgs.length)
			if(!pma) gl.pixelStorei(37440,1),gl.pixelStorei(37441,pma=1)
			for(let l = 0; l < imgs.length; l++)
				gl.texSubImage3D(35866, 0, 0, 0, l, w, h, 1, t.f[1], t.f[2], imgs[l])
			if(t.m) gl.generateMipmap(35866)
			if(t.i<0) gl.bindTexture(35866, null)
			if(t.cbs) for(let i = 0; i < t.cbs.length; i+=3) t.cbs[i](t.cbs[i+2])
			t.cbs = null
		}, e => rj('Failed to load image')))
	}
	paste(tex, x=0, y=0, l=0, srcX=0, srcY=0, srcL=0, srcW=0, srcH=0, srcD=0){
		const {t}=this; if(t.src) return this
		if(typeof tex=='string') return new Promise((cb, rj) => {
			const i = new Image()
			i.onerror = () => rj('Failed to load image')
			i.onload = () => {
				img.fakeBind(t)
				if(!pma) gl.pixelStorei(37440,1),gl.pixelStorei(37441,pma=1)
				gl.texSubImage3D(35866, 0, x, y, l, i.naturalWidth, i.naturalHeight, 1, t.f[1], t.f[2], i)
				if(t.i<0) gl.bindTexture(35866, null)
				cb?.(this)
			}
			i.crossOrigin = 'anonymous'
			i.src = tex
			return this
		})
		const {t:t2}=tex
		if(!t2.d) return tex.#then(()=>this.paste(tex,x,y,l,srcX,srcY,srcL,srcW,srcH,srcD)), this
		if(t.tex==t2.tex) return console.warn('cannot copy from texture to itself'), this
		i&&draw()
		img.fakeBind(t)
		if(!ca.img) gl.bindFramebuffer(36160,fb)
		if(fbSte) gl.framebufferRenderbuffer(36160,36128,36161,null)
		srcW = srcW||t2.w; srcH = srcH||t2.h; srcD = srcD||t2.d
		while(srcD--){
			gl.framebufferTextureLayer(36160,36064, t2.tex,0, srcL++)
			gl.copyTexSubImage3D(35866, 0, x, y, l++, srcX, srcY, srcW, srcH)
		}
		if(t.i<0) gl.bindTexture(35866, null)
		if(!ca.img) gl.bindFramebuffer(36160,null)
		else if(!i) gl.bindFramebuffer(36160,null), ca=ctx.t, fbLayer=srcL-1,fbTex=t2.tex, fbSte = null
		else gl.framebufferTextureLayer(36160,36064,fbTex,0,fbLayer), fbSte&&gl.framebufferRenderbuffer(36160,36128,36161,fbSte)
		return this
	}
	pasteData(data, x=0, y=0, l=0, w=0, h=0, d=0){
		const {t}=this; w = w||t.w; h = h||t.h; d = d||t.d
		img.fakeBind(t)
		if(pma) gl.pixelStorei(37440,0),gl.pixelStorei(37441,pma=0)
		gl.texSubImage3D(35866, 0, x, y, l, w, h, d, t.f[1], t.f[2], data)
		fd += data.byteLength*.25
		if(t.i<0) gl.bindTexture(35866, null)
	}
	readData(x=0, y=0, l=0, w=0, h=0, d=0, arr=null){
		const {t}=this; w = w||t.w; h = h||t.h; d = d||t.d
		if(!t.d) return null
		i&&draw()
		if(!ca.img) gl.bindFramebuffer(36160,fb)
		if(fbSte) gl.framebufferRenderbuffer(36160,36128,36161,null)
		const a = t.f[0]
		const S = (a==32856||a==36214||a==36208||a==34842||a==34836||a==36220?4:a==32849||a==36215||a==36209||a==34843||a==34837||a==32849||a==36221?3:a==33323||a==33338||a==33340||a==33327||a==33328||a==33336?2:1)*w*h
		if(!arr || arr.length != S) arr = (t.f[2]==5121?new Uint8Array(S*d):t.f[2]==5126?new Float32Array(S*d):t.f[2]==5125||t.f[2]==35899||t.f[2]==33640||t.f[2]==35902?new Uint32Array(S*d):new Uint16Array(S*d))
		while(d--){
			gl.framebufferTextureLayer(36160,36064,t.tex,0,l)
			gl.readPixels(x, y, w, h, t.f[1], t.f[2], arr.subarray(S*l, S*(++l)))
		}
		if(t.i<0) gl.bindTexture(35866, null)
		if(!ca.img) gl.bindFramebuffer(36160,null)
		else if(!i) gl.bindFramebuffer(36160,null), ca=ctx.t, fbLayer=l-1,fbTex=t.tex, fbSte = null
		else gl.framebufferTextureLayer(36160,36064,fbTex,0,fbLayer), fbSte&&gl.framebufferRenderbuffer(36160,36128,36161,fbSte)
		return arr
	}
	delete(){
		if(!this.t.tex) return
		gl.deleteTexture(this.t.tex)
		this.t.tex = null; if(this.t.i>=0) bound[this.t.i] = null, this.t.i = -1
		this.t.d = this.t.w = this.t.h = 0
	}
	static auto(t,i=0){
		if((t.f[3]>>31)!=i) return -2
		if(t.i>=0){
			const sl = -2147483648>>>t.i-(maxTex-shfCount&i)
			if(!(sl&(i^shfMask))) return (boundUsed|=sl,t.i)
			bound[t.i]=null,t.i=-1
		}
		if(!t.tex) return img.load(t), -2
		const j = Math.clz32(~(boundUsed|i^shfMask))
		if(j>=maxTex) return -1
		boundUsed |= -2147483648>>>j
		i = i?maxTex+j-shfCount:j
		const o = bound[i]; if(o) o.i=-1
		gl.activeTexture(33984 + i)
		gl.bindTexture(35866, (bound[i]=t).tex)
		return t.i = i
	}
	static fakeBind(t){
		if(t.i>=0) gl.activeTexture(33984+t.i)
		else{
			const j = maxTex-1+(shfCount==maxTex&&maxTex)
			bound[j]&&(bound[j].t.i=-1)
			gl.activeTexture(33984+j)
			gl.bindTexture(35866, t.tex)
		}
	}
	get options(){return this.t.o}
	set options(o){
		const {t}=this
		t.o=o
		if(!t.tex) return
		img.fakeBind(t)
		if(t.f[3]>>31)
			gl.texParameterf(35866, 10240, 9728),
			gl.texParameterf(35866, 10241, 9728)
		else
			gl.texParameterf(35866, 10240, 9728+(o&1)),
			gl.texParameterf(35866, 10241, t.m?9984+(o>>1&3):9728+(o>>1&1))
		gl.texParameterf(35866, 10242, o&8?10497:o&16?33648:33071)
		gl.texParameterf(35866, 10243, o&32?10497:o&64?33648:33071)
		if(t.i<oU) gl.bindTexture(35866, null)
	}
	drawable(l=this.l,stencil=false){
		const {t}=this
		if(t.src) return null
		let stencilBuf = null
		if(stencil){
			gl.bindRenderbuffer(36161, stencilBuf = gl.createRenderbuffer())
			gl.renderbufferStorage(36161, 36168, t.w, t.h)
		}
		return new can({tex:t.tex,img:this,layer:l,stencil:0,stencilBuf,w:t.w,h:t.h})
	}
	genMipmaps(){
		const {t}=this
		if(!t.tex||!t.m) return
		img.fakeBind(t)
		gl.generateMipmap(35866)
		if(t.i<0) gl.bindTexture(35866, null)
	}
}
let oU=0
let arr = new Float32Array(16), iarr = new Int32Array(arr.buffer), i = 0
globalThis.Texture = (w=0, h=0, d=0, o=0, f=Formats.RGBA, mips=0) => {
	const t = {tex: gl.createTexture(), i: -1, o: 0, src: null, f, w, h, d: +d||1,cbs:null,m:0}, tx = new img(t)
	oU=-2; tx.options = o; oU=0
	if(w&&h) gl.texStorage3D(35866, (t.m = mips)||1, t.f[0], t.w=w, t.h=h, t.d=+d||1)
	else gl.texStorage3D(35866, (t.m = mips)||1, t.f[0], t.w=1, t.h=1, t.d=1)
	gl.bindTexture(35866, null)
	return tx
}
globalThis.Img = (src, o=0, fmt=Formats.RGBA, mips=0) => new img({tex:null,i:-1,f:fmt,o,src:src?Array.isArray(src)?src:[src]:[],w:0,h:0,d:0,cbs:null,m:mips})
Object.assign(globalThis, {
	UPSCALE_SMOOTH: 1, DOWNSCALE_SMOOTH: 2, MIPMAP_SMOOTH: 4, SMOOTH: 7, REPEAT_X: 8, REPEAT_MIRRORED_X: 16, REPEAT_Y: 32, REPEAT_MIRRORED_Y: 64, REPEAT: 40, REPEAT_MIRRORED: 80,
	R: 1, G: 2, B: 4, A: 8,
	RGB: 7, RGBA: 15,
	IF_SET: 16, IF_UNSET: 32, NO_DRAW: 48,
	UNSET: 64, SET: 128, FLIP: 192,
	ONE: 17, ZERO: 0, RGB_ONE: 1, A_ONE: 16,
	SRC: 34, RGB_SRC: 2,
	ONE_MINUS_SRC: 51,
	RGB_ONE_MINUS_SRC: 3,
	SRC_ALPHA: 68,
	RGB_SRC_ALPHA: 4,
	A_SRC: 64,
	ONE_MINUS_SRC_ALPHA: 85,
	RGB_ONE_MINUS_SRC_ALPHA: 5,
	A_ONE_MINUS_SRC: 80,
	DST: 136, RGB_DST: 8,
	ONE_MINUS_DST: 153,
	RGB_ONE_MINUS_DST: 9,
	DST_ALPHA: 102,
	RGB_DST_ALPHA: 6,
	A_DST: 96,
	ONE_MINUS_DST_ALPHA: 119,
	RGB_ONE_MINUS_DST_ALPHA: 7,
	A_ONE_MINUS_DST: 112,
	SRC_ALPHA_SATURATE: 170,
	RGB_SRC_ALPHA_SATURATE: 10,
	ADD: 17, RGB_ADD: 1, A_ADD: 16,
	SUBTRACT: 85,
	RGB_SUBTRACT: 5,
	A_SUBTRACT: 80,
	REVERSE_SUBTRACT: 102,
	RGB_REVERSE_SUBTRACT: 6,
	A_REVERSE_SUBTRACT: 96,
	MIN: 34, RGB_MIN: 2, A_MIN: 32,
	MAX: 51, RGB_MAX: 3, A_MAX: 48,
	FLOAT: 0, VEC2: 1, VEC3: 2, VEC4: 3,
	INT: 16, IVEC2: 17, IVEC3: 18, IVEC4: 19,
	UINT: 32, UVEC2: 33, UVEC3: 34, UVEC4: 35,
	TEXTURE: 20, UTEXTURE: 24, FTEXTURE: 28, COLOR: 4, UCOLOR: 8, FCOLOR: 12,
	FIXED: 4, _: undefined,
	TRIANGLE_STRIP: 5, TRIANGLES: 4, TRIANGLE_FAN: 6, LINE_LOOP: 2, LINE_STRIP: 3, LINES: 1, POINTS: 0
})
const V=class vec2{
	constructor(x,y){this.x=x;this.y=y}
	copy(){return new V(this.x,this.y)}
	plus(v=0){return typeof v=='number'?new V(this.x+v,this.y+v):new V(this.x+v.x,this.y+v.y)}
	minus(v=0){return typeof v=='number'?new V(this.x-v,this.y-v):new V(this.x-v.x,this.y-v.y)}
	neg(){return new V(-this.x,-this.y)}
	recip(){return new V(1/this.x,1/this.y)}
	times(v=1){return typeof v=='number'?new V(this.x*v,this.y*v):new V(this.x*v.x,this.y*v.y)}
	div(v=1){return typeof v=='number'?new V(this.x/v,this.y/v):new V(this.x/v.x,this.y/v.y)}
	pow(v=1){return typeof v=='number'?new V(this.x**v,this.y**v):new V(this.x**v.x,this.y**v.y)}
	set(v=0){if(typeof v=='number')this.x=this.y=v;else this.x=v.x,this.y=v.y}
	map(fn){return new V(fn(this.x),fn(this.y))}
	eq(v){return typeof v=='number'?this.x==v&&this.y==v:this.x==v.x&&this.y==v.y}
	length(){return hypot(this.x,this.y)}
	get yx(){return V(this.y,this.x)}
},W=class vec3{
	constructor(x,y,z){this.x=x;this.y=y;this.z=z}
	copy(){return new W(this.x,this.y,this.z)}
	plus(v=0){return typeof v=='number'?new W(this.x+v,this.y+v,this.z+v):new W(this.x+v.x,this.y+v.y,this.z+v.z)}
	minus(v=0){return typeof v=='number'?new W(this.x-v,this.y-v,this.z-v):new W(this.x-v.x,this.y-v.y,this.z-v.z)}
	neg(){return new W(-this.x,-this.y,-this.z)}
	recip(){return new W(1/this.x,1/this.y,1/this.z)}
	times(v=1){return typeof v=='number'?new W(this.x*v,this.y*v,this.z*v):new W(this.x*v.x,this.y*v.y,this.z*v.z)}
	div(v=1){return typeof v=='number'?new W(this.x/v,this.y/v,this.z/v):new W(this.x/v.x,this.y/v.y,this.z/v.z)}
	pow(v=1){return typeof v=='number'?new W(this.x**v,this.y**v,this.z**v):new W(this.x**v.x,this.y**v.y,this.z**v.z)}
	set(v=0){if(typeof v=='number')this.x=this.y=this.z=v;else this.x=v.x,this.y=v.y,this.z=v.z}
	map(fn){return new W(fn(this.x),fn(this.y),fn(this.z))}
	eq(v){return typeof v=='number'?this.x==v&&this.y==v&&this.z==v:this.x==v.x&&this.y==v.y&&this.z==v.z}
	length(){return hypot(this.x,this.y,this.z)}
	get xy(){return new V(this.x,this.y)}
	get xz(){return new V(this.x,this.z)}
	get yz(){return new V(this.y,this.z)}
	get zyx(){return new W(this.z,this.y,this.x)}
},X=class vec4{
	constructor(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w}
	copy(){return new X(this.x,this.y,this.z,this.w)}
	plus(v=0){return typeof v=='number'?new X(this.x+v,this.y+v,this.z+v,this.w+v):new X(this.x+v.x,this.y+v.y,this.z+v.z,this.w+v.w)}
	minus(v=0){return typeof v=='number'?new X(this.x-v,this.y-v,this.z-v,this.w-v):new X(this.x-v.x,this.y-v.y,this.z-v.z,this.w-v.w)}
	neg(){return new X(-this.x,-this.y,-this.z,-this.w)}
	recip(){return new X(1/this.x,1/this.y,1/this.z,1/this.w)}
	times(v=1){return typeof v=='number'?new X(this.x*v,this.y*v,this.z*v,this.w*v):new X(this.x*v.x,this.y*v.y,this.z*v.z,this.w*v.w)}
	div(v=1){return typeof v=='number'?new X(this.x/v,this.y/v,this.z/v,this.w/v):new X(this.x/v.x,this.y/v.y,this.z/v.z,this.w/v.w)}
	pow(v=1){return typeof v=='number'?new X(this.x**v,this.y**v,this.z**v,this.w**v):new X(this.x**v.x,this.y**v.y,this.z**v.z,this.w**v.w)}
	set(v=0){if(typeof v=='number')this.x=this.y=this.z=this.w=v;else this.x=v.x,this.y=v.y,this.z=v.z,this.w=v.w}
	map(fn){return new X(fn(this.x),fn(this.y),fn(this.z),fn(this.w))}
	eq(v){return typeof v=='number'?this.x==v&&this.y==v&&this.z==v&&this.w==v:this.x==v.x&&this.y==v.y&&this.z==v.z&&this.w==v.w}
	length(){return hypot(this.x,this.y,this.z,this.w)}
	get xy(){return new V(this.x,this.y)}
	get xz(){return new V(this.x,this.z)}
	get xw(){return new V(this.x,this.w)}
	get yz(){return new V(this.y,this.z)}
	get yw(){return new V(this.y,this.w)}
	get zw(){return new V(this.z,this.w)}
	get xyz(){return new W(this.x,this.y,this.z)}
	get xyw(){return new W(this.x,this.y,this.w)}
	get xzw(){return new W(this.x,this.z,this.w)}
	get yzw(){return new W(this.y,this.z,this.w)}
	get wzyx(){return new X(this.w,this.z,this.y,this.x)}
}
T = globalThis.vec2 = (x=0,y=x)=>new V(x,y)
T.one = T(1); const v2z = T.zero = T(0)
T = globalThis.vec3 = (x=0,y=x,z=x)=>new W(x,y,z)
T.one = T(1); const v3z = T.zero = T(0)
T = globalThis.vec4 = (x=0,y=x,z=x,w=x)=>new X(x,y,z,w)
T.one = T(1); const v4z = T.zero = T(0)
globalThis.Formats={R:[33321,6403,5121],RG:[33323,33319,5121],RGB:[32849,6407,5121],RGBA:[32856,T=6408,5121],RGB565:[36194,6407,33635],R11F_G11F_B10F:[35898,6407,35899],RGB5_A1:[32855,T,32820],RGB10_A2:[32857,T,33640],RGBA4:[32854,T,32819],RGB9_E5:[35901,6407,35902],R8:[33330,T=36244,5121,1<<31],RG8:[33336,33320,5121,1<<31],RGB8:[36221,36248,5121,1<<31],RGBA8:[36220,36249,5121,1<<31],R16:[33332,T,5123,1<<31],RG16:[33338,33320,5123,1<<31],RGB16:[36215,36248,5123,1<<31],RGBA16:[36214,36249,5123,1<<31],R32:[33334,T,5125,1<<31],RG32:[33340,33320,5125,1<<31],RGB32:[36209,36248,5125,1<<31],RGBA32:[36208,36249,5125,1<<31],R16F:[33325,6403,5131],RG16F:[33327,33319,5131],RGB16F:[34843,6407,5131],RGBA16F:[34842,6408,5131],R16F_32F:[33325,6403,5126],RG16F_32F:[33327,33319,5126],RGB16F_32F:[34843,6407,5126],RGBA16F_32F:[34842,6408,5126],R32F:[33326,6403,5126],RG32F:[33328,33319,5126],RGB32F:[34837,6407,5126],RGBA32F:[34836,6408,5126]}
globalThis.loader=({url}) => (...src) => {
	if(src[0].raw){
		const a = [src[0][0]]
		for(let i = 1; i <= src.length; i++) a.push(src[i], src[0][i])
		const s = new URL(a.join(''), url).href
		return __import__.map.get(s)??s
	}
	return src.length==1?__import__.map.get(src=new URL(src[0],url).href)??src:src.map(a=>__import__.map.get(a=new URL(a,url).href)??a)
}
class can{
	t;#a;#b;#c;#d;#e;#f;#m;#shader;s
	get width(){return this.t.w}
	get height(){return this.t.h}
	get texture(){return this.t.img}
	constructor(t,a=1,b=0,c=0,d=1,e=0,f=0,m=290787599,s=Shader.DEFAULT,sp=defaultShape){this.t=t;this.#a=a;this.#b=b;this.#c=c;this.#d=d;this.#e=e;this.#f=f;this.#m=m;this.#shader=s;this.s=sp}
	translate(x=0,y=0){ this.#e+=x*this.#a+y*this.#c;this.#f+=x*this.#b+y*this.#d }
	scale(x=1,y=x){ this.#a*=x; this.#b*=x; this.#c*=y; this.#d*=y }
	rotate(r=0){
		const cs = Math.cos(r), sn = Math.sin(r), a=this.#a,b=this.#b,c=this.#c,d=this.#d
		this.#a=a*cs-c*sn; this.#b=b*cs-d*sn
		this.#c=a*sn+c*cs; this.#d=b*sn+d*cs
	}
	transform(a,b,c,d,e,f){
		const A=this.#a,B=this.#b,C=this.#c,D=this.#d,E=this.#e,F=this.#f
		this.#a = A*a+C*b; this.#b = B*a+D*b
		this.#c = A*c+C*d; this.#d = B*c+D*d
		this.#e = A*e+C*f+E; this.#f = B*e+D*f+F
	}
	skew(x=0, y=0){
		const ta=this.#a,tb=this.#b
		this.#a+=this.#c*y; this.#b+=this.#d*y
		this.#c+=ta*x; this.#d+=tb*x
	}
	multiply(x=1, y=0){
		const ta=this.#a,tb=this.#b
		this.#a=ta*x-this.#c*y;this.#b=tb*x-this.#d*y
		this.#c=ta*y+this.#c*x;this.#d=tb*y+this.#d*x
	}
	getTransform(){ return {a: this.#a, b: this.#b, c: this.#c, d: this.#d, e: this.#e, f: this.#f} }
	new(a=1,b=0,c=0,d=1,e=0,f=0){return new can(this.t,a,b,c,d,e,f,this.#m,this.#shader,this.s)}
	reset(a=1,b=0,c=0,d=1,e=0,f=0){this.#a=a;this.#b=b;this.#c=c;this.#d=d;this.#e=e;this.#f=f;this.#m=290787599;this.#shader=Shader.DEFAULT;this.s=defaultShape}
	box(x=0,y=0,w=1,h=w){ this.#e+=x*this.#a+y*this.#c; this.#f+=x*this.#b+y*this.#d; this.#a*=w; this.#b*=w; this.#c*=h; this.#d*=h }
	to(x=0, y=0){if(typeof x=='object')({x,y}=x);return{x:this.#a*x+this.#c*y+this.#e,y:this.#b*x+this.#d*y+this.#f}}
	from(x=0, y=0){
		if(typeof x=='object')({x,y}=x)
		const a=this.#a,b=this.#b,c=this.#c,d=this.#d, det = a*d-b*c
		return {
			x: (x*d - x*c + c*this.#f - d*this.#e)/det,
			y: (y*a - y*b + b*this.#e - a*this.#f)/det
		}
	}
	toDelta(dx=0, dy=0){if(typeof dx=='object')({dx,dy}=dx);return{dx:this.#a*dx+this.#c*dy,dy:this.#b*dx+this.#d*dy}}
	fromDelta(dx=0, dy=0){
		if(typeof dx=='object')({dx,dy}=dx)
		const a=this.#a,b=this.#b,c=this.#c,d=this.#d, det = a*d-b*c
		return { dx: (dx*d-dx*c)/det, dy: (dy*a-dy*b)/det }
	}
	sub(){ return new can(this.t,this.#a,this.#b,this.#c,this.#d,this.#e,this.#f,this.#m,this.#shader,this.s) }
	resetTo(m){ this.#a=m.#a;this.#b=m.#b;this.#c=m.#c;this.#d=m.#d;this.#e=m.#e;this.#f=m.#f;this.#m=m.#m;this.#shader=m.#shader;this.s=m.s }
	set shader(sh){ this.#shader=typeof sh=='function'?sh:Shader.DEFAULT }
	get shader(){return this.#shader}
	set mask(m){this.#m=this.#m&-256|m&255}
	get mask(){return this.#m&255}
	set blend(b){this.#m=this.#m&255|(b||1135889)<<8}
	get blend(){return this.#m>>8}
	get geometry(){return this.s}
	set geometry(a){this.s=a||defaultShape}
	draw(...values){
		setv(this.t,this.#m); const i = this.#shader(values)
		arr[i  ] = this.#a; arr[i+1] = this.#c; arr[i+2] = this.#e
		arr[i+3] = this.#b; arr[i+4] = this.#d; arr[i+5] = this.#f
	}
	drawRect(x=0, y=0, w=1, h=1, ...values){
		setv(this.t,this.#m); const j = this.#shader(values)
		arr[j  ] = this.#a*w; arr[j+1] = this.#c*h; arr[j+2] = this.#e+x*this.#a+y*this.#c
		arr[j+3] = this.#b*w; arr[j+4] = this.#d*h; arr[j+5] = this.#f+x*this.#b+y*this.#d
	}
	drawMat(a=1, b=0, c=0, d=1, e=0, f=0, ...values){
		setv(this.t,this.#m); const i = this.#shader(values)
		const ta=this.#a,tb=this.#b,tc=this.#c,td=this.#d,te=this.#e,tf=this.#f
		arr[i  ] = ta*a+tc*b; arr[i+1] = ta*c+tc*d; arr[i+2] = ta*e+tc*f+te
		arr[i+3] = tb*a+td*b; arr[i+4] = tb*c+td*d; arr[i+5] = tb*e+td*f+tf
	}
	clear(r = 0, g = 0, b = 0, a = 0){
		if(i) draw()
		setv(this.t, this.#m)
		gl.clearColor(r, g, b, a)
		const q = this.t.stencil=this.t.stencil+1&7
		gl.clear(q?16384:(gl.stencilMask(255), 17408))
		gl.disable(2960); pmask &= -241
	}
	clearStencil(){
		if(i) draw()
		setv(this.t, this.#m)
		const q = this.t.stencil=this.t.stencil+1&7
		if(!q) gl.stencilMask(255), gl.clear(1024)
		gl.disable(2960); pmask &= -241
	}
}
let pmask=285217039

globalThis.Blend = T = (src = 17, combine = 17, dst = 0, dither=false) => src|dst<<8|combine<<16|dither<<23
Object.assign(T, {
	REPLACE: 1114129,
	DEFAULT: 1135889,
	ADD: 1118481,
	MULTIPLY: 1122816,
	SUBTRACT: 5574929,
	REVERSE_SUBTRACT: 6689041,
	MIN: 2232593, MAX: 3346705,
	BEHIND: 1118583
})
globalThis.PI2 = PI*2
function setv(t,m){
	const s = t.stencil
	let d = pmask^m
	if(ca!=t){
		i&&draw()
		if(!t.img) gl.bindFramebuffer(36160,null),gl.viewport(0,0,gl.canvas.width,gl.canvas.height)
		else{
			if(!ca.img) gl.bindFramebuffer(36160,fb)
			if(t.tex!=fbTex||t.layer!=fbLayer) gl.framebufferTextureLayer(36160,36064,fbTex=t.tex,0,fbLayer=t.layer)
			if(t.stencilBuf!=fbSte) gl.bindRenderbuffer(36161,fbSte=t.stencilBuf),gl.framebufferRenderbuffer(36160,36128,36161,fbSte)
			const t2 = t.img.t; gl.viewport(0,0,t2.w,t2.h)
			if(t2.i>=0){
				gl.activeTexture(33984 + t2.i); gl.bindTexture(35866, bound[t2.i] = null); t2.i = -1
			}
			if(ca.stencil!=s&&!(d&240)) d^=240
		}
		ca=t
	}
	if(d){
		i&&draw()
		if(d&15) gl.colorMask(m&1,m&2,m&4,m&8)
		if(d&240){
			if(m&240){
				if(!(pmask&240)) gl.enable(2960) // STENCIL_TEST
				gl.stencilMask(1<<s)
				gl.stencilFunc(m&32?m&16?gl.NEVER:gl.NOTEQUAL:m&16?gl.EQUAL:gl.ALWAYS,255,1<<s)
				const op = m&128?m&64?gl.INVERT:gl.REPLACE:m&64?gl.ZERO:gl.KEEP
				gl.stencilOp(op, op, op)
			}else if(pmask&240) gl.disable(2960) // STENCIL_TEST
		}
		if(d&1996488704) gl.blendEquationSeparate((m>>24&7)+32773,(m>>28&7)+32773)
		if(d&16776960) gl.blendFuncSeparate((m>>8&15)+766*!!(m&3584), (m>>16&15)+766*!!(m&917504), (m>>12&15)+766*!!(m&57344), (m>>20&15)+766*!!(m&14680064))
		if(d&-2147483648) m&-2147483648 ? gl.enable(3024) : gl.disable(3024) // DITHER
		pmask = m
	}
}
function draw(b=shuniBind){
	//if((ca?ca.img.t.f[3]:0)!=sh.outInt) return console.warn('Texture drawn to and shader output type must be of the same kind (integer/float)')
	gl.bufferData(34962, iarr.subarray(0, i), 35040)
	const {type,s,l}=shp
	fd += i; i /= sh.count; fdc++; fs += i
	gl.drawArraysInstanced(type, s, l, i)
	i = 0; boundUsed = b
}
let sh=null,ca=null,fbTex=null,fbSte=null,fbLayer=0,shfCount=0,shfMask=0
const fb = gl.createFramebuffer()
const buf = gl.createBuffer()
gl.bindBuffer(34962, buf)
const maxTex = Math.min(32, gl.getParameter(34930))
const bound = []; for(let i=maxTex<<1;i>0;i--) bound.push(null)
globalThis.Geometry = (type, points) => {
	if(points.length%1) throw 'points.length is not even'
	if(!(points instanceof Float32Array)){
		T = new Float32Array(points.length)
		T.set(points, 0); points = T
	}
	const b = gl.createBuffer()
	gl.bindBuffer(34962, b)
	gl.bufferData(34962, points, 35044)
	b.type = type
	gl.bindBuffer(34962, buf)
	return {type, b, s: 0, l: points.length>>1, sub: shapeSub}
}
const shapeSub = function sub(s=0,l=this.l-s, type=this.type){
	return {type, b: this.b, s: this.s+s, l, sub}
}
let gtArr = null, maxLen=0, boundUsed = 0, shp = Geometry(TRIANGLE_STRIP, [0, 0, 0, 1, 1, 0, 1, 1]), shuniBind = 0
const defaultShape = shp
let g
const treeIf = (s=0, e=maxTex,o=0) => {
	if(e<=s+1) return g(s)
	const m = s+(1<<31-Math.clz32(e-s-1))
	return `if(u<${m+o}){${treeIf(s,m,o)}}else{${treeIf(m,e,o)}}`
}
const names = ['float','vec2','vec3','vec4','int','ivec2','ivec3','ivec4','uint','uvec2','uvec3','uvec4']
globalThis.Shader = (src, inputs, uniforms, output=4, defaults, uDefaults, frat=0.5) => {
	const fnParams = ['(function({'], fnBody = ['',''], shaderHead = ['#version 300 es\nprecision mediump float;precision highp int;in vec2 _pos;out vec2 pos,xy;in mat2x3 m;',''], shaderBody = ['void main(){gl_PointSize=1.0;gl_Position=vec4((xy=vec3(pos=_pos,1.)*m)*2.-1.,0.,1.);'], shaderHead2 = ['#version 300 es\nprecision mediump float;precision highp int;in vec2 pos,xy;uniform vec2 viewport;out '+(output==0?'highp vec4 color;':output==16||output==32?'uvec4 color;':'lowp vec4 color;'),'']
	let j = 6, o = 0, fCount = 0, iCount = 0
	const types = [3,3]
	const texCheck = []
	
	let id = 0
	inputs = typeof inputs=='number' ? [inputs] : inputs || []
	uniforms = typeof uniforms=='number' ? [uniforms] : uniforms || []
	defaults = defaults != null ? Array.isArray(defaults) ? defaults : [defaults] : []
	uDefaults = uDefaults != null ? Array.isArray(uDefaults) ? uDefaults : [uDefaults] : []
	for(const t of inputs){
		let c = (t&3)+1, n = names[t&3|t>>4<<2]
		const isCol = t==4||t==8||t==12
		defaults[id] ??= t==4?v4z:c==1?0:c==2?v2z:c==3?v3z:v4z
		fnParams.push(id+':a'+j+'=defaults['+id+'],')
		const A = t>15?(o|=1,'iarr[j+'):'arr[j+'
		if(t==20||t==24||t==28){
			n='int',o|=(1<<(t>>2)-3),fCount++
			texCheck.push(`a${j}=(img.auto(a${j+(t==24?'.t,-1':'.t,0')})+1||(i&&draw(b^boundUsed),img.auto(a${j+(t==24?'.t,-1':'.t,0')})+1))-1`)
		}
		if(t==12||t==28) o|=2
		if(t==8||t==24) iCount++,fCount--
		if(isCol){
			texCheck.push(`let a${j+1}=${t==4?`-1;if(a${j}.t&&(a${j+1}=img.auto(a${j}.t,0))==-1)`:`img.auto(a${j+(t==8?'.t,-1':'.t,0')});if(a${j+1}==-1)`}{i&&draw(b^boundUsed);a${j+1}=img.auto(a${j+(t==8?'.t,-1':'.t,0')})}`)
			fCount++
			const n = `arg${id}raw`
			shaderHead.push(`in int i${j};in vec4 i${j+1};centroid out vec4 ${n};`)
			shaderBody.push(t!=4?`${n}=vec4(i${j+1}.xy+pos*i${j+1}.zw,i${j}&255,i${j}>>8);`:`if(i${j}<0){${n}=i${j+1};${n}.w=max(-15856.,${n}.w);}else{${n}=vec4(i${j+1}.xy+pos*i${j+1}.zw,i${j}&255,i${j}<256?-15872:(i${j}>>8<<4)-16384);}`)
			shaderHead2.push(`centroid in vec4 ${n};${t==4?'lowp ':t==8?'u':'highp '}vec4 arg${id}(){`+(t==4?`if(${n}.w>-15872.)return ${n};return getCol(int(${n}.w)>>4&31,${n}.xyz);}`:t==8?`return uGetCol(int(${n}.w),${n}.xyz);}`:`return fGetCol(int(${n}.w),${n}.xyz);}`))
			o|=(1<<(t>>2)+1)
			types.push(17,4)
			fnBody.push('iarr[j+'+j+']=a'+(j+1)+'<<8|a'+j+'.l&255')
			for(c=0;++c<3;) fnBody.push(A+(j+c)+']=a'+j+'.'+' xy'[c])
			fnBody.push(`if(a${j+1}>=0)${A+(j+3)}]=a${j}.w,${A+(j+4)}]=a${j}.h;else ${A+(j+3)}]=a${j}.z,${A+(j+4)}]=a${j}.w`)
			c=5
		}else{
			shaderHead.push('in '+n+' i'+j+';flat out '+n+' arg'+id+';')
			shaderBody.push('arg'+id+'=i'+j+';')
			shaderHead2.push('flat in '+n+' arg'+id+';')
			types.push(c|t&48)
			if(c==1) fnBody.push(A+j+']=a'+j)
			else for(let c1=-1;++c1<c;) fnBody.push(A+(j+c1)+']=a'+j+'.'+'xyzw'[c1])
		}
		j += c
		id++
	}
	id = 0; let j2 = 0, j3 = 0
	const fn2Params = [], fn2Body = ['fd+=j2;if(sh!=s){i&&draw(0);shfCount=fCount;shfMask=fMask;gl.useProgram((sh=s).program);gl.bindVertexArray(s.vao)}'], fn3Body = []
	const uniTex = [], uniLocs = []
	for(const t of uniforms){
		let c = (t&3)+1, n = names[t&3|t>>4<<2]
		uDefaults[id] ??= t==4?v4z:c==1?0:c==2?v2z:c==3?v3z:v4z
		fn2Params.push('a'+j2+'=uDefaults['+id+']')
		if(t==12||t==28) o|=2
		if(t==8||t==24) iCount++,fCount--
		if(t==20||t==24||t==28){
			o|=(1<<(t>>2)-3),fCount++
			fn3Body.push(`gl.uniform1i(uniLocs[${j3}],uniTex[${uniTex.length}]?img.auto(uniTex[${uniTex.length}]${t==24?',-1':',0'}):${t==24?maxTex:0})`)
			shaderHead2.push('uniform int uni'+id+';')
			fn2Body.push(`uniTex[${uniTex.length}]=a${j2}.t`)
			uniTex.push(null)
		}else if(t==4||t==8||t==12){
			fn3Body.push(`gl.uniform1i(uniLocs[${j3++}],uniTex[${uniTex.length}]?img.auto(uniTex[${uniTex.length}]${t==8?',-1':',0'}):${t==8?maxTex:0})`)
			uniTex.push(null)
			fCount++
			const n = `uni${id}raw`
			shaderHead.push(`uniform int u${j2};uniform vec4 u${j2+1};centroid out vec4 ${n};`)
			shaderBody.push(t!=4?`${n}=vec4(u${j2+1}.xy+pos*u${j2+1}.zw,u${j2}&255,u${j2}>>8);`:`if(u${j2}<0){${n}=u${j2+1};${n}.w=max(-15856.,${n}.w);}else{${n}=vec4(u${j2+1}.xy+pos*u${j2+1}.zw,u${j2}&255,u${j2}<256?-15872:(u${j2}>>8<<4)-16384);}`)
			shaderHead2.push(`centroid in vec4 ${n};${t==4?'lowp ':t==8?'u':'highp '}vec4 uni${id}(){`+(t==4?`if(${n}.w>-15872.)return ${n};return getCol(int(${n}.w)>>4&31,${n}.xyz);}`:t==8?`return uGetCol(int(${n}.w),${n}.xyz);}`:`return fGetCol(int(${n}.w),${n}.xyz);}`))
			o|=(1<<(t>>2)+1)
			fn2Body.push(`uniTex[${uniTex.length-1}]=a${j2}.t;gl.uniform4f(uniLocs[${j3}],a${j2}.x,a${j2}.y,a${j2}.w,a${j2}.h)`)
		}else{
			shaderHead2.push('uniform '+n+' uni'+id+';')
			let args = `gl.uniform${c+(t<16?'f':t<32?'i':'ui')}(uniLocs[${j3}]`
			if(c==1) args += ',a'+j2
			else for(let c1=-1;++c1<c;) args += ',a'+j2+'.'+'xyzw'[c1]
			fn2Body.push(args+')')
		}
		j2 += c
		id++; j3++
	}
	if(fCount+iCount>16) throw 'Shaders cannot use more than 16 textures/colors'
	fCount = fCount?iCount?fCount+Math.round(frat * (maxTex-fCount-iCount)):maxTex:0
	iCount = iCount && maxTex - fCount
	g=i=>'return texture(GL_f['+i+'],p);'; T=null
	shaderHead2[1] =
		(o&20?'uniform '+(o&2?'highp':'lowp')+' sampler2DArray GL_f['+fCount+'];':'')
		+(o&8?'uniform highp usampler2DArray GL_i['+iCount+'];':'')
		+(o&4?`lowp vec4 getCol(int u,vec3 p){${T=treeIf(0,fCount)}}`:'')
		+(o&16?`highp vec4 fGetCol(int u,vec3 p){${T||treeIf(0,fCount)}}`:'')
		+(o&8?`uvec4 uGetCol(int u,vec3 p){${g=i=>'return texture(GL_i['+i+'],p);',treeIf(0,maxTex-fCount,maxTex)}}`:'')
	shaderHead2[1] +=
		(o&4?`lowp vec4 getPixel(int u,ivec3 p,int l){${g=i=>'return texelFetch(GL_f['+i+'],p,l);',T=treeIf(0,fCount)}}`:'')
		+(o&16?`highp vec4 fGetPixel(int u,ivec3 p,int l){${T||treeIf(0,fCount)}}`:'')
		+(o&8?`uvec4 uGetPixel(int u,ivec3 p,int l){${g=i=>'return texelFetch(GL_i['+i+'],p,l);',treeIf(0,maxTex-fCount,maxTex)}}`:'')
		+(o&28?`ivec3 getSize(int u,int l){${g=i=>'return textureSize(GL_'+(i<fCount?'f['+i:'i['+(i-fCount))+'],l);',T=treeIf(0,maxTex)}}`:'')
	fnBody[0] = '}){if(sh!=s){i&&draw(0);shfCount=fCount;shfMask=fMask;gl.useProgram((sh=s).program);gl.bindVertexArray(s.vao);bindUniTex()}if(shp!=this.s){i&&draw();shp=this.s}if(s.geometry!=this.s.b){gl.bindBuffer(34962,s.geometry=this.s.b);gl.vertexAttribPointer(0,2,5126,0,0,0);gl.bindBuffer(34962,buf)}const b=boundUsed^shuniBind;'+texCheck.join(';')+';const j=i;if((i=j+'+j+')>arr.length)'+(ArrayBuffer.prototype.transfer?'(arr=gtArr||new Float32Array(arr.buffer.transfer(i*8))),iarr=new Int32Array(arr.buffer)':'{const oa=arr;(arr=gtArr||new Float32Array(i*2)).set(oa,0);iarr=new Int32Array(arr.buffer)}')
	fnBody.push('return j})')
	const s = eval(fnParams.join('')+fnBody.join(';')), p = s.program = gl.createProgram()
	s.uniforms = eval(`(function(${fn2Params}){${fn2Body.join(';')};bindUniTex()})`)
	const bindUniTex = eval(`(function(){${fn3Body.join(';')};shuniBind=boundUsed})`)
	const fMask = 32-fCount&&(-1>>>fCount)
	s.outInt = (output==16||output==32)<<31
	s.uniBind = 0
	const v=gl.createShader(35633), f=gl.createShader(35632)
	shaderBody.push('}')
	gl.shaderSource(v, shaderHead.join('')+shaderBody.join(''))
	gl.compileShader(v)
	gl.shaderSource(f, src = shaderHead2.join('')+'\n'+src)
	gl.compileShader(f)
	gl.attachShader(p, v)
	gl.attachShader(p, f)
	if(T=gl.getShaderInfoLog(f)) console.warn('GLSL Error:\n'+T+'\n'+src+'\n\n'+shaderHead.join('')+shaderBody.join(''))
	gl.linkProgram(p)
	gl.useProgram(p)
	while(j3--) uniLocs.push(gl.getUniformLocation(p, 'uni'+uniLocs.length))
	for(let i = 0; i < maxTex; i++)
		gl.uniform1i(gl.getUniformLocation(p, i<fCount?'GL_f['+i+']':'GL_i['+(i-fCount)+']'), i>=fCount?maxTex+i-fCount:i)
	s.count = j
	gl.bindVertexArray(s.vao = gl.createVertexArray())
	let i1 = 1, i2 = 0
	gl.bindBuffer(34962, s.geometry = defaultShape.b)
	gl.enableVertexAttribArray(0)
	gl.vertexAttribPointer(0, 2, 5126, 0, 0, 0)
	gl.bindBuffer(34962, buf)
	for(const t of types){
		gl.enableVertexAttribArray(i1)
		if(t>>4) gl.vertexAttribIPointer(i1, t&15, (t>31)+5124, j<<2, i2)
		else gl.vertexAttribPointer(i1, t&15, 5126, 0, j<<2, i2)
		gl.vertexAttribDivisor(i1++, 1)
		i2 += (t&15)<<2
	}
	if(sh) gl.useProgram(sh.program||sh), gl.bindVertexArray(sh.vao)
	return s
}
globalThis.frameDrawCalls = 0
globalThis.frameSprites = 0
globalThis.frameData = 0
let fdc = 0, fs = 0, fd = 0
Shader.DEFAULT = sh = Shader(`void main(){color=arg0()*arg1;}`, [COLOR, VEC4], _, _, [_, vec4.one])
Shader.UINT = Shader(`void main(){color=arg0();}`, UCOLOR, _, UINT)
Shader.NONE = Shader(`void main(){color=vec4(0,0,0,1);}`)
gl.useProgram(sh.program)
gl.bindVertexArray(sh.vao)
globalThis.ctx = new can(ca={tex:gl.canvas,img:null,layer:0,stencil:0,stencilBuf:null,w:0,h:0})

export const actx = new AudioContext({latencyHint: 'interactive'})
globalThis.bgGain = actx.createGain()
bgGain.connect(actx.destination)
globalThis.masterVolume = 1
globalThis.audioOut = null
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
globalThis.step = null
globalThis.frame = null
let nextF = 0
globalThis.timeToFrame = 0
setInterval(function g(j){
	if(j) step?.()
	if(ctxFramerate<0||!gl) return
	if(gl.isContextLost?.()) return glLost()
	let now = performance.now()/1000
	if(now < nextF) return
	dt = max(.01/ctxFramerate, -(globalThis.t-(globalThis.t=now)))
	frameDrawCalls = fdc; frameSprites = fs; frameData = fd*4+fdc*24; fdc = fs = fd = 0
	ctx.clear(); ctx.reset()
	try{frame?.(dt)}catch(e){Promise.reject(e)}; i&&draw()
	if((now=performance.now()/1000) >= (nextF+=1/ctxFramerate)) setImmediate(g, 0)
	timeToFrame = now-t
}, 0, 1)
requestAnimationFrame(function f(){
	if(gl.isContextLost?.()) return glLost()
	requestAnimationFrame(f)
	i&&draw()
	pixelRatio = devicePixelRatio * ctxSupersample
	gl.canvas.style.imageRendering = ctxSupersample > 1 ? 'auto' : 'pixelated'
	gl.viewport(0, 0, ctx.t.w = gl.canvas.width = round(innerWidth*pixelRatio), ctx.t.h = gl.canvas.height = round(innerHeight*pixelRatio))
	gl.bindFramebuffer(36160,null); ca=ctx.t
	if(ctxFramerate>=0) return
	dt = max(.001, min(-(globalThis.t-(globalThis.t=performance.now()/1000)), .5))
	frameDrawCalls = fdc; frameSprites = fs; frameData = fd*4+fdc*24; fdc = fs = fd = 0
	ctx.reset(); try{frame?.(dt)}catch(e){Promise.reject(e)}; i&&draw()
	timeToFrame = performance.now()/1000-t
})