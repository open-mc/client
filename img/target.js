{const NS = globalThis[new URL(document.currentScript.src).hash.slice(1)||'globalThis']??={}

/** @type {WebGL2RenderingContext} */
let gl = null
const GL = WebGL2RenderingContext.prototype
const UB = GL.UNSIGNED_BYTE, US = GL.UNSIGNED_SHORT, UI = GL.UNSIGNED_INT, RI = GL.RED_INTEGER, RGI = GL.RG_INTEGER, RBI = GL.RGB, RAI = GL.RGBA, HF = GL.HALF_FLOAT, F = GL.FLOAT
NS.Formats = {
	R: [GL.R8, GL.RED, UB], RG: [GL.RG8, GL.RG, UB], RGB: [RBI, RBI, UB], RGBA: [RAI, RAI, UB],
	RGB565: [GL.RGB565, RBI, GL.UNSIGNED_SHORT_5_6_5], R11F_G11F_B10F: [GL.R11F_G11F_B10F, RBI, GL.UNSIGNED_INT_10F_11F_11F_REV],
	RGB5_A1: [GL.RGB5_A1, RAI, GL.UNSIGNED_SHORT_5_5_5_1], RGB10_A2: [GL.RGB10_A2, RAI, GL.UNSIGNED_INT_2_10_10_10_REV],
	RGBA4: [GL.RGBA4, RAI, GL.UNSIGNED_SHORT_4_4_4_4], RGB9_E5: [GL.RGB9_E5, RBI, GL.UNSIGNED_INT_5_9_9_9_REV],
	R8: [GL.R8, RI, UB], RG8: [GL.RG8, RGI, UB], RGB8: [GL.RGB8, RBI, UB], RGBA8: [GL.RGBA8, RAI, UB],
	R16: [GL.R16UI, RI, US], RG16: [GL.RG16UI, RGI, US], RGB16: [GL.RGB16UI, RBI, US], RGBA16: [GL.RGBA16UI, RAI, US],
	R32: [GL.R32UI, RI, UI], RG32: [GL.RG32UI, RGI, UI], RGB32: [GL.RGB32UI, RBI, UI], RGBA32: [GL.RGBA32UI, RAI, UI],
	R16F: [GL.R16F, RI, HF], RG16F: [GL.RG16F, RGI, HF], RGB16F: [GL.RGB16F, RBI, HF], RGBA16F: [GL.RGBA16F, RAI, HF],
	R16F_32F: [GL.R16F, RI, F], RG16F_32F: [GL.RG16F, RGI, F], RGB16F_32F: [GL.RGB16F, RBI, F], RGBA16F_32F: [GL.RGBA16F, RAI, F],
	R32F: [GL.R32F, RI, F], RG32F: [GL.RG32F, RGI, F], RGB32F: [GL.RGB32F, RBI, F], RGBA32F: [GL.RGBA32F, RAI, F],
}
let defaultOptions = 0
NS.Texture = (w=0,h=0,format=NS.Formats.RGBA8,options=defaultOptions) => {
	const t = gl.createTexture()
	t.unit = -1
	t.width = 0
	t.height = 0
	t.format = format
	if(w|h) t.of(w, h, format, options)
	return t
}
NS.Texture.defaultOptions = o => defaultOptions = o
const currentlyBound = [null,null,null,null,null,null,null,null]
let currentUnit = 0
function bindt(t){
	const o = currentlyBound[currentUnit]
	if(o) o.unit = -1
	currentlyBound[currentUnit] = t
	t.unit = currentUnit
	gl.bindTexture(GL.TEXTURE_2D, t)
}
Object.assign(WebGLTexture.prototype, {
	from(thing, format = NS.Formats.RGBA8, options = defaultOptions){
		if(typeof thing != 'object') return
		this.format = format
		if(thing instanceof Blob) thing = createImageBitmap(thing,{imageOrientation:'flipY'})
		if(thing.then) return thing.then(thing => this.from(thing, format, options))
		bindt(this)
		const {0: A, 1: B, 2: C} = format
		gl.texImage2D(GL.TEXTURE_2D, 0, A, this.width = thing.width, this.height = thing.height, 0, B, C, thing)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, (~options&1)+GL.NEAREST)
		const f = (~options>>1)&3
		if(options&8) gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, (f&1)+GL.NEAREST)
		else gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_NEAREST + f)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, options&32?GL.MIRRORED_REPEAT:options&16?GL.CLAMP_TO_EDGE:GL.REPEAT)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, options&128?GL.MIRRORED_REPEAT:options&64?GL.CLAMP_TO_EDGE:GL.REPEAT)
		if(!(options&8)) gl.generateMipmap(GL.TEXTURE_2D)
		return this
	},
	put(thing, x=0, y=0){
		if(typeof thing != 'object') return
		if(thing instanceof Blob) thing = createImageBitmap(thing,{imageOrientation:'flipY'})
		if(thing.then) return thing.then(thing => this.put(thing, x, y))
		bindt(this)
		gl.texSubImage2D(GL.TEXTURE_2D, 0, x, y, thing.width, thing.height, 0, this.format[1], this.format[2], thing)
		if(gl.getTexParameter(GL.TEXTURE_2D,GL.TEXTURE_MIN_FILTER)>=GL.NEAREST_MIPMAP_NEAREST)
			gl.generateMipmap(GL.TEXTURE_2D)
		return this
	},
	options(options = defaultOptions){
		bindt(this)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, (~options&1)+GL.NEAREST)
		const f = (~options>>1)&3
		if(options&8) gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, (f&1)+GL.NEAREST)
		else{
			const o = gl.getTexParameter(GL.TEXTURE_2D,GL.TEXTURE_MIN_FILTER)
			gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_NEAREST + f)
			if(o<GL.NEAREST_MIPMAP_NEAREST)
				gl.generateMipmap(GL.TEXTURE_2D)
		}
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, options&32?GL.MIRRORED_REPEAT:options&16?GL.CLAMP_TO_EDGE:GL.REPEAT)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, options&128?GL.MIRRORED_REPEAT:options&64?GL.CLAMP_TO_EDGE:GL.REPEAT)
		return this
	},
	of(width = 0, height = 0, format = NS.Formats.RGBA8, options = defaultOptions){
		bindt(this)
		const {0: A, 1: B, 2: C} = format
		this.format = format
		gl.texStorage2D(GL.TEXTURE_2D, 1, A, this.width = width, this.height = height)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, (~options&1)+GL.NEAREST)
		const f = (~options>>1)&3
		if(options&8) gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, (f&1)+GL.NEAREST)
		else gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_NEAREST + f)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, options&32?GL.MIRRORED_REPEAT:options&16?GL.CLAMP_TO_EDGE:GL.REPEAT)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, options&128?GL.MIRRORED_REPEAT:options&64?GL.CLAMP_TO_EDGE:GL.REPEAT)
		if(!(options&8)) gl.generateMipmap(GL.TEXTURE_2D)
		return this
	},
	putData(sx=0, sy=0, sw, sh, data, format=this.format){
		bindt(this)
		gl.texSubImage2D(GL.TEXTURE_2D, 0, sx, sy, sw, sh, format[1], format[2], data)
		if(gl.getTexParameter(GL.TEXTURE_2D,GL.TEXTURE_MIN_FILTER)>=GL.NEAREST_MIPMAP_NEAREST)
			gl.generateMipmap(GL.TEXTURE_2D)
	}
	uv(x=0,y=0,w=0,h=0){ return {x:x/this.width,y:y/this.height,w:w/this.width,h:h/this.height,sub} }
})
const fpool = []
NS.CommandBuffer = () => {
	const a = []
	a.cur = fpool.pop() ?? new Float32Array(8190)
	a.i = 0
	return new M(a)
}
NS.CommandBuffer.single = (a=whole,b=0,c=0,d=0,e=0)=>NS.CommandBuffer.singleMat(a,1,0,0,1,0,0,b,c,d,e)
NS.CommandBuffer.singleRect = (a=whole,b=0,c=0,d=1,e=1,f=0,g=0,h=0,i=0)=>NS.CommandBuffer.singleMat(a,d,0,0,e,b,c,f,g,h,i)
NS.CommandBuffer.singleMat = ({x:tx,y:ty,w:tw,h:th}=whole,a=0,b=0,c=0,d=0,e=0,f=0,t1=0,t2=0,t3=0,t4=0) => {
	const x = new Float32Array(14)
	x[0] = a; x[1] = c; x[2] = e; x[3] = b; x[4] = d; x[5] = f
	x[6] = tx; x[7] = ty; x[8] = tw; x[9] = th
	x[10] = t1; x[11] = t2; x[12] = t3; x[13] = t4
	return x
}
function sub(a,b,c,d){return {x:this.x+a*this.w,y:this.y+b*this.h,w:this.w*c,h:this.h*d,sub}}
NS.uv = (x=0,y=0,w=1,h=1)=>({x,y,w,h,sub})
const whole = NS.uv()
NS._ = undefined
class M{
	arr;#a;#b;#c;#d;#e;#f
	constructor(z,a=1,b=0,c=0,d=1,e=0,f=0){this.arr=z;this.#a=a;this.#b=b;this.#c=c;this.#d=d;this.#e=e;this.#f=f}
	translate(x=0,y=0){ this.#e+=x*this.#a+y*this.#c;this.#f+=x*this.#b+y*this.#d }
	scale(x=1,y=x){ this.#a*=x; this.#b*=x; this.#c*=y; this.#d*=y }
	rotate(r=0){
		const cs = Math.cos(r), sn = Math.sin(r), a=this.#a,b=this.#b,c=this.#c,d=this.#d
		this.#a=a*cs-c*sn; this.#b=b*cs-d*sn
		this.#c=a*sn+b*cs; this.#d=b*sn+d*cs
	}
	transform(a,b,c,d,e,f){
		const ta=this.#a,tb=this.#b,tc=this.#c,td=this.#d,te=this.#e,tf=this.#f
		this.a = a*ta+c*tb; this.b = b*ta+d*tb
		this.c = a*tc+c*td; this.d = b*tc+d*td
		this.e = a*te+c*tf+e; this.f = b*te+d*tf+f
	}
	new(a=1,b=0,c=0,d=1,e=0,f=0){return new M(this.arr,a,b,c,d,e,f)}
	reset(a=1,b=0,c=0,d=1,e=0,f=0){this.#a=a;this.#b=b;this.#c=c;this.#d=d;this.#e=e;this.#f=f}
	box(x=0,y=0,w=1,h=w){ this.#e+=x*this.#a+y*this.#c; this.#f+=x*this.#b+y*this.#d; this.#a*=w; this.#b*=w; this.#c*=h; this.#d*=h }
	to(x, y){if(typeof x=='object')({x,y}=x);return {x:this.#a*x+this.#c*y+this.#e,y:this.#b*x+this.#d*y+this.#f}}
	from(x, y){
		if(typeof x=='object')({x,y}=x)
		const a=this.#a,b=this.#b,c=this.#c,d=this.#d, det = a*d - b*c
		return {
			x: (x*d - x*c + c*this.#f - d*this.#e)/det,
			y: (y*a - y*b + b*this.#e - a*this.#f)/det
		}
	}
	copy(){ return new M(this.arr,this.#a,this.#b,this.#c,this.#d,this.#e,this.#f) }
	add({x:tx,y:ty,w:tw,h:th} = whole, t1=0, t2=0, t3=0, t4=0){
		const j = (this.arr.i+=14)-14, cur = this.arr.cur
		cur[j  ] = this.#a; cur[j+1] = this.#c; cur[j+2] = this.#e
		cur[j+3] = this.#b; cur[j+4] = this.#d; cur[j+5] = this.#f
		cur[j+6] = tx; cur[j+7] = ty; cur[j+8] = tw; cur[j+9] = th
		cur[j+10] = t1; cur[j+11] = t2; cur[j+12] = t3; cur[j+13] = t4
		if(j === 8176) this.arr.push(cur), this.arr.cur = fpool.pop() ?? new Float32Array(8190),this.arr.i=0
	}
	addRect({x:tx,y:ty,w:tw,h:th} = whole, x=0, y=0, w=1, h=1, t1=0, t2=0, t3=0, t4=0){
		const j = (this.arr.i+=14)-14, cur = this.arr.cur
		cur[j  ] = this.#a*w; cur[j+1] = this.#c*h; cur[j+2] = this.#e+x*this.#a+y*this.#c
		cur[j+3] = this.#b*w; cur[j+4] = this.#d*h; cur[j+5] = this.#f+x*this.#b+y*this.#d
		cur[j+6] = tx; cur[j+7] = ty; cur[j+8] = tw; cur[j+9] = th
		cur[j+10] = t1; cur[j+11] = t2; cur[j+12] = t3; cur[j+13] = t4
		if(j === 8176) this.arr.push(cur), this.arr.cur = fpool.pop() ?? new Float32Array(8190),this.arr.i=0
	}
	addMat({x:tx,y:ty,w:tw,h:th} = whole, a=1, b=0, c=0, d=1, e=0, f=0, t1=0, t2=0, t3=0, t4=0){
		const j = (this.arr.i+=14)-14, cur = this.arr.cur
		const ta=this.#a,tb=this.#b,tc=this.#c,td=this.#d,te=this.#e,tf=this.#f
		cur[j  ] = a*ta+c*tb; cur[j+1] = a*tc+c*td; cur[j+2] = a*te+c*tf+e
		cur[j+3] = b*ta+d*tb; cur[j+4] = b*tc+d*td; cur[j+5] = b*te+d*tf+f
		cur[j+6] = tx; cur[j+7] = ty; cur[j+8] = tw; cur[j+9] = th
		cur[j+10] = t1; cur[j+11] = t2; cur[j+12] = t3; cur[j+13] = t4
		if(j === 8176) this.arr.push(cur), this.arr.cur = fpool.pop() ?? new Float32Array(8190),this.arr.i=0
	}
	upload(){
		const b = gl.createBuffer()
		gl.bindBuffer(GL.ARRAY_BUFFER, b)
		const L = this.arr.length*32760+(this.arr.i<<2)
		gl.bufferData(GL.ARRAY_BUFFER, L, GL.STATIC_DRAW)
		let i = 0
		for(;i<this.arr.length;i++)
			gl.bufferSubData(GL.ARRAY_BUFFER, i*32760, this.arr[i])
		gl.bufferSubData(GL.ARRAY_BUFFER, i*32760, this.arr.cur, 0, this.arr.i)
		const v = gl.createVertexArray()
		gl.bindVertexArray(bvo = v)
		gl.vertexAttribPointer(0, 3, F, false, 56, 0)
		gl.vertexAttribPointer(1, 3, F, false, 56, 12)
		gl.vertexAttribPointer(2, 4, F, false, 56, 24)
		gl.vertexAttribPointer(3, 4, F, false, 56, 40)
		for(let i = 0; i < 4; i++){
			gl.enableVertexAttribArray(i)
			gl.vertexAttribDivisor(i, 1)
		}
		v.count = L/56
		if(fpool.length < 128) fpool.push(this.arr.cur); this.arr.cur = null
		for(let i = Math.min(this.arr.length); i >= 0; i--) fpool.push(this.arr[i])
		this.arr.length = 0
		return v
	}
	get count(){ return this.arr.length*585+this.arr.i/14 }
}
const mat2x3 = new Float32Array(6)
let fb = null
let mainStencil = 0
let pmask = 285217039
let ux=0, uy=0, uz=0, uw=0, vx=0, vy=0, vz=0, vw=0
let warns = -1
let vpw = 0, vph = 0
class Target{
	fb;#a;#b;#c;#d;#e;#f;#ux;#uy;#uz;#uw;#vx;#vy;#vz;#vw
	get width(){return this.fb?this.fb.width:gl.canvas.width}
	get height(){return this.fb?this.fb.height:gl.canvas.height}
	get texture(){return this.fb?.texture}
	getData(x=0,y=0,w=this.width,h=this.height,arr=null){
		gl.bindFramebuffer(GL.READ_FRAMEBUFFER, this.fb)
		const f = this.fb?this.fb.format[2]:UB
		if(!arr){
			const a = this.fb?this.fb.format[0]:GL.RGBA8
			const S = (a==GL.RGBA||a==GL.RGBA8||a==GL.RGBA16UI||a==GL.RGBA32UI||a==GL.RGBA16F||a==GL.RGBA32F?4:a==GL.RGB||a==GL.RGB8||a==GL.RGB16UI||a==GL.RGB32UI||a==GL.RGB16F||a==GL.RGB32F?3:a==GL.RG8||a==GL.RG16UI||a==GL.RG32UI||a==GL.RG16F||a==GL.RG32F?2:1)*w*h
			arr = f==UB?new Uint8Array(S):f==F?new Float32Array(S):f==UI||f==GL.UNSIGNED_INT_10F_11F_11F_REV||f==GL.UNSIGNED_INT_2_10_10_10_REV||f==GL.UNSIGNED_INT_5_9_9_9_REV?new Uint32Array(S):new Uint16Array(S)
		}
		gl.readPixels(x,y,w,h,this.fb?this.fb.format[1]:GL.RGBA,f,arr)
		return arr
	}
	resize(width = this.width, height = this.height, format = NS.Formats.RGBA8){
		if(this.fb){
			this.fb.texture = null
			gl.bindFramebuffer(GL.READ_FRAMEBUFFER, this.fb)
			const s = gl.createRenderbuffer()
			gl.bindRenderbuffer(GL.RENDERBUFFER, s)
			gl.renderbufferStorage(GL.RENDERBUFFER, format[0], w, h)
			gl.framebufferRenderbuffer(GL.READ_FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.RENDERBUFFER, s)
			if(this.fb.stencil>=0){
				const s = gl.createRenderbuffer()
				gl.bindRenderbuffer(GL.RENDERBUFFER, s)
				gl.renderbufferStorage(GL.RENDERBUFFER, GL.STENCIL_INDEX8, width, height)
				gl.framebufferRenderbuffer(GL.READ_FRAMEBUFFER, GL.STENCIL_ATTACHMENT, GL.RENDERBUFFER, s)
			}
		}else{
			gl.canvas.width = width
			gl.canvas.height = height
			// No universal support, but too cool to miss out
			if(gl.drawingBufferStorage) gl.drawingBufferStorage(format[0], width, height)
			else if(warns&(format!=NS.Formats.RGBA8)) warns&=-2,console.warn('Browser does not support specifying format for main target')
		}
	}
	setTexture(tex){
		if(!this.fb) throw new TypeError('Cannot attach a texture to the main target (its output must always be the <canvas>, use .resize() to change size/format)')
		gl.bindFramebuffer(GL.READ_FRAMEBUFFER, this.fb)
		if(this.fb.texture === tex){
			this.fb.width = tex.width
			this.fb.height = tex.height
			if(this.fb.stencil>=0){
				const s = gl.createRenderbuffer()
				gl.bindRenderbuffer(GL.RENDERBUFFER, s)
				gl.renderbufferStorage(GL.RENDERBUFFER, GL.STENCIL_INDEX8, tex.width, tex.height)
				gl.framebufferRenderbuffer(GL.READ_FRAMEBUFFER, GL.STENCIL_ATTACHMENT, GL.RENDERBUFFER, s)
			}
			return
		}
		this.fb.texture = tex
		this.fb.width = tex.width
		this.fb.height = tex.height
		gl.framebufferTexture2D(GL.READ_FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, tex, 0)
		if(this.fb.stencil>=0){
			const s = gl.createRenderbuffer()
			gl.bindRenderbuffer(GL.RENDERBUFFER, s)
			gl.renderbufferStorage(GL.RENDERBUFFER, GL.STENCIL_INDEX8, tex.width, tex.height)
			gl.framebufferRenderbuffer(GL.READ_FRAMEBUFFER, GL.STENCIL_ATTACHMENT, GL.RENDERBUFFER, s)
		}
	}
	constructor(fb,a=1,b=0,c=0,d=1,e=0,f=0,ux=0,uy=0,uz=0,uw=0,vx=0,vy=0,vz=0,vw=0){
		this.fb=fb
		this.#a=a;this.#b=b;this.#c=c;this.#d=d;this.#e=e;this.#f=f
		this.#ux=ux;this.#uy=uy;this.#uz=uz;this.#uw=uw
		this.#vx=vx;this.#vy=vy;this.#vz=vz;this.#vw=vw
	}
	translate(x=0,y=0){ this.#e+=x*this.#a+y*this.#c;this.#f+=x*this.#b+y*this.#d }
	scale(x=1,y=x){ this.#a*=x; this.#b*=x; this.#c*=y; this.#d*=y }
	rotate(r=0){
		const cs = Math.cos(r), sn = Math.sin(r), a=this.#a,b=this.#b,c=this.#c,d=this.#d
		this.#a=a*cs-c*sn; this.#b=b*cs-d*sn
		this.#c=a*sn+b*cs; this.#d=b*sn+d*cs
	}
	transform(a,b,c,d,e,f){
		const ta=this.#a,tb=this.#b,tc=this.#c,td=this.#d,te=this.#e,tf=this.#f
		this.a = a*ta+c*tb; this.b = b*ta+d*tb
		this.c = a*tc+c*td; this.d = b*tc+d*td
		this.e = a*te+c*tf+e; this.f = b*te+d*tf+f
	}
	new(a=1,b=0,c=0,d=1,e=0,f=0){return new Target(this.fb,a,b,c,d,e,f)}
	reset(a=1,b=0,c=0,d=1,e=0,f=0,ux=0,uy=0,uz=0,uw=0,vx=0,vy=0,vz=0,vw=0){this.#a=a;this.#b=b;this.#c=c;this.#d=d;this.#e=e;this.#f=f;this.#ux=ux;this.#uy=uy;this.#uz=uz;this.#uw=uw;this.#vx=vx;this.#vy=vy;this.#vz=vz;this.#vw=vw}
	box(x=0,y=0,w=1,h=w){ this.#e+=x*this.#a+y*this.#c; this.#f+=x*this.#b+y*this.#d; this.#a*=w; this.#b*=w; this.#c*=h; this.#d*=h }
	to(x, y){if(typeof x=='object')({x,y}=x);return {x:this.#a*x+this.#c*y+this.#e,y:this.#b*x+this.#d*y+this.#f}}
	from(x, y){
		if(typeof x=='object')({x,y}=x)
		const a=this.#a,b=this.#b,c=this.#c,d=this.#d, det = a*d - b*c
		return {
			x: (x*d - x*c + c*this.#f - d*this.#e)/det,
			y: (y*a - y*b + b*this.#e - a*this.#f)/det
		}
	}
	copy(){ return new Target(this.fb,this.#a,this.#b,this.#c,this.#d,this.#e,this.#f,this.#ux,this.#uy,this.#uz,this.#uw,this.#vx,this.#vy,this.#vz,this.#vw) }
	uniform1(ux=0,uy=0,uz=0,uw=0){this.#ux=ux;this.#uy=uy;this.#uz=uz;this.#uw=uw}
	uniform2(vx=0,vy=0,vz=0,vw=0){this.#vx=vx;this.#vy=vy;this.#vz=vz;this.#vw=vw}
	clear(r = 0, g = 0, b = 0, a = 0){
		gl.clearColor(r, g, b, a)
		pmask = (pmask&240)|(r==r)|(g==g)<<1|(b==b)<<2|(a==a)<<3
		gl.colorMask(pmask&1,pmask&2,pmask&4,pmask&8)
		let mask = GL.COLOR_BUFFER_BIT
		if(this.fb) if(++this.fb.stencil>=8) this.fb.stencil=0,mask|=GL.STENCIL_BUFFER_BIT
		else if(++mainStencil>=8) mainStencil=0,mask|=GL.STENCIL_BUFFER_BIT
		gl.stencilMask(1<<(this.fb?this.fb.stencil:mainStencil))
		if(fb!=this.fb) gl.bindFramebuffer(GL.FRAMEBUFFER, fb = this.fb)
		gl.clear(mask)
	}
	clearColor(r = 0, g = 0, b = 0, a = 0){
		gl.clearColor(r, g, b, a)
		pmask = (pmask&240)|(r==r)|(g==g)<<1|(b==b)<<2|(a==a)<<3
		gl.colorMask(pmask&1,pmask&2,pmask&4,pmask&8)
		if(fb!=this.fb) gl.bindFramebuffer(GL.FRAMEBUFFER, fb = this.fb)
		gl.clear(GL.COLOR_BUFFER_BIT)
	}
	clearStencil(){
		if(this.fb) if(++this.fb.stencil>=8){
			this.fb.stencil=0
			if(fb!=this.fb) gl.bindFramebuffer(GL.FRAMEBUFFER, fb = this.fb)
			gl.clear(GL.STENCIL_BUFFER_BIT)
		}else if(++mainStencil>=8){
			mainStencil=0
			if(fb!=this.fb) gl.bindFramebuffer(GL.FRAMEBUFFER, fb = this.fb)
			gl.clear(GL.STENCIL_BUFFER_BIT)
		}
		gl.stencilMask(1<<(this.fb?this.fb.stencil:mainStencil))
	}
	draw(buf, textures, mask = 15, blend = 1135940){
		const W = this.fb?this.fb.width:gl.canvas.width, H = this.fb?this.fb.height:gl.canvas.height
		if(!W|!H) return
		if(vpw!=W||vph!=H) gl.viewport(0,0,W,H)
		mat2x3[0] = this.#a*2; mat2x3[3] = this.#b*2; mat2x3[1] = this.#c*2
		mat2x3[4] = this.#d*2; mat2x3[2] = this.#e*2-1; mat2x3[5] = this.#f*2-1
		if(fb!=this.fb) gl.bindFramebuffer(GL.FRAMEBUFFER, fb = this.fb)
		let b = this.fb?.texture?.unit??-1
		if(b>-1){
			if(currentUnit != b) gl.activeTexture(GL.TEXTURE0+(currentUnit=b))
			gl.bindTexture(GL.TEXTURE_2D, null)
			this.fb.texture.unit = -1
		}
		gl.uniformMatrix2x3fv(curProgram.muni, false, mat2x3)
		if(ux!=this.#ux||uy!=this.#uy||uz!=this.#uz||uw!=this.#uw)
			gl.uniform4f(curProgram.uni1, ux=this.#ux, uy=this.#uy, uz=this.#uz, uw=this.#uw)
		if(vx!=this.#vx||vy!=this.#vy||vz!=this.#vz||vw!=this.#vw)
			gl.uniform4f(curProgram.uni2, vx=this.#vx, vy=this.#vy, vz=this.#vz, vw=this.#vw)
		mask = mask&2281701631|blend<<8
		if((pmask^mask)&15) gl.colorMask(mask&1,mask&2,mask&4,mask&8)
		if((pmask^mask)&496){
			if(mask&240){
				const s = fb?fb.stencil:mainStencil
				if(!(pmask&240)) gl.enable(GL.STENCIL_TEST)
				if((mask^pmask)&240){
					gl.stencilFunc(mask&32?mask&16?GL.NEVER:GL.NOTEQUAL:mask&16?GL.EQUAL:GL.ALWAYS, 255, 1<<s)
					const op = mask&128?mask&64?GL.INVERT:GL.REPLACE:mask&64?GL.ZERO:GL.KEEP
					gl.stencilOp(op, op, op)
				}
			}else if(pmask&240) gl.disable(GL.STENCIL_TEST)
		}
		if((pmask^mask)&1996488704) gl.blendEquationSeparate((mask>>24&7)+32773,(mask>>28&7)+32773)
		if((pmask^mask)&16776960) gl.blendFuncSeparate((mask>>8&15)+766*!!(mask&3584), (mask>>16&15)+766*!!(mask&917504), (mask>>12&15)+766*!!(mask&57344), (mask>>20&15)+766*!!(mask&14680064))
		if((mask^pmask)&134217728) if(mask&134217728) gl.enable(GL.DITHER); else gl.disable(GL.DITHER)
		pmask = mask
		if(Array.isArray(textures)){
			if(textures.length > 8) throw new RangeError('.draw(): Cannot use more than 8 textures at a time')
			let av = 255
			for(let i = 0; i < textures.length; i++){
				const t = textures[i]
				if(t.unit > -1) av &= -129>>t.unit, gl.uniform1i(curProgram.tunis[i], t.unit)
			}
			for(let i = 0; i < textures.length; i++){
				const t = textures[i]
				if(t.unit > -1) continue
				currentUnit = Math.clz32(av)-24
				av &= -129>>currentUnit
				gl.activeTexture(GL.TEXTURE0+currentUnit)
				bindt(t)
				gl.uniform1i(curProgram.tunis[i], currentUnit)
			}
		}else if(textures){
			if(textures.unit > -1) gl.uniform1i(curProgram.tunis[0], textures.unit)
			else{
				if(currentUnit != 0) gl.activeTexture(GL.TEXTURE0+(currentUnit=0))
				bindt(textures)
				gl.uniform1i(curProgram.tunis[0], 0)
			}
		}
		if(buf instanceof WebGLVertexArrayObject){
			if(bvo != buf) gl.bindVertexArray(bvo = buf)
			gl.drawArraysInstanced(GL.TRIANGLE_STRIP, 0, 4, buf.count)
		}else if(buf.byteLength){
			gl.bindBuffer(GL.ARRAY_BUFFER, glbuf)
			if(bvo != vbo) gl.bindVertexArray(bvo = vbo)
			gl.bufferData(GL.ARRAY_BUFFER, buf, GL.STREAM_DRAW)
			gl.drawArraysInstanced(GL.TRIANGLE_STRIP, 0, 4, buf.length/14)
		}else{
			gl.bindBuffer(GL.ARRAY_BUFFER, glbuf)
			if(bvo != vbo) gl.bindVertexArray(bvo = vbo)
			for(let i = 0; i < buf.arr.length; i++){
				gl.bufferData(GL.ARRAY_BUFFER, buf.arr[i], GL.STREAM_DRAW)
				gl.drawArraysInstanced(GL.TRIANGLE_STRIP, 0, 4, 585)
			}
			gl.bufferData(GL.ARRAY_BUFFER, buf.arr.cur, GL.STREAM_DRAW)
			gl.drawArraysInstanced(GL.TRIANGLE_STRIP, 0, 4, buf.arr.i/14)
		}
	}
}
let bvo = null, glbuf, vbo, curProgram
NS.setTargetCanvas = c => {
	gl = c.getContext('webgl2', {preserveDrawingBuffer: false, antialias: false, depth: false, premultipliedAlpha: true, stencil: true})
	gl.pixelStorei(37440, 1) // flip y
	gl.pixelStorei(37441, 1) // premultiplied alpha
	glbuf = gl.createBuffer()
	gl.bindBuffer(GL.ARRAY_BUFFER, glbuf)
	gl.bufferData(GL.ARRAY_BUFFER, 32760, GL.STREAM_DRAW)
	vbo = gl.createVertexArray()
	gl.bindVertexArray(bvo = vbo)
	gl.vertexAttribPointer(0, 3, F, false, 56, 0)
	gl.vertexAttribPointer(1, 3, F, false, 56, 12)
	gl.vertexAttribPointer(2, 4, F, false, 56, 24)
	gl.vertexAttribPointer(3, 4, F, false, 56, 40)
	for(let i = 0; i < 4; i++){
		gl.enableVertexAttribArray(i)
		gl.vertexAttribDivisor(i, 1)
	}
	defaultProgram = NS.Shader(`void main(){
		color = texture(tex1, uv)*(1.-tint);
	}`)
	gl.useProgram(curProgram = defaultProgram)
	gl.clearStencil(0)
	gl.stencilMask(1)
	gl.disable(GL.DEPTH_TEST)
	gl.enable(GL.BLEND)
	gl.disable(GL.DITHER)
	for(const ext of ['EXT_color_buffer_float', 'EXT_color_buffer_half_float']) gl.getExtension(ext)
	fb = bvo = null
	mainStencil = 0
	pmask = 285217039
	ux=0, uy=0, uz=0, uw=0, vx=0, vy=0, vz=0, vw=0
	return new Target(null)
}
Object.assign(NS, {
	R: 1, G: 2, B: 4, A: 8,
	RGB: 7, RGBA: 15,
	CLIP_ZERO: 16,
	CLIP_ONE: 32,
	NO_DRAW: 48,
	UNSET: 64,
	SET: 128,
	FLIP: 192,
	DITHERING: 134217728,
	ONE: 17,
	RGB_ONE: 1,
	A_ONE: 16,
	SRC_COLOR: 34,
	RGB_SRC_COLOR: 2,
	ONE_MINUS_SRC_COLOR: 51,
	RGB_ONE_MINUS_SRC_COLOR: 3,
	SRC_ALPHA: 68,
	RGB_SRC_ALPHA: 4,
	A_SRC: 64,
	ONE_MINUS_SRC_ALPHA: 85,
	RGB_ONE_MINUS_SRC_ALPHA: 5,
	A_ONE_MINUS_SRC: 80,
	DST_COLOR: 136,
	RGB_DST_COLOR: 8,
	ONE_MINUS_DST_COLOR: 153,
	RGB_ONE_MINUS_DST_COLOR: 9,
	DST_ALPHA: 102,
	RGB_DST_ALPHA: 6,
	A_DST: 96,
	ONE_MINUS_DST_ALPHA: 119,
	RGB_ONE_MINUS_DST_ALPHA: 7,
	A_ONE_MINUS_DST: 112,
	SRC_ALPHA_SATURATE: 170,
	RGB_SRC_ALPHA_SATURATE: 10,

	ADD: 17,
	RGB_ADD: 1,
	A_ADD: 16,
	SUBTRACT: 85,
	RGB_SUBTRACT: 5,
	SUBTRACT: 80,
	REVERSE_SUBTRACT: 102,
	RGB_REVERSE_SUBTRACT: 6,
	A_REVERSE_SUBTRACT: 96,
	MIN: 34,
	RGB_MIN: 2,
	A_MIN: 32,
	MAX: 51,
	RGB_MAX: 3,
	A_MAX: 48,

	UPSCALE_PIXELATED: 1, DOWNSCALE_PIXELATED: 2, DOWNSCALE_MIPMAP_NEAREST: 4,
	PIXELATED: 7, NO_MIPMAPS: 8,
	CLAMP_X: 16, REPEAT_MIRRORED_X: 32, CLAMP_Y: 64, REPEAT_MIRRORED_Y: 128
})
NS.Blend = (src = 17, dst = 0, combine = 17) => src|dst<<8|combine<<16
NS.Blend.REPLACE = 1114129
NS.PI ??= Math.PI
NS.colorSpace = space => {gl.drawingBufferColorSpace = space}

NS.Target = (w = 0, h = 0, format = NS.Formats.RGBA8, no_stencil = false) => {
	const t = gl.createFramebuffer()
	gl.bindFramebuffer(GL.READ_FRAMEBUFFER, t)
	t.stencil = NaN
	t.texture = null
	if(typeof w == 'boolean') no_stencil = w, w = 0
	if(typeof w == 'object'){
		t.texture = w; no_stencil = h; format = t.texture.format
		t.width = w = t.texture.width; t.height = h = t.texture.height
		t.stencil = 0
		bindt(t.texture)
		gl.framebufferTexture2D(GL.READ_FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, t.texture, 0)
	}else{
		t.width = w; t.height = h
		const s = gl.createRenderbuffer()
		gl.bindRenderbuffer(GL.RENDERBUFFER, s)
		gl.renderbufferStorage(GL.RENDERBUFFER, format[0], w, h)
		gl.framebufferRenderbuffer(GL.READ_FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.RENDERBUFFER, s)
	}
	if(!no_stencil){
		const s = gl.createRenderbuffer()
		gl.bindRenderbuffer(GL.RENDERBUFFER, s)
		gl.renderbufferStorage(GL.RENDERBUFFER, GL.STENCIL_INDEX8, w, h)
		gl.framebufferRenderbuffer(GL.READ_FRAMEBUFFER, GL.STENCIL_ATTACHMENT, GL.RENDERBUFFER, s)
		t.stencil = 0
	}
	return new Target(t)
}

NS.Shader = src => {
	const p = gl.createProgram()
	const vert = gl.createShader(GL.VERTEX_SHADER)
	gl.shaderSource(vert, `#version 300 es
uniform mat2x3 global;
layout(location=0) in mat2x3 m; layout(location=2) in vec4 _uv; layout(location=3) in vec4 _tint;
out vec2 uv; out vec4 tint;
void main(){
	vec3 p = vec3(gl_VertexID&1, gl_VertexID>>1,1.);
	gl_Position = vec4(vec3(p*m,1.)*global,0.,1.);
	uv = _uv.xy + p.xy*_uv.zw; tint = _tint;
}`)
	gl.compileShader(vert)
	const frag = gl.createShader(GL.FRAGMENT_SHADER)
	gl.shaderSource(frag, `#version 300 es
	precision mediump float;
in vec2 uv; in vec4 tint; out vec4 color; uniform sampler2D tex1, tex2, tex3, tex4, tex5, tex6, tex7, tex8; uniform vec4 u1, u2;
`+src)
	gl.compileShader(frag)
	const err = gl.getShaderInfoLog(frag)
	if(err){
		console.warn('GLSL error:\n',err)
		gl.shaderSource(frag, `#version 300 es
precision mediump float;
in vec2 uv; in vec4 tint; out vec4 color; uniform sampler2D tex1, tex2, tex3, tex4, tex5, tex6, tex7, tex8; uniform vec4 u1, u2;
void main(){color=vec4(0,0,0,1);}`)
		gl.compileShader(frag)
	}
	gl.attachShader(p, vert)
	gl.attachShader(p, frag)
	gl.linkProgram(p)
	p.muni = gl.getUniformLocation(p, 'global')
	p.uni1 = gl.getUniformLocation(p, 'u1')
	p.uni2 = gl.getUniformLocation(p, 'u2')
	p.tunis = Array.from({length:8},(_,i) => gl.getUniformLocation(p,'tex'+(i+1)))
	return p
}
NS.useShader = (p=defaultProgram) => {
	const o = curProgram
	if(o!=p) gl.useProgram(curProgram = p)
	return o
}
let defaultProgram
}