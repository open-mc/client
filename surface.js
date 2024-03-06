let gl = null, mainTarget = null
const GL = WebGL2RenderingContext.prototype
globalThis.Options = {
	UPSCALE_PIXELATED: 1, DOWNSCALE_PIXELATED: 2, DOWNSCALE_MIPMAP_PIXELATED: 4,
	PIXELATED: 7, NO_MIPMAPS: 8,
	CLAMP_X: 16, REPEAT_MIRRORED_X: 32, CLAMP_Y: 64, REPEAT_MIRRORED_Y: 128
}
const UB = GL.UNSIGNED_BYTE, US = GL.UNSIGNED_SHORT, UI = GL.UNSIGNED_INT, RI = GL.RED_INTEGER, RGI = GL.RG_INTEGER, RBI = GL.RGB, RAI = GL.RGBA, HF = GL.HALF_FLOAT, F = GL.FLOAT
globalThis.Formats = {
	R: [GL.R8, GL.RED, UB], RG: [GL.RG8, GL.RG, UB], RGB: [GL.RGB, GL.RGB, UB], RGBA: [GL.RGBA, GL.RGBA, UB],
	RGB565: [GL.RGB565, GL.RGB, GL.UNSIGNED_SHORT_5_6_5], R11F_G11F_B10F: [GL.R11F_G11F_B10F, GL.RGB, GL.UNSIGNED_INT_10F_11F_11F_REV],
	RGB5_A1: [GL.RGB5_A1, GL.RGBA, GL.UNSIGNED_SHORT_5_5_5_1], RGB10_A2: [GL.RGB10_A2, GL.RGBA, GL.UNSIGNED_INT_2_10_10_10_REV],
	RGBA4: [GL.RGBA4, GL.RGBA, GL.UNSIGNED_SHORT_4_4_4_4], RGB9_E5: [GL.RGB9_E5, GL.RGB, GL.UNSIGNED_INT_5_9_9_9_REV],
	R8: [GL.R8, RI, UB], RG8: [GL.RG8, RGI, UB], RGB8: [GL.RGB8, RBI, UB], RGBA8: [GL.RGBA8, RAI, UB],
	R16: [GL.R16, RI, US], RG16: [GL.RG16, RGI, US], RGB16: [GL.RGB16, RBI, US], RGBA16: [GL.RGBA16, RAI, US],
	R32: [GL.R32, RI, UI], RG32: [GL.RG32, RGI, UI], RGB32: [GL.RGB32, RBI, UI], RGBA32: [GL.RGBA32, RAI, UI],
	R16F: [GL.R16F, RI, HF], RG16F: [GL.RG16F, RGI, HF], RGB16F: [GL.RGB16F, RBI, HF], RGBA16F: [GL.RGBA16F, RAI, HF],
	R32F: [GL.R32F, RI, F], RG32F: [GL.RG32F, RGI, F], RGB32F: [GL.RGB32F, RBI, F], RGBA32F: [GL.RGBA32F, RAI, F],
}
globalThis.Texture = () => gl.createTexture()
Object.assign(WebGLTexture.prototype, {
	from(thing, format = Formats.RGBA8, options = 0){
		if(typeof thing != 'object') return
		if(thing instanceof Blob) thing = createImageBitmap(thing)
		if(thing.then) thing.then(thing => this.from(thing, format, options))
		gl.bindTexture(GL.TEXTURE_2D, this)
		const {0: A, 1: B, 2: C} = format
		gl.texImage2D(GL.TEXTURE_2D, 0, A, thing.width, thing.height, 0, B, C, thing)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, (options&1)+GL.NEAREST)
		const f = (~options>>1)&3
		if(options&8) gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, (f&1)+GL.NEAREST)
		else gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_NEAREST + f)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, options&32?GL.MIRRORED_REPEAT:options&16?GL.CLAMP_TO_EDGE:GL.REPEAT)
		gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, options&128?GL.MIRRORED_REPEAT:options&64?GL.CLAMP_TO_EDGE:GL.REPEAT)
		gl.generateMipmap(GL.TEXTURE_2D)
	}
})

const shaderCache = new Map()

function shaderFrom(src, f = 0){
	let sh = shaderCache.get(src)
	if(sh) return sh
	sh = gl.createShader(f ? GL.FRAGMENT_SHADER : GL.VERTEX_SHADER)
	gl.shaderSource(sh, src)
	gl.compileShader(src)
	shaderCache.set(src, sh)
	return sh
}
`
#version 300 es
uniform mat3x2 global;
in mat3x2 m; in vec4 uv;
out vec2 pos;
void main(){
	vec2 p = vec2(gl_VertexID&1, gl_VertexID>>1);
	gl_Position = p*m*global;
	pos = p;
}
`
class Program{
	constructor(a, b){
		const p = gl.createProgram()
		const v = shaderFrom(a, 0)
		const f = shaderFrom(b, 1)
		gl.attachShader(p, v)
		gl.attachShader(p, f)
		gl.linkProgram(p)
		if(!gl.getProgramParameter(p, gl.LINK_STATUS))
			throw gl.getProgramInfoLog(p)
	}
}
const BATCH_SIZE = 128
globalThis.CommandBuffer = () => new M([],2,0,0,2,-1,-1)
class M{
	#arr;#a;#b;#c;#d;#e;#f
	constructor(z,a=1,b=0,c=0,d=1,e=0,f=0){this.#arr=z;this.#a=a;this.#b=b;this.#c=c;this.#d=d;this.#e=e;this.#f=f}
	translate(x=0,y=0){ this.#e+=x*this.#a+y*this.#c;this.#f+=x*this.#b+y*this.#d }
	scale(x=1,y=x){ this.#a*=x; this.#b*=y; this.#c*=x; this.#d*=y }
	// cs sn
	//-sn cs
	rotate(r=0){
		const cs = Math.cos(r), sn = Math.sin(r), {a,b,c,d} = this
		this.#a=a*cs-c*sn; this.#b=b*cs-d*sn
		this.#c=a*sn+b*cs; this.#d=b*sn+d*cs
	}
	box(x=0,y=0,w=1,h=w){ this.#a*=x; this.#b*=y; this.#c*=x; this.#d*=y; this.#e+=x*this.#a+y*this.#c; this.#f+=x*this.#b+y*this.#d }
	to(x, y){return {x:this.#a*x+this.#c*y+this.#e,y:this.#b*x+this.#d*y+this.#f}}
	copy(){ return new M(this.#arr,this.#a,this.#b,this.#c,this.#d,this.#e,this.#f) }
	add(a,b,c,d){

	}
}

class Target{
	draw(){
		
	}
}

globalThis.setTargetCanvas = c => {
	gl = c.getContext('webgl2', {preserveDrawingBuffer: false, antialias: false, depth: false})
	gl.pixelStorei(37440, 1) // pixel unpack flip y
	return mainTarget = new Target()
}

// viewport(4), blend(7)
// R | G | B | A | TEST | PASS_UNSET | FAIL_SET