import { BitField } from './bitfield.js'
export const _cbs = []
export const _mouseMoveCb = []
export const _wheelCb = []
export const _pauseCb = []
export const _renderPhases = []
export const _optionListeners = {}

export let W2 = 0, H2 = 0, W = 0, H = 0, SCALE = 1

export function _recalcDimensions(c, camZ){
	SCALE = camZ * TEX_SIZE
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

buttons = new BitField()
changed = new BitField()

export const options = {}
globalThis.options = options

export const listen = (...keys) => {
	const cb = keys.pop()
	for(const key of keys){
		(_optionListeners[key] || (_optionListeners[key] = [])).push(cb)
		if(key in options) cb(options[key])
	}
}
export let paused = false
let customPaused = false
export const pause = _paused => me && (paused != (_paused=!!_paused) || customPaused) && postMessage(_paused, '*')
export function customPause(){
	if(customPaused)return
	fakePause(true)
	customPaused = true
	postMessage('custompause', '*')
}
export const quit = () => postMessage('quit', '*')

export function fakePause(b = true){
	paused = b
	customPaused = false
	for(const cb of _pauseCb) cb()
}


export let renderF3 = false, renderBoxes = false, renderUI = true
listen('autof3', () => {renderF3 = !!options.autof3; renderBoxes = options.autof3 > 1})
button(KEYS.F1, () => {renderUI = !renderUI})
button(KEYS.F3, () => {
	if(buttons.has(KEYS.ALT) || buttons.has(KEYS.MOD)) renderBoxes = !renderBoxes
	else renderF3 = !renderF3
})

export const codes = new Array(256)

export const onpacket = (c, cb) => codes[c] = cb
export const send = buf => postMessage(buf.build ? buf.build().buffer : buf.buffer || buf, '*')