import { DataReader, decoder } from '/server/modules/dataproto.js'
import "../uis/chat.js"
import { msg, pendingConnection, reconn } from '../uis/dirtscreen.js'
import { Btn, click, Div, Img, Label, ping, Row } from './ui.js'
import { servers, saveServers, storage, options } from './save.js'
import { destroyIframe, fwPacket, gameIframe } from './iframe.js'
import { PROTOCOL_VERSION } from '../version.js'
let lastIp = null
globalThis.ws = null

export const skin = new Uint8Array(1008)

async function makeSign(challenge){
	const a = atob(storage.privKey)
	const b = new Uint8Array(a.length)
	for(let i = 0; i < a.length; i++)b[i] = a.charCodeAt(i)
	const k = await crypto.subtle.importKey('pkcs8', b.buffer, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign'])
	return new Uint8Array(await crypto.subtle.sign(k.algorithm.name, k, challenge))
}
const onerror = function(str){
	finished()
	const code = parseInt(str.slice(0,2), 16)
	reconn(str.slice(2), code)
}
const onpending = function(str){
	const code = parseInt(str.slice(0,2), 16)
	pendingConnection(str.slice(2), code)
}
let blurred = false, notifs = 0

function notif(){
	if(!blurred || !ws) return
	document.title = '(🔴' + (++notifs) + ') ' + ws.name + ' | pMC'
	ping()
}

onfocus = () => {
	blurred = false
	notifs = 0
	document.title = ws ? ws.name + ' | pMC' : 'Paper Minecraft'
}
onblur = () => blurred = true

const unencrypted = /^(localhost|127.0.0.1|0.0.0.0|\[::1\])$/i

const pingRegex = new RegExp('@' + storage.name + '(?!\\w)', 'i')

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

export function preconnect(ip, cb = Function.prototype){
	const displayIp = ip
	if(!/:\d+$/.test(ip))ip += ':27277'
	if(ip.startsWith('localhost:')) ip = 'wss://local.blobk.at' + ip.slice(9)
	else if(!/\w+:\/\//y.test(ip))ip = (location.protocol == 'http:' || unencrypted.test(ip) ? 'ws://' : 'wss://') + ip
	ip = ip.replace(/((?:[^./:;\\|{}[\]()@?#&^<>\s~`"']+\.)*[^./:;\\|{}[\]()@?#&^<>\s~`"']+)\.(\w+(?=:))/, (_,d,a)=>a == 'hash' | a == 'hash4' ? hashv4(d) : a == 'hash6' ? hashv6(d) : a == 'hash8' ? hashv8(d) : (a in TLD_MAP) ? d+'-mc.'+TLD_MAP[a] : d+'.'+a)
	let ws
	try{
		ws = new WebSocket(`${ip}/${storage.name}/${encodeURIComponent(storage.pubKey)}/${encodeURIComponent(storage.authSig)}`)
		ws.ip = ip
	}catch(e){ws = {close(){this.onclose&&this.onclose()},ip}}
	ws.challenge = null
	ws.binaryType = 'arraybuffer'
	let timeout = setTimeout(ws.close.bind(ws), 5000)
	ws.onmessage = function({data}){
		if(ws != globalThis.ws){
			const packet = new DataReader(data)
			name.textContent = ws.name = packet.string()
			motd.textContent = packet.string()
			icon.src = packet.string()
			ws.packs = decoder.decode(pako.inflate(packet.uint8array())).split('\0')
			ws.challenge = packet.uint8array()
			const host = decoder.decode(ws.challenge.subarray(0, ws.challenge.indexOf(0))).toLowerCase()
			if(host != ip.replace(/\w+:\/\//y,'').toLowerCase()) return void ws.close() // mitm attack
			cb(ws)
			return
		}
		ws.challenge = null
		if(typeof data === 'string'){
			const style = parseInt(data.slice(0,2), 16)
			if(style === -1) return onerror(data.slice(2))
			else if(style === -2) return onpending(data.slice(2))
			else if(style === -3){
				let i = data.indexOf(';')
				pendingConnection(data.slice(i+3), parseInt(data.slice(i+1,i+3), 16))
				i = Math.min(60e3, +data.slice(2, i) || 1000)
				setTimeout(() => preconnect(displayIp, play), i)
				finished()
				return
			}
			if(style != style) return
			const box = chat.children[9] || document.createElement('div')
			box.textContent = data.slice(2)
			chat.insertAdjacentElement('afterbegin', box)
			box.classList = `c${style&15} s${style>>4}`
			const {color, fontStyle, fontWeight, textDecoration} = getComputedStyle(box)
			console.log('%c' + data.slice(2), 'color:'+color+';font:12px/12px mc,monospace;font-weight:'+fontWeight+';font-style:'+fontStyle+';text-decoration:'+textDecoration)
			if(options.notifs === 2 || (options.notifs === 1 && pingRegex.test(box.textContent))) notif()
		}else fwPacket(data)
	}
	ws.onclose = () => {
		if(ws === globalThis.ws){
			const msg = timeout >= 0 ? 'Connection refused' : 'Connection lost'
			finished()
			reconn(msg)
			return
		}
		icon.src = './img/no.png'
		motd.textContent = ws instanceof WebSocket ? 'Failed to connect' : 'Invalid IP'
		motd.style.color = '#d22'
		name.textContent = displayIp
	}
	ws.onopen = () => (clearTimeout(timeout), timeout = -1)
	let name, motd, icon
	const node = Row(
		icon = Img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAAXNSR0IArs4c6QAAACZJREFUKFNjZCACMBKhhoEGijo6Ov5XVFQwotMg59DAOny+JMo6AMVLDArhBOpkAAAAAElFTkSuQmCC'),
		Div('',
			Row(
				name = Label(displayIp),
				Btn('...', () => {
					window.open(ip.replace('ws', 'http'), '_blank')
				},'tiny').attr('style','line-height:1.5'),
				Btn('^', () => {
					const i = node.parentElement.children.indexOf(node)
					if(!i) return
					const s = servers[i]
					servers[i] = servers[i-1]
					servers[i-1] = s
					node.parentElement.insertBefore(node, node.parentElement.children[i-1])
					saveServers()
				},'tiny').attr('style','line-height:2.2'),
				Btn('x', () => {
					servers.splice(node.parentElement.children.indexOf(node), 1)
					node.remove()
					saveServers()
				},'tiny')
			),
			motd = Label('Connecting...').attr('style', 'opacity: 0.5')
		)
	)
	node.onclick = () => {click(); play(ws)}
	node.end = () => {if(ws != globalThis.ws) ws.close(); node.remove()}
	if(!(ws instanceof WebSocket))ws.onclose()
	return node
}

export async function play(ws){
	lastIp = ws.ip
	if(!ws.challenge) return
	const signature = await makeSign(ws.challenge)
	const packet = new Uint8Array(signature.length + skin.length + 2)
	packet[0] = PROTOCOL_VERSION >> 8
	packet[1] = PROTOCOL_VERSION
	packet.set(skin, 2)
	packet.set(signature, skin.length + 2)
	ws.send(packet)
	globalThis.ws = ws
	onfocus()
	pendingConnection('Authenticating...')
	gameIframe(ws.packs)
}
const urlServer = location.search.slice(1)
if(urlServer) preconnect(urlServer, play)
export function reconnect(){
	if(!lastIp) return
	preconnect(lastIp, play)
}
export function finished(){
	if(!ws) return
	chat.innerHTML = ''
	ws.onclose = Function.prototype
	ws.close()
	ws = null
	notifs = 0
	onfocus()
	destroyIframe()
}