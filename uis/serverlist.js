import { finished, preconnect } from '../js/connectme.js'
import { storage } from '../js/save.js'
import { Div, Input, Label, Row, showUI, Spacer, ui, UI, IconBtn } from '../js/ui.js'
import texts from '../js/lang.js'
import { worldoptions } from './worldoptions.js'
import { iframe, LocalSocket } from '../js/iframe.js'
import { onFrame } from '../js/events.js'
import { settings, importMap } from './settings.js'

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
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAFhJREFUKFO9UlsKACAMyvsfelGwcEt6ENRfTpniUMQzM3MYADJlAI3oBCXieRdl0u4fNimrjLmT4Jc3TDkoGxSRw8v5PxF7P87kopUgF/3e09VF5E52t1cBeF9gAg+pOQwAAAAASUVORK5CYII', texts.serverlist.settings(), () => settings()).flex(0, 80),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANAQMAAABIJXY/AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURUdwTP///5+UokMAAAABdFJOUwBA5thmAAAALUlEQVQI12NgYGDg72CQv8EkqcBYwMHA8IPpL5BgYPpRwPjjBcvzh8wKN4FKALeRC0VbvhO6AAAAAElFTkSuQmCC', texts.serverlist.refresh(), serverlist).flex(0, 80),
	).css({alignSelf: 'stretch', alignItems: 'center', paddingLeft: '11rem', flexWrap: 'wrap', pointerEvents: 'all'}),
	list = Div('serverlist', addRow = Row(
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAElJREFUKFNj/P///38GNMDIyMgIE8IqDxJEV0SQT19NJPsJ2cPIfkE3CNkbeEMJlwvgmvCZjKEZm2J8fgTJYdhEKAoGgSZCfgIA/uxv+rFAzjUAAAAASUVORK5CYIIA', texts.serverlist.add_server()),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANAQMAAABIJXY/AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURUdwTP///5+UokMAAAABdFJOUwBA5thmAAAAKElEQVQI12NgUGAAon8/GBoUGPqAiIFhvgIItSgwtC9g2L8AJP7/AQC3kws6EzM38QAAAABJRU5ErkJggg', texts.serverlist.new_world()),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAFdJREFUKFOtUkEOACAIiv8/2mYbmzPUQ3VEQdCwimdmBgCqLEFvHEneQEWqR1Kun0lKtcPeSdFGXoDb5vRrkiLmnNKeWkzM/p6pOjTxMlNH/EOarMUfswEPpHgOzXREwwAAAABJRU5ErkJggg', texts.serverlist.import())
	)).css({pointerEvents: 'none'})
).css({pointerEvents: 'none'})
addRow.firstChild.on('click', () => {addRow.replaceWith(input); input.focus()}).classList.add('selectable')
addRow.children[1].on('click', ()=>{worldoptions()}).classList.add('selectable')
addRow.lastChild.on('click', importMap).classList.add('selectable')

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