import { DataWriter, DataReader, encoder } from '/server/modules/dataproto.js'
import "../uis/chat.js"
import { pendingConnection, msg } from '../uis/dirtscreen.js'
import { Btn, click, Div, Img, Label, Row } from './ui.js'
import { servers, saveServers, storage } from './save.js'
import { clearNotifs, destroyIframe, fwPacket, gameIframe } from './iframe.js'
import { PROTOCOL_VERSION } from '../server/version.js'
import texts from './lang.js'
let lastN = null
globalThis.ws = null

export const skin = new Uint8Array(1008)

async function makeSign(challenge){
	const a = atob(storage.privKey)
	const b = new Uint8Array(a.length)
	for(let i = 0; i < a.length; i++)b[i] = a.charCodeAt(i)
	const k = await crypto.subtle.importKey('pkcs8', b.buffer, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign'])
	return new Uint8Array(await crypto.subtle.sign(k.algorithm.name, k, challenge))
}

const TLD_MAP = {
	anarchy: 'pp.ua',
	smp: 'my.id',
	play: 'de.com',
	mc: 'web.tr',
	'2d': 'gen.tr',
	// Avoiding a few cheap TLDs due to aggressive internet filters
}
function hashCode(str, len){
	const end = new Int32Array(len--)
	for (let i = 0; i < str.length; i++){
		let t = str.charCodeAt(i)
		for(let j = len; j >= 0; j--){
			end[j] = (t = (end[j]>>>0)*31 + t) | 0
			t = Math.floor(t/0x100000000)
		}
	}
	return end
}
function hashv4(domain){
	const [a] = hashCode(domain.toLowerCase(), 1)
	return (a>>>24)+'.'+(a>>>16&0xff)+'.'+(a>>>8&0xff)+'.'+(a&0xff)
}
const hex4 = a => '0123456789abcdef'[a>>12&15]+'0123456789abcdef'[a>>8&15]+'0123456789abcdef'[a>>4&15]+'0123456789abcdef'[a&15]
function hashv6(domain){
	const [a, b] = hashCode(domain.toLowerCase(), 2)
	return '['+hex4(a>>>16)+':'+hex4(a&0xffff)+':'+hex4(b>>>16)+':'+hex4(b&0xffff)+'::1]'
}
function hashv8(domain){
	const [a, b, c, d] = hashCode(domain.toLowerCase(), 4)
	return '['+hex4(a>>>16)+':'+hex4(a&0xffff)+':'+hex4(b>>>16)+':'+hex4(b&0xffff)+':'+hex4(c>>>16)+':'+hex4(c&0xffff)+':'+hex4(d>>>16)+':'+hex4(d&0xffff)+']'
}
let rctimeout = -1
class LocalSocket extends MessageChannel{
	constructor(ip = ''){
		super()
		const port = Object.setPrototypeOf(this.port1, LocalSocket.proto)
		port.readyState = 0; port.onopen = port.onclose = null
		if(!navigator.serviceWorker.controller) return Promise.resolve().then(()=>''), port
		if(ip[0] != '@') return Promise.resolve().then(()=>port.close()), port
		return
		const ifr = port.ifr = document.createElement('iframe')
		ifr.src = 'https://sandbox-41i.pages.dev/localserver/index.html'
		ifr.style.display = 'none'
		document.body.append(ifr)
		ifr.contentWindow.postMessage(this.port2, '*', [this.port2])
		port.start()
		return port
	}
	static proto = Object.create(MessagePort.prototype, {
		send: {enumerable:false,value:  MessagePort.prototype.postMessage},
		close: {enumerable:false,value(code, reason){
			if(this.readyState > 1) return
			this.postMessage(undefined)
			this.readyState = 3
			this.onclose({code, reason})
			setTimeout(() => this.ifr.remove(), 10e3)
		}}
	})
}

export function preconnect(ip, cb = Function.prototype){
	const displayIp = ip; let n=null,u=''; try{
		try{u = new URL(ip)}catch(e){u=new URL('wss://'+ip)}
		u.port || (u.port = 27277)
		if(/(\.|^)localhost$|^127.0.0.1$|^\[::1\]$/.test(u.hostname)) u.hostname = 'local.blobk.at'
		else u.protocol = 'wss:'
		ip = ip.replace(/((?:[^./:;\\|{}[\]()@?#&^<>\s~`"']+\.)*[^./:;\\|{}[\]()@?#&^<>\s~`"']+)\.(\w+(?=:))/, (_,d,a)=>a == 'hash' | a == 'hash4' ? hashv4(d) : a == 'hash6' ? hashv6(d) : a == 'hash8' ? hashv8(d) : (a in TLD_MAP) ? d+'-mc.'+TLD_MAP[a] : d+'.'+a)
		ip=u+''; u.protocol=u.protocol=='wss:'?'https:':'http:'
	}catch(e){}
	(u?fetch(u+'preview').then(a=>a.arrayBuffer()):Promise.reject()).then(dat => {
		const packet = new DataReader(dat)
		const nameString = packet.string()
		const src = packet.string()
		const banner = packet.string() // this was a bad idea
		const motdString = packet.string()
		const timeOff = packet.double() - Date.now()
		if(cb != play){
			name.textContent = nameString
			motd.textContent = motdString
			icon.src = src || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAIBAAA'
			if(banner) node.css({background: 'linear-gradient(75deg, #000a 80rem, #0001 100%), url("'+CSS.escape(banner)+'") center/cover'})
		}
		const packs = pako.inflate(packet.uint8array(), {to: 'string'}).split('\0')
		for(let i = 4; i < packs.length; i++) if(packs[i][0]=='~') packs[i] = 'http' + ip.slice(2) + packs[i].slice(1)
		cb(n={ip, timeOff, displayIp, name: nameString, host: u.host, packs})
	}, err => {
		if(cb != play){
			icon.src = './img/pack.png'
			node.attr('style')
			motd.textContent = err ? texts.connection.refused() : texts.connection.invalid_ip()
			motd.style.color = '#d22'
			name.textContent = displayIp
		}
		cb(null)
	})
	if(cb == play) return
	let name, motd, icon
	const node = Row(
		icon = Img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAAXNSR0IArs4c6QAAACZJREFUKFNjZCACMBKhhoEGijo6Ov5XVFQwotMg59DAOny+JMo6AMVLDArhBOpkAAAAAElFTkSuQmCC'),
		Div('',
			Row(
				name = Label(displayIp),
				Btn('...', () => {
					window.open(ip.replace('ws', 'http'), '_blank','width=1024,height=768,left='+screenX+',top='+screenY)
				},'tiny').css({lineHeight:'16rem'}),
				Btn('^', () => {
					const i = node.parentElement.children.indexOf(node)
					if(!i) return
					const s = servers[i]
					servers[i] = servers[i-1]
					servers[i-1] = s
					node.parentElement.insertBefore(node, node.parentElement.children[i-1])
					saveServers()
				},'tiny').css({lineHeight:'24rem'}),
				Btn('x', () => {
					servers.splice(node.parentElement.children.indexOf(node), 1)
					node.remove()
					saveServers()
				},'tiny')
			),
			motd = Label(texts.connection.connecting()).css({opacity: .5})
		)
	)
	node.classList.add('selectable')
	node.onclick = () => {click(); play(n)}
	return node
}
export async function play(n){
	if(!n || !gameIframe(n.packs)) return
	lastN = n
	const t = Date.now()+n.timeOff+15e3
	const signature = await makeSign(encoder.encode(n.host+'/'+t))
	const packet = new DataWriter()
	packet.short(PROTOCOL_VERSION)
	packet.string(storage.name)
	packet.string(storage.pubKey)
	packet.uint8array(Uint8Array.from(atob(storage.authSig), c => c.charCodeAt()))
	packet.double(t)
	packet.uint8array(signature)
	packet.uint8array(skin, 1008)
	const p = packet.build()
	globalThis.ws = new WebSocket(n.ip)
	let timeout = setTimeout(ws.close.bind(ws), 5000)
	let authed = 0
	ws.onopen = () => (clearTimeout(timeout),ws.send(p),timeout = -1)
	ws.onmessage = function({data}){
		if(!authed && typeof data === 'string') return void(data.length ? pendingConnection(data) : authed=1)
		fwPacket(data)
	}
	ws.onclose = ({reason, code}) => {
		reason = reason || (ws instanceof WebSocket ? timeout >= 0 ? texts.connection.refused() : texts.connection.lost() : texts.connection.invalid_ip())
		finished()
		if(code >= 3000 && code < 4000){
			pendingConnection(reason)
			if(rctimeout >= 0) clearTimeout(rctimeout), rctimeout = -1
			rctimeout = setTimeout(() => play(lastN), (code-3000)*10)
		}else msg(reason, false)
	}
	ws.binaryType = 'arraybuffer'
	onfocus()
	pendingConnection(texts.connection.authenticating())
}
export function reconnect(){
	if(!lastN) return
	play(lastN)
}
export function finished(){
	if(rctimeout >= 0) clearTimeout(rctimeout), rctimeout = -1
	if(!ws) return
	ws.onclose = Function.prototype
	ws.close()
	ws = null
	clearNotifs()
	onfocus()
	destroyIframe()
}