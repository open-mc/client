import { listen, options } from './save.js'
import { hideUI, showUI } from './ui.js'

export let iframe = document.createElement('iframe'), win = null
iframe.sandbox = 'allow-scripts'
iframe.src = location.origin + '/iframe/index.html'
const queue = []; let files = null
export function gameIframe(f){
	files = f
	destroyIframe()
	document.body.append(iframe)
}
const audios = new Map, actx = new AudioContext()
const sfxGain = actx.createGain(), bgGain = actx.createGain()
sfxGain.connect(actx.destination)
bgGain.connect(actx.destination)

onmessage = ({data, source}) => {
	if(source && source != iframe.contentWindow)return
	if(data === undefined){
		const w = iframe.contentWindow
		for(const k in options) w.postMessage([k, options[k]], '*')
		w.postMessage(files, '*')
	}else if(data === null){
		//Loaded
		win = iframe.contentWindow
		while(queue.length)queue.pop()(queue.pop())
		hideUI()
	}else if(data === true)showUI(null)
	else if(data === false)hideUI()
	else if(data instanceof ArrayBuffer && globalThis.ws) ws.send(data)
	else if(data instanceof Blob){
		let d = new Date()
		const a = document.createElement("a")
		a.href = URL.createObjectURL(data)
		a.download = `screenshot-${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDay()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
		a.click()
		URL.revokeObjectURL(a.href)
	}else if(Array.isArray(data)){
		const [aid, sid, start = NaN, end, loop] = data
		if(sid instanceof ArrayBuffer){
			audios.set(aid, new Map)
			actx.decodeAudioData(sid, b => {
				b.bg = start
				const a = audios.get(aid)
				audios.set(aid, b)
				if(a instanceof Map)
					for(const data of a.values())
						onmessage({data})
			})
			return
		}
		if(start != start){
			const a = audios.get(sid)
			if(a){
				a.onended = null
				a.stop()
				audios.delete(sid)
				return
			}
			const buf = audios.get(aid)
			if(buf instanceof Map) buf.delete(sid)
			return
		}
		const buf = audios.get(aid)
		if(buf instanceof Map)return void buf.set(sid, data)
		if(!buf) return
		const source = actx.createBufferSource()
		source.buffer = buf
		source.connect(buf.bg ? bgGain : sfxGain)
		source.loop = loop
		if(loop){
			source.loopStart = start
			if(end == end)source.loopEnd = end
			source.start(0, start)
		}else{
			source.start(0, start, end == end ? end - start : buf.duration)
			source.onended = () => (win && win.postMessage(sid + 65536, '*'), audios.delete(sid))
		}
		audios.set(sid, source)
	}
}

document.body.onmousemove = ({movementX, movementY}) => {
	if(!document.pointerLockElement || !win)return
	const movementScale = devicePixelRatio ** (globalThis.netscape ? 1 : /Opera|OPR\//.test(navigator.userAgent) ? -1 : 0)
	win.postMessage([movementX * movementScale, -movementY * movementScale], '*')
}

document.body.onwheel = ({deltaY}) => {
	if(!document.pointerLockElement || !win)return
	const movementScale = devicePixelRatio ** (globalThis.netscape ? 1 : /Opera|OPR\//.test(navigator.userAgent) ? -1 : 0)
	win.postMessage([deltaY * movementScale], '*')
}

export function destroyIframe(){
	if(win)win.close(), win = null
	iframe.remove()
	win = null; queue.length = 0
	for(const sound of audios.values()) if(sound.stop)sound.stop()
	audios.clear()
}

export const fwOption = (a, b) => {
	if(!win)return void queue.push(a, fwOption)
	win.postMessage([a, b], '*')
}
listen('sound', () => sfxGain.gain.value = options.sound * options.sound)
listen('music', () => bgGain.gain.value = options.music * options.music)
listen(fwOption)

export function fwPacket(a){
	if(!iframe.contentWindow)return
	if(a.buffer)iframe.contentWindow.postMessage(a.buffer, '*', [a.buffer])
	else iframe.contentWindow.postMessage(a, '*')
}

export function keyMsg(a){
	if(!win)return void queue.push(a, keyMsg)
	if(a.buffer)win.postMessage(a, '*')
	else win.postMessage(a, '*')
}