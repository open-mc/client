import "/img/_pako.js"

globalThis.loadFile = (i, f) => (i=decodeURI(i.url).replace(/[^\/]*$/,"").replace(/file:\/\/\/?(\w+:\/)?/y,'/'), f ? fetch(i + f).then(a=>a.arrayBuffer()).then(a=>new Uint8Array(a)) : f => fetch(i + f).then(a=>a.arrayBuffer()).then(a=>new Uint8Array(a)))
globalThis.AsyncFunction = (async()=>{}).constructor

Object.defineProperties(Array.prototype, {
	best: {enumerable: false, value(pred, best = -Infinity){
		let el = undefined
		const length = this.length
		for(let i = 0; i < length; i++){
			const a = this[i], score = pred(a, i, this)
			if(score >= best) best = score, el = a
		}
		return el
	}},
	remove: {enumerable: false, value(a){
		let i = 0, j = 0
		for(; j < this.length; j++){
			if(j > i) this[i] = this[j]
			if(this[i] != a) i++
		}
		return this.length = i
	}},
	mutmap: {enumerable: false, value(fn){
		const len = this.length
		for(let i = 0; i < len; i++)
			this[i] = fn(this[i])
		return this
	}}
})

Math.ifloat = x => {
	const f = Math.floor(x)
	return (f | 0) + (x - f)
}
Math.randint = () => Math.random() * 4294967296 | 0

// Blazingly fast!!
const nul = new Array(100).fill(null)
Array.null = len => {
	if(len <= 100) return nul.slice(0, len)
	let a = new Array(len)
	while(len > 0) a[--len] = null
	return a
}

Date.formatTime = function(t){
	t /= 1000
	if(t < 3600){
		if(t >= 60) return floor(t/60)+'m '+floor(t%60)+'s'
		else if(t >= 1) return floor(t)+'s'
		else return t*1000+'ms'
	}else{
		if(t < 86400) return floor(t/3600)+'h '+floor(t%3600/60)+'m'
		else if(t < 8640000) return floor(t/86400)+'d '+floor(t%86400/3600)+'h'
		else return floor(t/86400)+'d'
	}
}

Object.defineProperties(globalThis, Object.getOwnPropertyDescriptors(Math))
globalThis.PI2 = PI*2
Function.optimizeImmediately = Function.prototype

globalThis.Worker = class Worker extends MessageChannel{
	static _workers = new WeakMap
	constructor(src){
		let {port1, port2} = super()
		port1._oncl = null
		const ifr = port1.ifr = document.createElement('iframe')
		ifr.srcdoc = `<script>addEventListener('message',e=>{
let E="data:application/javascript,export%20default%20",H=${JSON.stringify(__import__.origin)},d=(globalThis.__data__=e.data).cache,m={__proto__:null},R=(b,s,c=s.charCodeAt(0))=>c==47||(c==46&&((c=s.charCodeAt(1))==47||(c==46&&s.charCodeAt(2)==47)))?new URL(s,b).href:s.startsWith(H)?'data:application/javascript,':c==c?s:b;(globalThis.__import__=(b,s='')=>import(R(b,s))).meta=u=>m[u]??=Object.freeze({url:u,resolve:s=>R(u,s)});__import__.origin=H;for(let{0:k,1:v}of __import__.map=d){
if(!v){m[k]='data:application/javascript,';continue};if(v.type=='application/javascript'){m[k]=URL.createObjectURL(v);continue}}
d=document.createElement('script');d.type='importmap';d.textContent=JSON.stringify({imports:m});document.head.append(d);m={__proto__:null}
import(H+'localserver/index.js').then(()=>import(e.data.path))
},{once:true})</script>` + encodeURIComponent(src)
		ifr.onload = () => {
			if(port2) return void(ifr.contentWindow.postMessage({parent: port2, cache: __import__.map, path: new URL(src, __import__.origin+'server/').href}, '*', [port2]), port2=null)
			Worker._workers.delete(ifr.contentWindow)
			ifr.remove(),port1.close()
		}
		document.body.append(ifr)
		Worker._workers.set(ifr.contentWindow, port1)
		return Object.setPrototypeOf(port1, Worker.proto)
	}
	static proto = Object.create(MessagePort.prototype, {
		terminate: {enumerable:false,value(){
			Worker._workers.delete(this.ifr.contentWindow)
			this.ifr.remove(); this.close()
		}},
		close(){MessagePort.prototype.close.call(this);this.dispatchEvent(new CloseEvent('close'))},
		onclose: {get(){return this._oncl}, set(fn){
			if(this._oncl) this.removeEventListener('close', this._oncl)
			if(this._oncl=fn) this.addEventListener('close', fn)
		}}
	})
}
delete globalThis.SharedWorker
globalThis.perf = null

let total = 0, loaded = 0
const _started = Date.now()
const print = desc => console.log(`\x1b[32m[${Date.formatTime(Date.now() - _started)}] ${desc}`)
let startServer; globalThis.ready = new Promise(r=>startServer=r)
globalThis.task = function(desc = ''){
	if(loaded == total++) globalThis.ready = new Promise(r=>startServer=r)
	let called = false
	return (d = desc) => {
		if(called) return
		called = true
		loaded++
		print(d)
		if(total == loaded && startServer) startServer(), startServer = null
	}
}
task.done = desc => {
	total++; loaded++
	print(desc)
}

globalThis.started = 0
globalThis.host = ''

const c = document.createElement('canvas'), ctx = c.getContext('2d')
globalThis.PNG = {
	from: (m, src) => {
		const i = new Image
		i.onload = () => {
			c.width = i.width; c.height = i.height
			ctx.drawImage(i, 0, 0)
			r(new Uint8Array(ctx.getImageData(0, 0, c.width, c.height).data.buffer))
		}
		let r, pr = new Promise((_r,_c)=>(r=_r,i.onerror=_c))
		i.src = decodeURI(m.url).replace(/[^\/]*$/,"").replace(/file:\/\/\/?(\w+:\/)?/y,'/') + src
		return pr
	},
	read: buf => createImageBitmap(new Blob([buf])).then(i => {
		c.width = i.width; c.height = i.height
		ctx.drawImage(i, 0, 0)
		return new Uint8Array(ctx.getImageData(0, 0, c.width, c.height).data.buffer)
	}),
	write: (data, w, h) => new Promise(r => {
		c.width = w; c.height = h
		ctx.putImageData(new ImageData(data instanceof ArrayBuffer ? new Uint8ClampedArray(data) : new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), w, h), 0, 0)
		c.toBlob(blob => blob.arrayBuffer().then(buf => r(new Uint8Array(buf))), 'image/png')
	})
}

globalThis.deflate = pako.deflate
globalThis.inflate = pako.inflate
globalThis.close = () => location = 'about:blank'

if(__data__.parent){
	addEventListener('message', ({data, source}) => void Worker._workers.get(source)?.dispatchEvent(new ErrorEvent('error', {data,source})))
	;(globalThis.parentPort = __data__.parent).start()
}else{
globalThis.parentPort = null
const {name, skin, port, dbport, config} = __data__
const tra = [null]
globalThis.hostSocket = Object.setPrototypeOf(port, Object.create(MessagePort.prototype, {
	send: {enumerable:false, value(a){typeof a=='string'?this.postMessage(a):this.postMessage(tra[0]=a instanceof ArrayBuffer?a.slice():a.buffer.slice(a.byteOffset,a.byteOffset+a.byteLength),tra)}},
	end: {enumerable:false, value(code, reason){
		// Simulate close
		this.dispatchEvent(new MessageEvent('message', {data:null}))
	}}
}))
hostSocket.username = name
hostSocket.state = 0
hostSocket.skin = new Uint8Array(skin)
hostSocket.pingTime = 0
hostSocket.entity = null
addEventListener('message', ({data, source}) => {
	const s = Worker._workers.get(source)
	if(s) return void s.dispatchEvent(new ErrorEvent('error', {data,source}))
	globalThis.CONFIG = data
	for(const f of configLoaded.listeners) try{f(CONFIG)}catch(e){console.error(e)}
})
globalThis.CONFIG = config
globalThis.configLoaded = fn => configLoaded.listeners.push(fn)
configLoaded.listeners = []
dbport.onmessage = ({data}) => { reqs[i](data); if(++i>(reqs.length>>1)) reqs.splice(0,i),i=0 }
const reqs = []; let i = 0
const e = new TextEncoder
globalThis.DB = new class IDBLevel{
	prefix = ''
	sublevel(a){const s=new IDBLevel;s.prefix=this.prefix+'!'+a+'!';return s}
	get(k,cb){
		try{ return cb?(reqs.push(v=>cb(!v?'Not found:':null,new Uint8Array(v))),undefined):new Promise((a,b)=>reqs.push(v=>v?a(new Uint8Array(v)):b('Not found:'))) }finally{
			dbport.postMessage(this.prefix+k)
		}
	}
	getMany(ks,cb){
		try{ return cb?(reqs.push(a=>{for(let i=a.length;--i>=0;)a[i]=new Uint8Array(a[i]);cb(a)}),undefined):new Promise(r=>reqs.push(a=>{for(let i=a.length;--i>=0;)a[i]=new Uint8Array(a[i]);r(a)})) }finally{
			dbport.postMessage(ks.map(a=>this.prefix+a))
		}
	}
	batch(e,cb){
		let r,f
		try{ return cb?(reqs.push(cb.bind(undefined,null)),undefined):new Promise(a=>reqs.push(a)) }finally{
			reqs.push(r,f)
			const tr = []
			e = e.map(({type,key:k,value:v})=>{
				if(type=='del') return {k,v:null}
				if(type=='put') return {k,v:(tr.push(v=typeof v=='string'?e.encode(v).buffer:v instanceof ArrayBuffer?v.slice():v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength)),v)}
				if(f) f("A batch operation must have a type property that is 'put' or 'del'"),f=null,reqs.length-=2
			})
			if(!f) dbport.postMessage(e, tr)
		}
	}
	put(k,v,cb){
		try{ return cb?(reqs.push(cb.bind(undefined,null)),undefined):new Promise(a=>reqs.push(a)) }finally{
			dbport.postMessage({k:this.prefix+k,v:v=typeof v=='string'?e.encode(v).buffer:v instanceof ArrayBuffer?v.slice():v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength)}, [v])
		}
	}
	del(k,cb){
		try{ return cb?(reqs.push(cb.bind(undefined,null)),undefined):new Promise(a=>reqs.push(a)) }finally{
			dbport.postMessage({k:this.prefix+k,v:null})
		}
	}
}
import('./server.js')
}