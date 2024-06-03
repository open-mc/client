import { listen, options, storage } from './save.js'
import { hideUI, ping, showUI } from './ui.js'
import { pause } from '../uis/pauseui.js'
import { serverlist } from '../uis/serverlist.js'
import texts from './lang.js'

export let iframe = document.createElement('iframe'), win = null
// Security druggie
iframe.sandbox = 'allow-scripts'
iframe.allow = 'cross-origin-isolated; autoplay'
iframe.credentialless = true
let src = ''
if(location.protocol == 'tauri:'){
	// tauri prod
	// ABSOLUTELY FUCKING RETARDED TAURI PROTOCOL SHITSHOW
	// HOW THE FUCK DOES THIS WORK
	// DO NOT **UNDER ANY CIRCUMSTANCES** REMOVE THE DOT AFTER THE DOMAIN NAME
	src = 'tauri://localhost./iframe/index.html'

	// We allow it, but, being on a different domain, it still can't access parent iframe or credentials
	// This is to actually allow it to load stuff from its own domain
	iframe.sandbox += ' allow-same-origin'
}else if(globalThis.__TAURI__){
	// tauri development environment
	// Fairly simple. Load localhost but by IP instead of domain
	src = 'http://127.0.0.1/iframe/index.html'
	
}else src = 'iframe/index.html'

const queue = []; let files = null
export function gameIframe(f){
	if(storage.mods) f.push.apply(f, storage.mods.split('\n'))
	files = f
	destroyIframe()
	iframe.src = src
	document.body.append(iframe)
}

const empty = new Comment()
empty.esc = pause

let blurred = false, notifs = 0

function notif(){
	if(!blurred || !ws) return
	document.title = texts.misc.title.notification(ws.name, ++notifs)
	ping()
}

onfocus = () => {
	blurred = false
	notifs = 0
	document.title = ws ? texts.misc.title.playing(ws.name) : texts.misc.title.menu()
	win && keyMsg(Infinity)
}
onblur = () => { blurred = true; win && keyMsg(Infinity) }

onmessage = ({data, source}) => {
	if(source != iframe.contentWindow || !iframe.contentWindow) return
	if(typeof data != 'object'){
		if(data === true) showUI(null)
		else if(data === false) hideUI()
		else if(data !== data) serverlist()
		else if(data === Infinity) voiceOn()
		else if(data === -Infinity) voiceOff()
		else if(data === '') notif()
		return
	}
	if(data === null){
		win = iframe.contentWindow
		if(!win) return
		if(!m && voice) microphone()
		for(const k in options) win.postMessage([k, options[k]], '*')
		win.postMessage(files, '*')
		for(let i = 0; i < queue.length; i += 2)queue[i](queue[i+1])
		queue.length = 0
	}else if(data instanceof ArrayBuffer && globalThis.ws) ws.send(data)
	else if(data instanceof Blob){
		const a = document.createElement("a")
		a.href = URL.createObjectURL(data)
		a.download = data.name ?? data.type.split('/',1)[0]
		a.click()
		URL.revokeObjectURL(a.href)
	}else if(Array.isArray(data)){
		if(data.length == 1 && data[0] instanceof Blob) navigator.clipboard.write([new ClipboardItem({[data[0].type]: data[0]})])
		else onerror(undefined,''+data[1],+data[2],+data[3],data[0])
	}
}

export function destroyIframe(){
	if(win)win.close(), win = null
	iframe.remove()
	voiceOff(); if(m && typeof m == 'object') m.source.disconnect(), m = null
	win = null; queue.length = 0
}

export const fwOption = (a, b) => {
	if(!win) return
	win.postMessage([a, b], '*')
}
listen(fwOption)

export function fwPacket(a){
	if(!win) return void queue.push(fwPacket, a)
	if(a.buffer)win.postMessage(a.buffer, '*', [a.buffer])
	else win.postMessage(a, '*')
}

export function keyMsg(a){
	if(!win) return void queue.push(keyMsg, a)
	win.postMessage(a, '*')
}


const TARGET_SAMPLE_RATE = 22050
let m = null, voice = false
async function microphone(){
	m = 1
	try{
		m = await navigator.mediaDevices.getUserMedia({audio: true})
		if(!voice) return voiceOff()
		let node, ctx = null, sampleRate
		// Firefox, wtf??? https://bugzilla.mozilla.org/show_bug.cgi?id=1388586
		for(sampleRate of [TARGET_SAMPLE_RATE, 8000, 16000, 32000, 44100, 48000]) try{
			ctx = new AudioContext({sampleRate})
			node = ctx.createMediaStreamSource(m)
			break
		}catch(e){}
		if(!node) throw alert(texts.warning.unsupported_microphone_api), 'browser does not support processing microphone input'
		let bufferSize = 2048, r = null
		if(sampleRate !== TARGET_SAMPLE_RATE){
			bufferSize = 1<<Math.round(Math.log2(sampleRate/10))
			const {resampler} = await import('/img/_resampler.js')
			r = resampler(sampleRate, TARGET_SAMPLE_RATE, 1, bufferSize)
		}
		win.postMessage(sampleRate + 5e9, '*')
		const a = ctx.createScriptProcessor(4096, 1, 1) // Blink/webkit bug, node requires output
		a.onaudioprocess = ({inputBuffer}) => {
			if(!voice) return
			const f32 = r?r(inputBuffer.getChannelData(0)):inputBuffer.getChannelData(0)
			win.postMessage(f32, '*')
		}
		m.source=node;m.source.connect(a)
		a.connect(ctx.destination)
	}catch(e){console.warn(e)}
}
function voiceOn(){
	voice = true
	chat.classList.add('voice')
	if(!m && win) microphone()
}
function voiceOff(){
	if(m && typeof m == 'object'){
		m.source.disconnect()
		m.getAudioTracks()[0].stop(), m = null
	}
	if(!voice) return
	voice = false
	chat.classList.remove('voice')
}

export const clearNotifs = () => {
	notifs = 0
	document.title = ws ? texts.misc.title.playing(ws.name) : texts.misc.title.menu()
}