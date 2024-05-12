export const _cbs = []
export const _mouseMoveCb = []
export const _joypadMoveCbs = {}
export const _wheelCb = []
export const _renderPhases = []
export const _optionListeners = {}
const coords = {__proto__: null, none: 0, ui: 1, world: 2}
export function drawLayer(coord, prio, fn){
	let i = _renderPhases.push(null) - 2
	while(i >= 0 && _renderPhases[i].prio > prio){
		_renderPhases[i + 1] = _renderPhases[i]
		i--
	}
	fn.prio = prio
	fn.coordSpace = coords[coord] || 0
	i++
	_renderPhases[i] = fn
}



export const onwheel = cb => _wheelCb.push(cb)
export const onmousemove = cb => _mouseMoveCb.push(cb)
export const onjoypad = (i, cb) => (_joypadMoveCbs[i]??=[]).push(cb)

export const onKey = (...keys) => {
	const cb = keys.pop()
	for(const key of keys)
		(_cbs[key] || (_cbs[key] = [])).push(cb)
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
export let _paused = false, paused = false
export function _updatePaused(a){ if(a!==undefined) _paused=a; if(paused^_paused) postMessage(_paused=paused, '*') }
export const pause = (_paused=true) => paused=_paused
export const quit = () => postMessage(NaN, '*')


export let renderF3 = false, renderBoxes = 0, renderUI = true
listen('autof3', () => {renderF3 = !!options.autof3; renderBoxes = (options.autof3 > 1)*2})
onKey(KEYS.F1, () => {renderUI = !renderUI})
onKey(KEYS.F3, GAMEPAD.UP, () => {
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

export function uiButton(c, x0, y0, w, h){
	const {x, y} = c.from(cursor)
	if(x<x0|x>x0+w|y<y0|y>y0+h) return 0
	if(changed.has(LBUTTON) && buttons.pop(LBUTTON)) return 2
	if(changed.has(RBUTTON) && buttons.pop(RBUTTON)) return 3
	return 1
}