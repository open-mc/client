import { listen, options, storage } from './save.js'
import { hideUI, ping, showUI, ui } from './ui.js'
import { pause } from '../uis/pauseui.js'
import { serverlist } from '../uis/serverlist.js'
import texts from './lang.js'

export let iframe = document.createElement('iframe'), win = null

iframe.allow = 'cross-origin-isolated; autoplay'
iframe.src = 'https://sandbox-41i.pages.dev/'
document.body.append(iframe)
export let iReady = false


const queue = []; let files = null
export function gameIframe(f){
	if(!iReady) return false
	if(storage.mods) f.push.apply(f, storage.mods.split('\n'))
	while(f.length<=4) f.push('')
	files = f
	iframe.src = 'https://sandbox-41i.pages.dev/iframe/index.html'
	return true
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
	win?.postMessage(Infinity, '*')
}
onblur = () => { blurred = true; win?.postMessage(Infinity, '*') }

let c = caches.open(''); c.then(a=>c=a)
function onfetch({data: url}){
	if(url[url.length-1]=='/') url+='main.html'
	;(c.then?c.then(c=>c.match(url)):c.match(url)).then(res => res?this.postMessage({url, body: res.body, ct: res.headers.get('content-type')}, [res.body]):fetch(url).then(res=>this.postMessage({url, body: res.body, ct: res.headers.get('content-type')}, [res.body])))
}

onmessage = ({data, source}) => {
	if((source??0) !== iframe.contentWindow) return
	if(!iReady){iReady = true; if(data) data.onmessage = onfetch; else iframe.src+='' }
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
		for(const a of queue){
			if(a.buffer) win.postMessage(a.buffer, '*', [a.buffer])
			else win.postMessage(a, '*')
		}
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
	iframe.src = 'https://sandbox-41i.pages.dev/'
	iframe.remove()
	document.body.append(iframe)
	voiceOff(); if(m && typeof m == 'object') m.source.disconnect(), m = null
	win = null; queue.length = 0
	iReady = false
}

listen((a,b) => win?.postMessage([a, b], '*'))

export function fwPacket(a){
	if(!win) return void queue.push(a)
	if(a.buffer) win.postMessage(a.buffer, '*', [a.buffer])
	else win.postMessage(a, '*')
}

export const ifrMsg = (a,c=!(ui instanceof Element)) => c&&win?.postMessage(a, '*')


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
		win?.postMessage(sampleRate + 5e9, '*')
		const a = ctx.createScriptProcessor(4096, 1, 1) // Blink/webkit bug, node requires output
		a.onaudioprocess = ({inputBuffer}) => {
			if(!voice) return
			const f32 = r?r(inputBuffer.getChannelData(0)):inputBuffer.getChannelData(0)
			win?.postMessage(f32, '*')
		}
		m.source=node;m.source.connect(a)
		a.connect(ctx.destination)
	}catch(e){console.warn(e)}
}
const voiceEl = document.getElementById('voice')
function voiceOn(){
	voice = true
	voiceEl.hidden = false
	if(!m && win) microphone()
}
function voiceOff(){
	if(m && typeof m == 'object'){
		m.source.disconnect()
		m.getAudioTracks()[0].stop(), m = null
	}
	if(!voice) return
	voice = false
	voiceEl.hidden = true
}

export const clearNotifs = () => {
	notifs = 0
	document.title = ws ? texts.misc.title.playing(ws.name) : texts.misc.title.menu()
}