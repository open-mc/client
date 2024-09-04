import { listen, options, storage } from './save.js'
import { hideUI, showUI, ui } from './ui.js'
import { pause } from '../uis/pauseui.js'
import { serverlist } from '../uis/serverlist.js'
import texts from './lang.js'
import { defaultConfig, fallback } from './worldconfig.js'
export let iframe = document.createElement('iframe'), win = null

iframe.srcdoc = `<script>parent.postMessage(undefined,'*');addEventListener('message',e=>{
let E="data:application/javascript,export%20default%20",H=${JSON.stringify(location.origin+'/')},[d,f]=e.data,m={__proto__:null},R=(b,s,c=s.charCodeAt(0))=>c==47||(c==46&&((c=s.charCodeAt(1))==47||(c==46&&s.charCodeAt(2)==47)))?new URL(s,b).href:s.startsWith(H)?'data:application/javascript,':c==c?s:b;(globalThis.__import__=(b,s='')=>import(R(b,s))).meta=u=>m[u]??=Object.freeze({url:u,resolve:s=>R(u,s)});for(let{0:k,1:v}of __import__.map=d){
if(!v){m[k]='data:application/javascript,';continue};if(v.type=='application/javascript'){m[k]=URL.createObjectURL(v);continue}
let ct=v.type,ct1='',i=ct.indexOf(';'),R="__import__.map.get("+encodeURI(JSON.stringify(k))+")";if(i>-1)ct=ct.slice(0,i);i=ct.indexOf('/');if(i>-1)ct1=ct.slice(0,i).trim().toLowerCase(),ct=ct.slice(i+1).trim().toLowerCase()
if(ct1=='image')m[k]=E+"Img("+R+")"
else if(ct1=='application'&&ct=='json')m[k]=E+"JSON.parse(await%20new%20Response("+R+").json())"
else if(ct1=='audio')m[k]=E+"Wave("+R+")"
else m[k]=E+R
}m.vanilla=m[H+'vanilla/index.js'],m.core=m[H+'iframe/index.js'],m.world=m[H+'iframe/world.js'],m.api=m[H+'iframe/api.js'],m.definitions=m[H+'iframe/definitions.js']
d=document.createElement('script');d.type='importmap';d.textContent=JSON.stringify({imports:m});document.head.append(d);m={__proto__:null}
__import__.loadAll=async ()=>{__import__.loadAll=null;let i=3,a=[];while(++i<f.length)a.push(import(f[i]));for(const n of a)await n;return f};import('core')
},{once:true})</script>`
iframe.sandbox = 'allow-scripts'
iframe.allow = 'cross-origin-isolated; autoplay'
document.body.append(iframe)
export let iReady = false
export const skin = new Uint8Array(1008)
const sw = navigator.serviceWorker
const queue = []
export function gameIframe(f, url = 'file:'){
	if(!iReady) return false
	iReady = false
	const q = f.slice(3)
	q[0] = url
	sw.controller.postMessage(q)
	sw.onmessage = ({data, source}) => {
		if(source != sw.controller) return
		iframe.contentWindow.postMessage([data,f], '*')
		iReady = true
	}
	return true
}

const empty = new Comment()
empty.esc = pause

export class LocalSocket extends MessageChannel{
	static getOptions = ip => new Promise((r,f) => {
		const db = indexedDB.open(ip,1)
		db.onupgradeneeded = () => (db.result.createObjectStore('db'),db.result.createObjectStore('meta'))
		db.onsuccess = () => {
			const t = db.result.transaction(['meta'], 'readonly')
			const req = t.objectStore('meta').get('config')
			req.onerror = f; req.onsuccess = () => r(req.result)
		}
		db.onerror = f
	})
	static setOptions = (ip, o, cb) => new Promise((r,f) => {
		const db = indexedDB.open(ip,1)
		db.onupgradeneeded = () => (db.result.createObjectStore('db'),db.result.createObjectStore('meta'))
		db.onsuccess = () => {
			cb?.(db.result)
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
		port.url = ip; port.opts = null; port._db = null
		if(ip[0] != '@') return Promise.resolve().then(()=>port.close()), port
		const ifr = port.ifr = document.createElement('iframe')
		ifr.src = 'https://sandbox-41i.pages.dev/localserver/index.html'
		ifr.style.display = 'none'
		const {port1, port2} = new MessageChannel()
		const dat = {name: storage.name, skin: skin.buffer, port: this.port2, dbport: port2, config: null}
		let P = 2
		ifr.onload = () => P?--P||ifr.contentWindow.postMessage(dat, '*', [dat.port,dat.dbport]):port._finish()
		let r = indexedDB.open(ip,1)
		r.onupgradeneeded = () => (r.result.createObjectStore('db'),r.result.createObjectStore('meta'))
		const dbQueue = []; let dbI = 0
		let dbO
		r.onsuccess = () => {
			const t = (r=r.result).transaction(['meta'], 'readonly').objectStore('meta').get('config')
			port._db = r
			t.onsuccess = () => {
				dat.config=port.opts=fallback(t.result,defaultConfig)
				--P||ifr.contentWindow.postMessage(dat, '*', [dat.port,dat.dbport])
			}
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
			} }catch{}finally{ if(dbI>(dbQueue.length>>1)) dbQueue.splice(0,dbI), dbI=0 }
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
		send: {enumerable:false, value(a){typeof a=='string'?this.postMessage(a):this.postMessage(tra[0]=a instanceof ArrayBuffer?a.slice():a.buffer.slice(a.byteOffset,a.byteOffset+a.byteLength),tra)}},
		close: {enumerable:false,value(code, reason){
			if(this.readyState > 1) return
			this.postMessage(undefined)
			this.readyState = 2
			setTimeout(() => this._finish(code, reason), 30e3)
		}},
		_finish: {enumerable:false,value(code, reason){
			this.ifr.remove()
			this.readyState = 3
			this.onclose?.({code, reason})
			this.opts.motd[0] = 'Last played: '+new Date().toLocaleString()
			this._db.transaction(['meta'], 'readwrite').objectStore('meta').put(this.opts, 'config')
		}},
		setOptions: {enumerable:false,value(o){ this.ifr.contentWindow.postMessage(this.opts = o, '*') }}
	})
}
const tra=[null]
let mport
onmessage = ({data, source}) => {
	if((source??0) !== iframe.contentWindow) return
	if(!iReady){ iReady = true; return }
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
		hideUI()
	}else if(data instanceof ArrayBuffer && globalThis.ws) ws.send(data)
	else if(data instanceof Blob) download(data)
	else if(Array.isArray(data)){
		if(data.length == 1 && data[0] instanceof Blob) navigator.clipboard.write([new ClipboardItem({[data[0].type]: data[0]})])
		else; //onerror(undefined,''+data[1],+data[2],+data[3],data[0])
	}
}
const a = document.createElement('a')
export const download = file => {
	a.href = URL.createObjectURL(file)
	a.download = file.name ?? (file.type[0]=='@' ? 'file' : file.type.split('/',1)[0])
	a.click()
	URL.revokeObjectURL(a.href)
}

export function destroyIframe(){
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
	win.postMessage(a, '*')
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
		}catch{}
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