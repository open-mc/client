import { BitField } from "./bitfield.js"

export const _cbs = []
export const _mouseMoveCb = []
export const _wheelCb = []
export const _pauseCb = []
export const _renderPhases = []
export const _optionListeners = {}

export let W2 = 0, H2 = 0, W = 0, H = 0, SCALE = 1

export function _recalcDimensions(c){
	SCALE = cam.z * TEX_SIZE
	W2 = (W = round(visualViewport.width * visualViewport.scale * devicePixelRatio)) / SCALE / 2
	H2 = (H = round(visualViewport.height * visualViewport.scale * devicePixelRatio)) / SCALE / 2
	if(W != c.canvas.width || H != c.canvas.height) c.canvas.width = W, c.canvas.height = H
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
export const onpause = cb => _pauseCb.push(cb)
export const onmousemove = cb => _mouseMoveCb.push(cb)

export const button = (...keys) => {
	const cb = keys.pop()
	for(const key of keys)
		(_cbs[key] || (_cbs[key] = [])).push(cb)
}

export const buttons = new BitField()

export const options = {}

export const listen = (...keys) => {
	const cb = keys.pop()
	for(const key of keys){
		(_optionListeners[key] || (_optionListeners[key] = [])).push(cb)
		if(key in options) cb(options[key])
	}
}
export let paused = false
export const pause = paused => me && postMessage(!!paused, '*')
export function _setPaused(b){paused = b}