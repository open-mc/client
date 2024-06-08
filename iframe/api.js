export const _cbs = []
export const _renderPhases = [], _tickPhases = []
export const _optionListeners = {}
export const ongesture = [], onpress = []
const coords = {__proto__: null, none: 0, ui: 1, world: 2}

export function tickPhase(prio=0, fn){
	let i = _tickPhases.push(null) - 2
	while(i >= 0 && _tickPhases[i].prio > prio)
		_tickPhases[i+1] = _tickPhases[i--]
	fn.prio = prio
	_tickPhases[i+1] = fn
}
export function drawLayer(coord, prio=0, fn){
	let i = _renderPhases.push(null) - 2
	while(i >= 0 && _renderPhases[i].prio > prio)
		_renderPhases[i + 1] = _renderPhases[i--]
	fn.prio = prio
	fn.coordSpace = coords[coord] || 0
	_renderPhases[i+1] = fn
}



export const onwheel = []
export const onmousemove = []

export const onkey = (...keys) => {
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
export function _updatePaused(a){ if(a!==undefined) _paused=a; if(paused^_paused) parent.postMessage(_paused=paused, '*') }
export const pause = (_paused=true) => paused=_paused
export const quit = () => parent.postMessage(NaN, '*')

export const onfocus = []
export const onblur = []


export let renderF3 = 0, renderBoxes = 0, renderUI = true
listen('autof3', () => {renderF3 = min(options.autof3,2); renderBoxes = (options.autof3 > 2)*2})
onkey(KEYS.F1, () => {renderUI = !renderUI})
onkey(KEYS.F3, GAMEPAD.UP, () => {
	if(buttons.has(GAMEPAD.UP)){
		++renderF3>=3&&(renderF3=0,renderBoxes=(renderBoxes+1)%3)
	}else if(buttons.has(KEYS.ALT) | buttons.has(KEYS.SHIFT) | buttons.has(KEYS.MOD)) renderBoxes = (renderBoxes+1)%3
	else renderF3 = (renderF3+1)%3
})

export const codes = new Array(256)

export const onpacket = (c, cb) => codes[c] = cb
let bytes = 0
export let networkUsage = 0
export const _networkUsage = () => {
	const p = 0.5**(dt*2)
	networkUsage = (bytes *= p) * (1-p)/dt
}
export const _onPacket = data => {
	bytes += data.byteLength
	const packet = new DataReader(data)
	const code = packet.byte()
	if(!codes[code]) return
	try{
		codes[code](packet)
	}catch(e){
		Promise.reject(e)
		console.warn(packet, packet.i)
	}
}
export const send = buf => void(parent.postMessage(buf = (buf.build ? buf.build().buffer : buf.buffer || buf), '*'), bytes += buf.byteLength)

export const download = blob => parent.postMessage(blob, '*')
export const copy = blob => parent.postMessage(globalThis.ClipboardItem ? [blob] : blob, '*')

export let _onvoice = null

export function voice(fn){
	parent.postMessage(Infinity, '*')
	if(typeof fn == 'function') _onvoice = fn
	voice.active = true
	return stopVoice
}
export function stopVoice(){
	_onvoice = null
	parent.postMessage(-Infinity, '*')
	voice.active = false
}
export const ping = () => parent.postMessage('', '*')
voice.sampleRate = 0
voice.active = false

export function uiButton(c, x0, y0, w, h){
	const {x, y} = c.from(cursor)
	if(x<x0|x>x0+w|y<y0|y>y0+h) return 0
	if(changed.has(LBUTTON) && buttons.pop(LBUTTON)) return 2
	if(changed.has(RBUTTON) && buttons.pop(RBUTTON)) return 3
	return 1
}

export let chatFocused = false
export const _setChatFocused = a => chatFocused=a

export { drawText, calcText, textShadeCol} from './font.js'