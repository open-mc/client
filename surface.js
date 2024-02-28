let gl = null, mainTarget = null
const GL = WebGL2RenderingContext.prototype
class Tex{
	constructor(){

	}
	
}

const shaderCache1 = new Map(), shaderCache2 = new Map(), programCache = new Map()

function shaderFrom(src, f = 0){
	const m = f ? shaderCache1 : shaderCache2; let sh = m.get(src)
	if(sh) return sh
	sh = gl.createShader(f ? GL.FRAGMENT_SHADER : GL.VERTEX_SHADER)
	gl.shaderSource(sh, src)
	gl.compileShader(src)
	m.set(src, sh)
	return sh
}

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

globalThis.CommandBuffer = class CommandBuffer{
	constructor(){

	}
	rect(){
		
	}
	quad(){

	}
	quad3(){
		
	}
}

class Target{

}

globalThis.setTargetCanvas = c => {
	gl = c.getContext('webgl2', {preserveDrawingBuffer: false, antialias: false})
	return mainTarget = new Target()
}

// write instructions to CommandBuffer
// execute those instructions on texture(s) or on main

const buf = new CommandBuffer()