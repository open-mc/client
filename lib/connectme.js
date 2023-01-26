import { codes, onstring } from "./incomingPacket.js"
import { DataReader } from "./data.js"
import "../uis/chat.js"
import sounds, { queue } from "../ui/sounds.js"
import { msg, reconn } from "../uis/dirtscreen.js"
import { Btn, Div, Img, Label, Row } from "../ui/ui.js"
import { saveServers, storage } from "../save.js"
import { servers } from "../save.js"
let lastIp = null
globalThis.ws = null

async function makeSign(challenge){
	const a = atob(storage.privKey)
	const b = new Uint8Array(a.length)
	for(let i = 0; i < a.length; i++)b[i] = a.charCodeAt(i)
	const k = await crypto.subtle.importKey('pkcs8', b.buffer, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign'])
	return new Uint8Array(await crypto.subtle.sign(k.algorithm.name, k, challenge))
}
export function preconnect(ip, cb = Function.prototype){
	const displayIp = ip
	if(!/\w+:\/\//y.test(ip))ip = (location.protocol == 'http:' ? 'ws://' : 'wss://') + ip
	if(!/:\d+$/.test(ip))ip += ':27277'
	let ws
	try{
		ws = new WebSocket(`${ip}/${storage.name}/${encodeURIComponent(storage.pubKey)}/${encodeURIComponent(storage.authSig)}`)
	}catch(e){ws = {close(){}}}
	ws.challenge = null
	ws.binaryType = 'arraybuffer'
	const timeout = setTimeout(ws.close.bind(ws), 5000)
	ws.onmessage = function({data}){
		if(ws != globalThis.ws){
			const packet = new DataReader(data)
			name.textContent = packet.string()
			motd.textContent = packet.string()
			icon.src = packet.string()
			ws.challenge = new Uint8Array(packet.buffer, packet.byteLength - packet.left)
			cb(ws, ip)
			return
		}
		if(typeof data == 'string')return void onstring(data)
		const packet = new DataReader(data)
		const code = packet.byte()
		if(!codes[code])return
		codes[code](packet)
	}
	ws.onclose = () => {
		if(ws == globalThis.ws){
			const msg = me._id < 0 ? 'Connection refused' : 'Connection lost'
			finished()
			reconn(msg)
			return
		}
		icon.src = './img/no.png'
		motd.textContent = ws instanceof WebSocket ? 'Failed to connect' : 'Invalid IP'
		motd.style.color = '#d22'
		name.textContent = displayIp
	}
	ws.onopen = clearTimeout.bind(window, timeout)
	let name, motd, icon
	const node = Row(
		icon = Img('./img/no.png'),
		Div('',
			Row(name = Label(displayIp),Btn('x',() => {
				servers.splice(node.parentElement.children.indexOf(node), 1)
				node.remove()
				saveServers()
			},'tiny')),
			motd = Label('connecting...').attr('style', 'opacity: 0.5')
		)
	)
	node.onclick = () => {sounds.click(); play(ws, ip)}
	node.end = () => {if(ws != globalThis.ws) ws.close(); node.remove()}
	if(!(ws instanceof WebSocket))ws.onclose()
	return node
}
export async function play(ws, ip){
	lastIp = ip
	if(!ws.challenge)return
	const signature = await makeSign(ws.challenge)
	ws.send(signature)
	globalThis.ws = ws
	msg('Authenticating...')
}
export function reconnect(){
	if(!lastIp)return
	preconnect(lastIp, play)
}
export function finished(){
	if(!ws)return
	queue('', true)
	me._id = -1
	chat.innerHTML = ''
	for(const ch of map.values())if(ch.node)ch.node.remove()
	map.clear()
	for(const e of entities.values())if(e.node)e.node.remove()
	entities.clear()
	ws.onclose = Function.prototype
	ws.close()
	ws = null
}