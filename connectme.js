import { DataReader, decoder } from './data.js'
import "./uis/chat.js"
import { msg, pendingConnection, reconn } from './uis/dirtscreen.js'
import { Btn, click, Div, Img, Label, ping, Row } from './ui.js'
import { servers, saveServers, storage, options } from './save.js'
import { destroyIframe, fwPacket, gameIframe } from './iframe.js'
import { PROTOCOL_VERSION } from './version.js'
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

export function preconnect(ip, cb = Function.prototype){
	const displayIp = ip
	if(!/\w+:\/\//y.test(ip))ip = (location.protocol == 'http:' || unencrypted.test(ip) ? 'ws://' : 'wss://') + ip
	if(!/:\d+$/.test(ip))ip += ':27277'
	let ws
	try{
		ws = new WebSocket(`${ip}/${storage.name}/${encodeURIComponent(storage.pubKey)}/${encodeURIComponent(storage.authSig)}`)
	}catch(e){ws = {close(){this.onclose&&this.onclose()}}}
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
			cb(ws)
			return
		}
		ws.challenge = null
		if(typeof data == 'string'){
			const style = parseInt(data.slice(0,2), 16)
			if(style == -1) return onerror(data.slice(2))
			else if(style == -2) return onpending(data.slice(2))
			if(style != style) return
			const box = chat.children[9] || document.createElement('div')
			box.textContent = data.slice(2)
			chat.insertAdjacentElement('afterbegin', box)
			box.classList = `c${style&15} s${style>>4}`
			if(options.notifs == 2 || (options.notifs == 1 && pingRegex.test(box.textContent))) notif()
		}else fwPacket(data)
	}
	ws.onclose = () => {
		if(ws == globalThis.ws){
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
				Btn('^', () => {
					const i = node.parentElement.children.indexOf(node)
					if(!i) return
					const s = servers[i]
					servers[i] = servers[i-1]
					servers[i-1] = s
					node.parentElement.insertBefore(node, node.parentElement.children[i-1])
					saveServers()
				},'tiny').attr('style','line-height:2.2'), // Omg 2.2 reference??
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
	lastIp = ws.url
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