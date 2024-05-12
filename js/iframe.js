import { listen, options, storage } from './save.js'
import { hideUI, showUI, ui } from './ui.js'
import { pause } from '../uis/pauseui.js'
import { serverlist } from '../uis/serverlist.js'

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
	src = 'tauri://localhost./iframe/index.html#'

	// We allow it, but, being on a different domain, it still can't access parent iframe or credentials
	// This is to actually allow it to load stuff from its own domain
	iframe.sandbox += ' allow-same-origin'
}else if(globalThis.__TAURI__){
	// tauri development environment
	// Fairly simple. Load localhost but by IP instead of domain
	src = 'http://127.0.0.1/iframe/index.html#'
	
}else src = 'iframe/index.html#'

const queue = []; let files = null
export function gameIframe(f, flags=0){
	if(storage.mods) f.push.apply(f, storage.mods.split('\n'))
	files = f
	destroyIframe()
	iframe.src = src + flags
	document.body.append(iframe)
}

const empty = new Comment()
empty.esc = pause

onmessage = ({data, source}) => {
	if(source != iframe.contentWindow || !iframe.contentWindow) return
	if(typeof data != 'object'){
		if(data === true) showUI(null)
		else if(data === false) hideUI()
		else if(data !== data) serverlist()
		else if(data === Infinity) voiceOn()
		else if(data === -Infinity) voiceOff()
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
		let d = new Date()
		const a = document.createElement("a")
		a.href = URL.createObjectURL(data)
		a.download = `screenshot-${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDay()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
		a.click()
		URL.revokeObjectURL(a.href)
	}else if(Array.isArray(data)) onerror(undefined,''+data[1],+data[2],+data[3],data[0])
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
		let node, ctx = null, sampleRate
		// Firefox, wtf??? https://bugzilla.mozilla.org/show_bug.cgi?id=1388586
		for(sampleRate of [TARGET_SAMPLE_RATE, 8000, 16000, 32000, 44100, 48000]) try{
			ctx = new AudioContext({sampleRate})
			node = ctx.createMediaStreamSource(m)
			break
		}catch(e){}
		if(!node) throw alert("Please switch to chrome or safari, your browser does not support processing microphone input"), 'browser does not support processing microphone input'
		let bufferSize = 2048, r = null
		if(sampleRate !== TARGET_SAMPLE_RATE){
			bufferSize = 2**Math.round(Math.log2(sampleRate/10))
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
		m.source=ctx.createMediaStreamSource(m);m.source.connect(a)
		a.connect(ctx.destination)
	}catch(e){console.log(e)}
}
function voiceOn(){
	voice = true
	chat.classList.add('voice')
	if(!m && win) microphone()
}
function voiceOff(){ voice = false; chat.classList.remove('voice') }