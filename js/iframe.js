import { listen, options, storage } from './save.js'
import { hideUI, showUI, ui } from './ui.js'
import { pause } from '../uis/pauseui.js'
import { serverlist } from '../uis/serverlist.js'
import texts from './lang.js'

export let iframe = document.createElement('iframe'), win = null

iframe.allow = 'cross-origin-isolated; autoplay'
iframe.src = 'https://sandbox-41i.pages.dev/'
document.body.append(iframe)
export let iReady = false

const queue = []
export function gameIframe(f){
	if(!iReady) return false
	iframe.src = 'https://sandbox-41i.pages.dev/iframe/index.html'
	return true
}

const empty = new Comment()
empty.esc = pause

let c = caches.open(''); c.then(a=>c=a)
function onfetch({data: url}){
	if(url[url.length-1]=='/') url+='main.html'
	;(c.then?c.then(c=>c.match(url)):c.match(url)).then(res => res?this.postMessage({url, body: res.body, ct: res.headers.get('content-type')}, [res.body]):fetch(url).then(res=>this.postMessage({url, body: res.body, ct: res.headers.get('content-type')}, [res.body])))
}

export class LocalSocket extends MessageChannel{
	static getOptions = ip => new Promise((r,f) => {
		const db = indexedDB.open(ip,1)
		db.onupgradeneeded = () => (db.result.createObjectStore('db'),db.result.createObjectStore('meta'))
		db.onsuccess = () => {
			const t = db.result.transaction(['meta'], 'readonly')
			const req = t.objectStore('meta').get('config')
			req.onerror = f; req.onsuccess = () => r(req.result)
			t.commit()
		}
		db.onerror = f
	})
	static setOptions = (ip, o) => new Promise((r,f) => {
		const db = indexedDB.open(ip,1)
		db.onupgradeneeded = () => (db.result.createObjectStore('db'),db.result.createObjectStore('meta'))
		db.onsuccess = () => {
			const req = db.result.transaction(['meta'], 'readwrite').objectStore('meta').put(o, 'config')
			req.onerror = f; req.onsuccess = r
		}
		db.onerror = f
	})
	static deleteWorld = ip => new Promise((r,f) => {
		const db = indexedDB.deleteDatabase(ip)
		db.onsuccess = () => r(null); db.onerror = f
	})
	constructor(ip = ''){
		super()
		const port = Object.setPrototypeOf(this.port1, LocalSocket.proto)
		port.readyState = 0; port.onopen = port.onclose = null
		if(ip[0] != '@') return Promise.resolve().then(()=>port.close()), port
		const ifr = port.ifr = document.createElement('iframe')
		ifr.src = 'https://sandbox-41i.pages.dev/localserver/index.html'
		ifr.style.display = 'none'
		const {port1, port2} = new MessageChannel()
		const dat = {port: this.port2, dbport: port2, config: null}
		let P = 2
		ifr.onload = () => P?--P||ifr.contentWindow.postMessage(dat, '*', [dat.port,dat.dbport]):(ifr.remove(),this.onclose({code, reason}),port.readyState=3)
		let r = indexedDB.open(ip,1)
		r.onupgradeneeded = () => (r.result.createObjectStore('db'),r.result.createObjectStore('meta'))
		const dbQueue = []; let dbI = 0
		let dbO
		r.onsuccess = () => {
			const t = (r=r.result).transaction(['meta'], 'readonly').objectStore('meta').get('config')
			t.onsuccess = () => {dat.config=t.result;--P||ifr.contentWindow.postMessage(dat, '*', [dat.port,dat.dbport])}
		}
		const tra = []
		function processResults(e){
			if(e) try{ for(;dbI<dbQueue.length;dbI++){
				const tr = dbQueue[dbI]
				if(Array.isArray(tr)){
					const res = []
					for(const {result} of tr){
						if(result instanceof ArrayBuffer) res.push(result), tra.push(result)
						else res.push(undefined)
					}
					port1.postMessage(res, tra)
					tra.length = 0
				}else{
					const {result} = tr
					result instanceof ArrayBuffer ? (port1.postMessage(result, (tra[0]=result,tra)),tra.length=0) : port1.postMessage(undefined)
				}
			} }catch(e){}finally{ if(dbI>(dbQueue.length>>1)) dbQueue.splice(0,dbI), dbI=0 }
			for(const data of newReqs){
				let req
				if(typeof data == 'string'){
					req = dbO.get(data)
					req.onsuccess = processResults
				}else if(!Array.isArray(data)){
					req = data.v!==null?dbO.put(data.v, data.k):dbO.delete(data.k)
					req.onsuccess = processResults
				}else{ req = []; for(const d of data){
					const r = typeof d == 'string' ? dbO.get(d) : d.v!==null?dbO.put(d.v, d.k):db.delete(d.k)
					r.onsuccess = processResults
					req.push(r)
				} }
				dbQueue.push(req)
			}
			newReqs.length = 0
		}
		const newReqs = []
		port1.onmessage = ({data}) => {
			if(dbI>=dbQueue.length){
				const t = r.transaction(['db'], 'readwrite')
				dbO = t.objectStore('db')
				newReqs[0] = data
				processResults(null)
			}else newReqs.push(data)
		}
		document.body.append(ifr)
		port.start()
		return port
	}
	static proto = Object.create(MessagePort.prototype, {
		send: {enumerable:false, value: MessagePort.prototype.postMessage},
		close: {enumerable:false,value(code, reason){
			if(this.readyState > 1) return
			this.postMessage(undefined)
			this.readyState = 2
			setTimeout(() => (this.ifr.remove(),this.onclose({code, reason}),this.readyState=3), 10e3)
		}}
	})
}
let mport
onmessage = ({data, source}) => {
	if((source??0) !== iframe.contentWindow) return
	if(!iReady){iReady = true; if(data) (mport=data).onmessage = onfetch; else iframe.src+='' }
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
	mport?.close()
	iReady = false
}

listen((a,b) => win?.postMessage([a, b], '*'))

export function fwPacket({data:a}){
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