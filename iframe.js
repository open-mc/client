import { listen, options } from './save.js'
import { hideUI, showUI, ui } from './ui.js'

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
const bgGain = actx.createGain()
bgGain.connect(actx.destination)

onmessage = ({data, source}) => {
	if(source && source != iframe.contentWindow)return
	if(data === null){
		win = iframe.contentWindow
		for(const k in options) win.postMessage([k, options[k]], '*')
		win.postMessage(files, '*')
		while(queue.length)queue.pop()(queue.pop())
	}else if(data === true) showUI(null)
	else if(data === false) hideUI()
	else if(data instanceof ArrayBuffer && globalThis.ws) ws.send(data)
	else if(data instanceof Blob){
		let d = new Date()
		const a = document.createElement("a")
		a.href = URL.createObjectURL(data)
		a.download = `screenshot-${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDay()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
		a.click()
		URL.revokeObjectURL(a.href)
	}else if(Array.isArray(data)){
		const [aid, sid, start = NaN, end, loop, vol, pitch] = data
		if(typeof sid == 'string'){
			audios.set(aid, start ? '+' + sid : sid)
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
		if(typeof buf == 'string'){
			audios.set(aid, new Map([[sid, data]]))
			const bg = buf.startsWith('+')
			fetch(buf.slice(bg), {credentials: 'omit', priority: 'low'}).then(a => a.arrayBuffer()).then(a => actx.decodeAudioData(a, b => {
				b.bg = bg
				const a = audios.get(aid)
				audios.set(aid, b)
				if(a instanceof Map)
					for(const data of a.values())
						onmessage({data})
			}))
			return
		}
		if(buf instanceof Map)return void buf.set(sid, data)
		if(!buf) return
		const source = actx.createBufferSource()
		source.buffer = buf
		if(buf.bg) source.connect(bgGain)
		else{
			const gain = actx.createGain()
			gain.gain.value = options.sound * options.sound * vol
			gain.connect(actx.destination)
			source.playbackRate.value = pitch
			source.connect(gain)
		}
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

document.body.onmousemove = ({movementX, movementY, clientX, clientY}) => {
	if(!win)return
	if(ui){
		win.postMessage([clientX, clientY], '*')
		return
	}
	const movementScale = globalThis.netscape ? devicePixelRatio : /Opera|OPR\//.test(navigator.userAgent) ? 1/devicePixelRatio : 1
	win.postMessage([movementX * movementScale, -movementY * movementScale], '*')
}

document.body.onwheel = ({deltaY}) => {
	if(!win)return
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
listen('music', () => bgGain.gain.value = options.music * options.music)
listen(fwOption)

export function fwPacket(a){
	if(!win)return void queue.push(a, fwPacket)
	if(a.buffer)win.postMessage(a.buffer, '*', [a.buffer])
	else win.postMessage(a, '*')
}

export function keyMsg(a){
	if(!win)return void queue.push(a, keyMsg)
	win.postMessage(a, '*')
}