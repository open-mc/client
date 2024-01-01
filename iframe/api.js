import { BitField } from './bitfield.js'
export const _cbs = []
export const _mouseMoveCb = []
export const _joypadMoveCbs = {}
export const _wheelCb = []
export const _renderPhases = []
export const _optionListeners = {}

export let W2 = 0, H2 = 0, W = 0, H = 0, SCALE = 1

export function _recalcDimensions(c, camZ){
	const dpx = devicePixelRatio * 2**(options.supersample*6-3)
	SCALE = camZ * TEX_SIZE * dpx
	W2 = (W = round(visualViewport.width * visualViewport.scale * dpx)) / SCALE / 2
	H2 = (H = round(visualViewport.height * visualViewport.scale * dpx)) / SCALE / 2
	if(W != c.canvas.width || H != c.canvas.height) c.resize(W, H)
	else if(c.reset) c.reset()
	else c.resetTransform(),c.clearRect(0, 0, W, H)
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