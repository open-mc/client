import { DataWriter, DataReader, encoder } from '/server/modules/dataproto.js'
import "../uis/chat.js"
import { pendingConnection, msg } from '../uis/dirtscreen.js'
import { Btn, click, Div, Img, Label, Row, ping } from './ui.js'
import { storage } from './save.js'
import { LocalSocket, destroyIframe, fwPacket, gameIframe, iReady, skin, win } from './iframe.js'
import { PROTOCOL_VERSION } from '../server/version.js'
import texts from './lang.js'
import { worldoptions } from '../uis/worldoptions.js'
import { rmServer, servers, swapServers } from '../uis/serverlist.js'
import { exportWorld } from './worldconfig.js'

let lastN = null
globalThis.ws = null

async function makeSign(challenge){
	const a = atob(storage.privKey)
	const b = new Uint8Array(a.length)
	for(let i = 0; i < a.length; i++) b[i] = a.charCodeAt(i)
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

export function preconnect(ip, cb = Function.prototype){
	let displayIp = ip; let n=null,u=''
	if(ip[0] == '@') u = ip
	else try{
		try{u = new URL(ip)}catch{u=new URL('wss://'+ip)}
		u.port || (u.port = 27277)
		if(/(\.|^)localhost$|^127.0.0.1$|^\[::1\]$/.test(u.hostname)) u.hostname = 'local.blobk.at'
		else u.protocol = 'wss:'
		ip = ip.replace(/((?:[^./:;\\|{}[\]()@?#&^<>\s~`"']+\.)*[^./:;\\|{}[\]()@?#&^<>\s~`"']+)\.(\w+(?=:))/, (_,d,a)=>a == 'hash' | a == 'hash4' ? hashv4(d) : a == 'hash6' ? hashv6(d) : a == 'hash8' ? hashv8(d) : (a in TLD_MAP) ? d+'-mc.'+TLD_MAP[a] : d+'.'+a)
		ip=u+''; u.protocol=u.protocol=='wss:'?'https:':'http:'
	}catch{}
	(u?typeof u=='string'?LocalSocket.getOptions(u).then(obj => {
		if(cb != play){
			name.textContent = obj.name
			motd.textContent = obj.motd[Math.floor(Math.random()*obj.motd.length)]
			icon.src = obj.icon || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAIBAAA'
			if(obj.banner) node.css({background: 'linear-gradient(75deg, #000a 80rem, #0001 100%), url("'+CSS.escape(obj.banner)+'") center/cover'})
		}
		cb(n={ip:u+'', timeOff:0, displayIp, name: obj.name, host: ''})
	}):fetch(u+'preview').then(a=>a.arrayBuffer()).then(dat => {
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
		cb(n={ip, timeOff, displayIp, name: nameString, host: u.host})
	}):Promise.reject()).catch(err => {
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
					if(typeof u == 'string') worldoptions(u)
					else window.open(ip.replace('ws', 'http'), '_blank','width=1024,height=768,left='+screenX+',top='+screenY)
				},'tiny').css({lineHeight:'16rem'}),
				Btn('^', () => {
					const i = node.parentElement.children.indexOf(node)
					if(!i) return
					swapServers(servers[i-1], displayIp)
				},'tiny').css({lineHeight:'24rem'}),
				Btn(typeof u == 'string' ? 'E' : 'x', async () => {
					if(typeof u == 'string') exportWorld(u, n?.name)
					else if(node.parentElement) rmServer(displayIp)
				},'tiny')
			),
			motd = Label(texts.connection.connecting()).css({opacity: .5})
		)
	)
	node.classList.add('selectable')
	node.onclick = () => {click(); play(n)}
	return node
}

let blurred = false, notifs = 0

globalThis.notif = () => {
	if(!blurred || !ws) return
	document.title = texts.misc.title.notification(lastN.name, ++notifs)
	ping()
}

onfocus = () => {
	blurred = false
	notifs = 0
	document.title = ws ? texts.misc.title.playing(lastN.name) : texts.misc.title.menu()
	win?.postMessage(Infinity, '*')
}
onblur = () => { blurred = true; win?.postMessage(Infinity, '*') }
export const clearNotifs = () => {
	notifs = 0
	document.title = ws ? texts.misc.title.playing(lastN.name) : texts.misc.title.menu()
}

export async function play(n){
	if(!n || !iReady) return
	lastN = n
	let timeout = -1
	if(!n.host){
		globalThis.ws = new LocalSocket(n.ip)
	}else{
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
		timeout = setTimeout(ws.close.bind(ws), 5000)
		ws.onopen = () => (clearTimeout(timeout),ws.send(p),timeout = -1)
	}
	ws.onmessage = ({data}) => {
		if(typeof data == 'string') return pendingConnection(texts.connection.authenticating())
		gameIframe(pako.inflate(data, {to: 'string'}).split('\0'))
		ws.onmessage = fwPacket
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
	ws.onclose = null
	ws.close()
	ws = null
	clearNotifs()
	onfocus()
	destroyIframe()
}