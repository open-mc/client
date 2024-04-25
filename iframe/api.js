import { BitField } from './bitfield.js'
export const _cbs = []
export const _mouseMoveCb = []
export const _joypadMoveCbs = {}
export const _wheelCb = []
export const _renderPhases = []
export const _optionListeners = {}

export let W2 = 0, H2 = 0, W = 0, H = 0, SCALE = 1

const can = document.createElement('canvas')
can.style = 'transform-origin:top left; position: fixed; top: 0; left: 0; z-index: 0'
document.body.append(can)
export const ctx = setTargetCanvas(can)
export function _recalcDimensions(camZ){
	if(ctx.gl.isContextLost?.()){
		if(!ctx.gl.canvas.parentElement) return
		ctx.gl.canvas.remove()
		document.body.textContent = 'WebGL2 context lost :('
		document.body.style = 'color:white;background:#000;text-align:center;line-height:90vh;font-size:30px;font-family:monospace;'
		return
	}
	const dpx = devicePixelRatio * 2**(options.supersample*6-3)
	ctx.gl.canvas.style.transform = 'scale('+1/dpx+')'
	SCALE = camZ * TEX_SIZE * dpx
	W2 = (W = round(visualViewport.width * visualViewport.scale * dpx)+1&-2) / SCALE / 2
	H2 = (H = round(visualViewport.height * visualViewport.scale * dpx)+1&-2) / SCALE / 2
	if(W != ctx.width || H != ctx.height) ctx.resize(W, H)
	else ctx.reset()
}

export function renderLayer(prio, fn){
	let i = _renderPhases.push(null) - 2
	while(i >= 0 && _renderPhases[i].prio > prio){
		_renderPhases[i + 1] = _renderPhases[i]
		i--
	}
	fn.prio = prio
	fn.coordSpace = 'world'
	i++
	_renderPhases[i] = fn
}
export function uiLayer(prio, fn){
	let i = _renderPhases.push(null) - 2
	while(i >= 0 && _renderPhases[i].prio > prio){
		_renderPhases[i + 1] = _renderPhases[i]
		i--
	}
	fn.prio = prio
	fn.coordSpace = 'ui'
	i++
	_renderPhases[i] = fn
}
export function drawPhase(prio, fn){
	let i = _renderPhases.push(null) - 2
	while(i >= 0 && _renderPhases[i].prio > prio){
		_renderPhases[i + 1] = _renderPhases[i]
		i--
	}
	fn.prio = prio
	fn.coordSpace = 'none'
	i++
	_renderPhases[i] = fn
}

export function toBlockExact(c, bx, by){
	const a = round(ifloat((bx&-64)-cam.x)*SCALE), b = round(((bx&-64)+64-cam.x)*SCALE)
	const d = round(ifloat((by&-64)-cam.y)*SCALE), e = round(((by&-64)+64-cam.y)*SCALE)
	c.reset(SCALE, 0, 0, -SCALE, W/2, H/2)
	c.rotate(-cam.f)
	c.translate(round(a+ifloat(b-a)*(bx&63)/64)/SCALE, round(d+ifloat(e-d)*(by&63)/64)/SCALE)
}



export const onwheel = cb => _wheelCb.push(cb)
export const onmousemove = cb => _mouseMoveCb.push(cb)
export const onjoypad = (i, cb) => (_joypadMoveCbs[i]??=[]).push(cb)

export const button = (...keys) => {
	const cb = keys.pop()
	for(const key of keys)
		(_cbs[key] || (_cbs[key] = [])).push(cb)
}

buttons = new BitField()
changed = new BitField()
delta = {mx: 0, my: 0, jlx: 0, jly: 0, jrx: 0, jry: 0}
cursor = {...delta}

export const options = {}
globalThis.options = options

export const listen = (...keys) => {
	const cb = keys.pop()
	for(const key of keys){
		(_optionListeners[key] || (_optionListeners[key] = [])).push(cb)
		if(key in options) cb(options[key])
	}
}
export let _paused = false, paused = false
export function _updatePaused(a){ if(a!==undefined) _paused=a; if(paused^_paused) postMessage(_paused=paused, '*') }
export const pause = (_paused=true) => paused=_paused
export const quit = () => postMessage(NaN, '*')


export let renderF3 = false, renderBoxes = 0, renderUI = true
listen('autof3', () => {renderF3 = !!options.autof3; renderBoxes = (options.autof3 > 1)*2})
button(KEYS.F1, () => {renderUI = !renderUI})
button(KEYS.F3, GAMEPAD.UP, () => {
	if(buttons.has(GAMEPAD.UP)){
		if(renderF3) ++renderBoxes>=3&&(renderBoxes=0,renderF3=false)
		else renderF3=true
	}else if(buttons.has(KEYS.ALT) | buttons.has(KEYS.SHIFT) | buttons.has(KEYS.MOD)) renderBoxes = (renderBoxes+1)%3
	else renderF3 = !renderF3
})

export const codes = new Array(256)

export const onpacket = (c, cb) => codes[c] = cb
export const send = buf => postMessage(buf.build ? buf.build().buffer : buf.buffer || buf, '*')

export const download = blob => postMessage(blob, '*')

export let _onvoice = null

export function voice(fn){
	postMessage(Infinity, '*')
	if(typeof fn == 'function') _onvoice = fn
	voice.active = true
	return stopVoice
}
export function stopVoice(){
	_onvoice = null
	postMessage(-Infinity, '*')
	voice.active = false
}
voice.sampleRate = 0
voice.active = false