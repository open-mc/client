import { finished, preconnect } from '../js/connectme.js'
import { storage } from '../js/save.js'
import { Div, Input, Label, Row, showUI, Spacer, ui, UI, click, IconBtn } from '../js/ui.js'
import texts from '../js/lang.js'
import { worldoptions } from './worldoptions.js'
import { decoder } from '../server/modules/dataproto.js'
import { iframe, LocalSocket } from '../js/iframe.js'
import { onFrame } from '../js/events.js'
import { settings } from './settings.js'

export const servers = (storage.servers || 
	(/.github.io$|.pages.dev$/.test(location.hostname) ? 'blobk.at' : /(.|^)localhost$|^127.0.0.1$|^[::1]$/.test(location.hostname) ? 'localhost' : location.hostname)).split('\n')

indexedDB.databases?.().then(arr => {for(const s of arr) if(s.name[0]=='@') addServer(s.name)})

const bc = globalThis.BroadcastChannel ? new BroadcastChannel('servers') : null
bc && (bc.onmessage = ({data}) => {
	const i = data.indexOf('\n')
	if(i==0) rmServer(data.slice(1), 0)
	else if(i==-1) addServer(data, 0)
	else swapServers(data.slice(0,i),data.slice(i+1),0)
})
export function rmServer(ip, s=1){
	const i = servers.indexOf(ip)
	if(i < 0) return
	servers.splice(i, 1)
	if(ip[0] == '@') LocalSocket.deleteWorld(ip)
	if(ui == serverList) list.children[i].remove()
	if(s) storage.servers = servers.join('\n'), bc?.postMessage('\n'+ip)
}
export function addServer(ip, s=1){
	if(servers.includes(ip)) return
	servers.push(ip)
	if(ui == serverList) list.insertBefore(preconnect(ip), list.lastChild)
	if(s) storage.servers = servers.join('\n'), bc?.postMessage(ip)
}
export function swapServers(ip1, ip2, s=1){
	let a = servers.indexOf(ip1), b = servers.indexOf(ip2)
	if(a<0||b<0) return
	if(a>b){const t=a;a=b;b=t}
	if(ui == serverList){
		const n = list.children[b].nextElementSibling
		const na = list.children[a]
		na.replaceWith(list.children[b])
		list.insertBefore(na, n)
	}
	const n = servers[a]; servers[a] = servers[b]; servers[b] = n
	if(s) storage.servers = servers.join('\n'), bc?.postMessage(ip1+'\n'+ip2)
}

let list, addRow, welcomeLabel, input = Input('text', texts.serverlist.add_server.placeholder())
input.on('keypress', e => {
	if(e.keyCode != 13) return
	if(input.value&&input.value[0]!='@') addServer(input.value)
	input.value='', input.blur()
}).on('blur', () => {input.replaceWith(addRow)}).css({margin: '9rem auto'})
const serverList = UI('serverlist',
	Row(
		welcomeLabel = Label(),
		Spacer.grow(1),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAFhJREFUKFO9UlsKACAMyvsfelGwcEt6ENRfTpniUMQzM3MYADJlAI3oBCXieRdl0u4fNimrjLmT4Jc3TDkoGxSRw8v5PxF7P87kopUgF/3e09VF5E52t1cBeF9gAg+pOQwAAAAASUVORK5CYII', texts.serverlist.settings(), () => (click(),settings())).flex(0, 80),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANAQMAAABIJXY/AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURUdwTP///5+UokMAAAABdFJOUwBA5thmAAAALUlEQVQI12NgYGDg72CQv8EkqcBYwMHA8IPpL5BgYPpRwPjjBcvzh8wKN4FKALeRC0VbvhO6AAAAAElFTkSuQmCC', texts.serverlist.refresh(), serverlist).flex(0, 80),
	).css({alignSelf: 'stretch', alignItems: 'center', paddingLeft: '11rem', flexWrap: 'wrap', pointerEvents: 'all'}),
	list = Div('serverlist', addRow = Row(
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAElJREFUKFNj/P///38GNMDIyMgIE8IqDxJEV0SQT19NJPsJ2cPIfkE3CNkbeEMJlwvgmvCZjKEZm2J8fgTJYdhEKAoGgSZCfgIA/uxv+rFAzjUAAAAASUVORK5CYIIA', texts.serverlist.add_server()),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANAQMAAABIJXY/AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURUdwTP///5+UokMAAAABdFJOUwBA5thmAAAAKElEQVQI12NgUGAAon8/GBoUGPqAiIFhvgIItSgwtC9g2L8AJP7/AQC3kws6EzM38QAAAABJRU5ErkJggg', texts.serverlist.new_world()),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAFdJREFUKFOtUkEOACAIiv8/2mYbmzPUQ3VEQdCwimdmBgCqLEFvHEneQEWqR1Kun0lKtcPeSdFGXoDb5vRrkiLmnNKeWkzM/p6pOjTxMlNH/EOarMUfswEPpHgOzXREwwAAAABJRU5ErkJggg', texts.serverlist.import())
	)).css({pointerEvents: 'none'})
).css({pointerEvents: 'none'})
addRow.firstChild.on('click', () => {click(); addRow.replaceWith(input); input.focus()}).classList.add('selectable')
addRow.children[1].on('click', ()=>{click();worldoptions()}).classList.add('selectable')
addRow.lastChild.on('click', () => {click();i.accept = '.map';i.click();i.onchange = () => {
	const s = i.files[0]?.stream().getReader(); if(!s) return
	const id = '@' + Date.now()+Math.floor(Math.random()*1e16).toString(10).padStart(16,'0')
	LocalSocket.setOptions(id, null, async db => {
		let t = null, os = null
		const inflate = new pako.Inflate()
		let left = 0, tot = 0, done = () => {
			addServer(id)
		}, tasks = 1
		let queue = null
		const next = () => {
			let i = queue.length
			if(!i) return void(t=os=null,--tasks||done?.())
			while((i-=2)>=0)
				os.put(queue[i+1], queue[i]).onsuccess = next
			queue.length = 0
		}
		inflate.onData = ch => {
			if(!ch.length) return
			let i = 0
			if(left < 0){
				if(left < -65535) tot = left = -left<<8|ch[i++]
				else if(left < -32767){
					if(ch.length-i == 1) return left = left<<8|ch[0]
					else tot = left = (-left&0x7FFF)<<16|ch[i++]<<8|ch[i++]
				}else if(left < -128){
					if(ch.length-i == 2) return left = left<<16|ch[i++]<<8|ch[i++]
					else if(ch.length-i == 1) return left = left<<8|ch[0]
					else tot = left = (-left&0x7F)<<24|ch[i++]<<16|ch[i++]<<8|ch[i++]<<4
				}else tot = left = (-left&0x3F)<<8|ch[i++]
			}
			while(i<ch.length){
				if(!left){
					const l = ch[i++]
					if(l > 63){
						if(l < 128){
							if(ch.length == i) return left = -l;
							tot = left = (l&0x3F)<<8|ch[i++]
						}else if(length < 3){
							if(ch.length == i) return left = -l
							else if(ch.length-i == 1) return left = -(l<<8|ch[i])
							else return left = -(l<<16|ch[i]<<8|ch[i+1])
						}else tot = left = (l&0x7F)<<24|ch[i++]<<16|ch[i++]<<8|ch[i++]
					}else tot = left = l
				}
				if(i >= ch.length) return
				if(i+left > ch.length){
					left -= ch.length-i
					inflate.chunks.push(ch.subarray(i))
					return
				}
				if(left) inflate.chunks.push(ch.subarray(i, i+=left)), left = 0
				let j = 0
				let ch1 = inflate.chunks[0]
				if(!queue){
					const v = new Uint8Array(tot)
					queue = []; let j = 0
					for(const c of inflate.chunks){ v.set(c, j); j += c.length }
					tasks++
					db.transaction(['meta'], 'readwrite').objectStore('meta').put(JSON.parse(decoder.decode(v)), 'config').onsuccess = () => void(--tasks||done?.())
				}else for(ch1 of inflate.chunks){
					const k = ch1.indexOf(255)
					if(k>=0){
						const u = new Uint8Array(j+k), v = new Uint8Array(tot-j-k-1)
						k&&u.set(ch1.subarray(0, k), j); j = 0
						const it = inflate.chunks.values()
						for(const c of it){ if(c==ch1)break; u.set(c, j); j+=c.length }
						const key = decoder.decode(u)
						v.set(ch1.subarray(k+1)); j=ch1.length-k-1
						for(const c of it){ v.set(c, j); j += c.length }
						if(!t){
							t = db.transaction(['db'], 'readwrite')
							os = t.objectStore('db')
							os.put(v.buffer, key).onsuccess = next
						}else queue.push(key, v.buffer)
						break
					}else j+=ch1.length
				}
				inflate.chunks.length = 0
			}
		}
		let ch; while(ch = await s.read(), !ch.done) inflate.push(ch.value)
		--tasks||done?.()
	})
}}).classList.add('selectable')

serverList.finish = () => {
	for(let i = list.childElementCount-2; i >= 0; i--) list.children[i].remove()
}

export function serverlist(){
	finished()
	showUI(null)
	const urlServer = location.hash.slice(1)
	if(urlServer) return void(location.hash='', preconnect(urlServer, play))
	for(const ip of servers){
		list.insertBefore(preconnect(ip), list.lastChild)
	}
	welcomeLabel.text = texts.serverlist.welcome(storage.name)
	showUI(serverList)
}
onFrame.push(() => {
	if(ui != serverList) return void(iframe.style.inset = iframe.style.width = iframe.style.height = '')
	const box = list.firstChild.getBoundingClientRect()
	iframe.style.inset = `${box.top}px 0 0 ${box.left}px`
	iframe.style.width = box.width+'px'
	const n = list.children[list.children.length-1]
	iframe.style.height = (n.offsetTop - list.firstChild.offsetTop - parseFloat(document.documentElement.style.fontSize)*4)+'px'
})
let serverNode = null
export function serverClicked(n){
	if(n < 4294967296)
		return list.scrollBy(0,n)
	serverNode?.classList.remove('hover')
	if(n != n) return
	const pressed = n >= 8589934592
	n = (n>>>0) + list.children[0].offsetTop
	const c = list.children.length - 1
	for(let i = 0; i < c; i++){
		const node = list.children[i]
		const y = n - node.offsetTop
		if(y < 0 || y > node.offsetHeight) continue
		if(pressed) node.click()
		else (serverNode = node).classList.add('hover')
		break
	}
}