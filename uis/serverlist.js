import { finished, preconnect } from '../js/connectme.js'
import { storage } from '../js/save.js'
import { Btn, Div, Input, Label, Row, showUI, Spacer, ui, UI, Img, click } from '../js/ui.js'
import texts from '../js/lang.js'
import { worldoptions } from './worldoptions.js'
import { login } from './login.js'
import { decoder } from '../server/modules/dataproto.js'
import { iframe, LocalSocket, skin } from '../js/iframe.js'
import { onFrame } from '../js/events.js'

if(!storage.skin) storage.skin = Math.random() > .5 ? "缀\x7f罿缀\x7f孛缀\x7f罿缀\x7f罿缀\x7f罿缀\x7f罿⠰ひ爨Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0缀\x7f桨栀h罿栀h桨栀h罿缀\x7f桨栀h罿⠰♲嬡Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h桨栀h罿缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0嬀[桨栀h孛缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h孛嬀[孛徖陁䅟徖蝁㭕徖陁䅟徖蝁㭕⠰♲嬡⠰ひ爨⠰♲嬡⠰ひ爨ᬨ⠊ਛᨦ✊ଛᰩ㈌ဣ\u202dⴐဠ嬀[孛嬀[桨徖陁䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰♲嬡Ωせ爨ᬨ⠊ਛᨦ☊ਚḬ⤎జḫ㌍ᄤ栀h孛嬀[桨喇阻䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨Ḭ☎ଘᨦ⤊జḫ⠎ଛᠤ⤊జ缀\x7f桨栀h罿喇阻䅟徖陁䅟喇阻䅟喇阻䅟⠰ひ爨⠰ひ爨⠰ひ爨Ωせ爨ᬨ⠊ചᴭⰎพᬨ✊ଛḬ⼎ᄢ缀\x7f桨栀h罿喇阻䅟喇阻䅟喇阻䅟徖陁䅟⠰ひ爨⠰ひ爨⠰ひ爨⠰ひ爨ᬨ⠊ਛᬨ☊చᜣ蜉㩘掜㩅ᐨ缀\x7f桨缀\x7f罿徖陁䅟喇阻䅟徖陁䅟徖陁䅟㼿㼿㼿⠰ひ爨㼿㼿㼿⠰ひ爨ᬨ⠊ਛᨨ☍ଘḬ萑ㅒ徖衁㥚⠰♲嬡⠰♲嬡徖陁䅟喇阻䅟徖蝁㭕徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿Ḭ⠎ਛᴭ戎⽃檝驏䑣历甴⽇⠰♲嬡⠰ひ爨徖陁䅟徖陁䅟徖陁䅟徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿历蘴㑓掚虄㑓果陈䅟妊琻⽈" : "띻筸碷띻筸碱녻筸碷녻筸碱녻筸碷녻䖚녻筸碷띻筸碱䍨搬⠿䍨搬⠿\0\0\0\0\0\0\0\0\0\0\0\0띻筸碷녻筸碱녻筸碱녻筸碷녻筸碱녻䮟㽤笨碱녻桸ⱃ㽤栨ⱃ㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷녻筸碱녻筸碷띻筸碷녻筸碷띻筸碷㽤栨ⱃ㽤栨ⱃ㽤栨ⱃ㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷녻筸碱莁衚把誈腢媃莁衚把誈腢媃㽤搨⠿㽤栨ⱃ㽤搨⠿㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷띻筸碷쫥꧊쫥꧊쫥꧊쫥꧊㽤搨⠿㽤搨⠿㽤搨⠿㽤搨⠿髦㶎鿩䖚鿩䮟鿩㶎녻筸碷녻筸碷쫥꧊퓬뗔쫥꧊퓬뗔㠸㠸㠸㠸搸⠿㠸㠸㠸㠸搸⠿軦䖚髦㶎髦㶎軦䖚녻筸碷녻筸碷쫥뗔퓬뗔쫥뗔퓬뗔䝇䝇䝇䝇㡇㠸䝇䝇䝇䝇㡇㠸鿩䮟軦䖚軦䖚鿩䖚띻筸碷띻筸碷헭뗔헭뗔헭뗔헭뿚䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇髦\udd45㦔髦䖚鿩\udd4b㦔铝䖚㔑ጎሽ㔑ጎሽ헭뫕헭뫕헭뫕헭뫕䝇䝇䝇㠸䜸䝇䝇䝇䝇㠸䜸䝇铝䖚髦䖚铝뗔퓬\uddb5㦔띻筸碱띻筸碱헭뫕\udbef샛헭뫕\udbef뫕䱌䱌䱌兑㡑㠸䱌䱌䱌兑㡑㠸铝㶎鿩\udd4b㦔퓬쏞\udbf2볛띻筸碱띻筸碱\udbef샛헭샛\udbef뫕\udbef뫕䱌䱌䱌兑屑屜䱌䱌䱌兑屑屜軦䖚鿩䖚퓬볛\udef2쏞녻筸碷띻筸碱헭뿚헭샛\udbef뗔헭뫕㴽㴽㴽㴽尽屜㴽㴽㴽㴽尽屜髦㶎髦뗔퓬쏞\udbf2볛"

export const servers = (storage.servers || 
	(/.github.io$|.pages.dev$/.test(location.hostname) ? 'blobk.at' : /(.|^)localhost$|^127.0.0.1$|^[::1]$/.test(location.hostname) ? 'localhost' : location.hostname)).split('\n')

indexedDB.databases().then(arr => {for(const s of arr) if(s.name[0]=='@'&&!servers.includes(s.name)) addServer(s.name)})

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

const i = document.createElement('input')
i.type = 'file'
const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true})
ctx.width = 28
ctx.height = 12
const skin16 = new Uint16Array(skin.buffer)
for(let i = 0; i < 1008; i+=2) skin[i] = storage.skin.charCodeAt(i>>1), skin[i+1] = storage.skin.charCodeAt(i>>1)>>8
async function getSkin(){
	i.accept = 'image/*'
	if(i.onchange) i.onchange()
	i.click()
	if(!await new Promise(r => i.onchange = r) || !i.files.length) return ''
	const img = new Image()
	if((await new Promise(r => {
		img.onload = r
		img.onerror = r
		img.src = URL.createObjectURL(i.files[0])
	})).type == 'error') return texts.serverlist.skin.not_an_image()
	if(img.width == 64 && img.height == 64){
		//body
		ctx.drawImage(img, 16, 20, 4, 12, 0, 0, 4, 12)
		ctx.drawImage(img, 16, 36, 4, 12, 0, 0, 4, 12)
		//left (front) arm
		ctx.drawImage(img, 32, 52, 4, 12, 8, 0, 4, 12)
		ctx.drawImage(img, 48, 52, 4, 12, 8, 0, 4, 12)
		//right (back) arm
		ctx.drawImage(img, 40, 20, 4, 12, 4, 0, 4, 12)
		ctx.drawImage(img, 40, 36, 4, 12, 4, 0, 4, 12)
		//left (front) leg
		ctx.drawImage(img, 0, 20, 4, 12, 12, 0, 4, 12)
		ctx.drawImage(img, 0, 36, 4, 12, 12, 0, 4, 12)
		//right (back) leg
		ctx.drawImage(img, 16, 52, 4, 12, 16, 0, 4, 12)
		ctx.drawImage(img, 0, 52, 4, 12, 16, 0, 4, 12)
		//head
		ctx.drawImage(img, 0, 8, 8, 8, 20, 4, 8, 8)
		ctx.drawImage(img, 32, 8, 8, 8, 20, 4, 8, 8)
	}else if(img.width == 64 && img.height == 32){
		//body
		ctx.drawImage(img, 16, 20, 4, 12, 0, 0, 4, 12)
		//left (front) arm
		ctx.drawImage(img, 32, 20, 4, 12, 4, 0, 4, 12)
		//right (back) arm
		ctx.drawImage(img, 40, 20, 4, 12, 4, 0, 4, 12)
		//left (front) leg
		ctx.drawImage(img, 0, 20, 4, 12, 16, 0, 4, 12)
		//right (back) leg
		ctx.drawImage(img, 8, 20, 4, 12, 16, 0, 4, 12)
		//head
		ctx.drawImage(img, 0, 8, 8, 8, 20, 4, 8, 8)
	}else if(img.width == 28 && img.height == 12){
		ctx.drawImage(img, 0, 0)
	}else return texts.serverlist.skin.wrong_size()
	const {data} = ctx.getImageData(0, 0, 28, 12)
	for(let i = 0; i < 336; i++){
		skin[i * 3] = data[i << 2]
		skin[i * 3 + 1] = data[(i << 2) + 1]
		skin[i * 3 + 2] = data[(i << 2) + 2]
	}
	storage.skin = String.fromCharCode.apply(null, skin16)
	drawSkin()
	return texts.serverlist.skin.successful()
}
const skinCtx = document.createElement('canvas').getContext('2d')
skinCtx.canvas.width = skinCtx.canvas.height = 8
function drawSkin(){
	const head = new ImageData(8, 8)
	for(let i = 396, j = 0; j < 256; i+=3,j+=4){
		if(!(i%84)) i+=60
		head.data[j] = skin[i]
		head.data[j+1] = skin[i+1]
		head.data[j+2] = skin[i+2]
		head.data[j+3] = 255
	}
	skinCtx.putImageData(head,0,0)
}
drawSkin()
let list, selectSkinBtn, logoutBtn, addRow, nameLabel, input = Input('text', texts.serverlist.add_server.placeholder())
input.on('keypress', e => {
	if(e.keyCode != 13) return
	if(input.value&&input.value[0]!='@') addServer(input.value)
	input.value='', input.blur()
}).on('blur', () => {input.replaceWith(addRow)}).css({margin: '9rem auto'})
const serverList = UI('dirtbg serverlist',
	Spacer.grow(1),
	Row(
		Label(texts.serverlist.welcome()),
		skinCtx.canvas.css({height:'16rem',alignSelf:'center',marginLeft:'3rem'}),
		nameLabel = Label().css({color: '#E92'}),
		selectSkinBtn = Label(texts.serverlist.select_skin()).css({color: '#888', textDecoration: 'underline', cursor: 'pointer'}),
		logoutBtn = Label(texts.serverlist.logout()).css({color: '#888', textDecoration: 'underline', cursor: 'pointer'})
	).css({pointerEvents: 'all'}),
	Spacer.grow(1),
	Row(
		Label(texts.serverlist.select()),
		Spacer.grow(1),
		Btn(texts.serverlist.hosting_info(), () => window.open('https://github.com/open-mc/server','_blank'), 'small'),
		Btn(texts.serverlist.refresh(), serverlist, 'small')
	).css({alignSelf: 'stretch', justifyContent: 'space-between', paddingLeft: '11rem', flexWrap: 'wrap', pointerEvents: 'all'}),
	list = Div('serverlist', addRow = Row(
		Div('', Img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAElJREFUKFNj/P///38GNMDIyMgIE8IqDxJEV0SQT19NJPsJ2cPIfkE3CNkbeEMJlwvgmvCZjKEZm2J8fgTJYdhEKAoGgSZCfgIA/uxv+rFAzjUAAAAASUVORK5CYIIA').css({minWidth: '13rem', height: '13rem', verticalAlign: '-45%'}), texts.serverlist.add_server()),
		Div('', Img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANAQMAAABIJXY/AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURUdwTP///5+UokMAAAABdFJOUwBA5thmAAAAKElEQVQI12NgUGAAon8/GBoUGPqAiIFhvgIItSgwtC9g2L8AJP7/AQC3kws6EzM38QAAAABJRU5ErkJggg').css({minWidth: '13rem', height: '13rem', verticalAlign: '-33%'}), texts.serverlist.new_world()),
		Div('', Img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAFdJREFUKFOtUkEOACAIiv8/2mYbmzPUQ3VEQdCwimdmBgCqLEFvHEneQEWqR1Kun0lKtcPeSdFGXoDb5vRrkiLmnNKeWkzM/p6pOjTxMlNH/EOarMUfswEPpHgOzXREwwAAAABJRU5ErkJggg').css({minWidth: '13rem', height: '13rem', verticalAlign: '-40%'}), texts.serverlist.import())
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
selectSkinBtn.classList.add('selectable')
selectSkinBtn.onclick = btn => getSkin().then(a => {
	if(!a) return
	btn.textContent = a
	setTimeout(() => btn.textContent = texts.serverlist.select_skin(), 2000)
})
logoutBtn.classList.add('selectable')
logoutBtn.onclick = () => {
	click()
	delete storage.name
	delete storage.privKey
	delete storage.pubKey
	delete storage.authSig
	login()
}

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
	nameLabel.text = storage.name
	showUI(serverList)
}
onFrame.push(() => {
	if(ui != serverList) return void(iframe.style.inset = iframe.style.width = iframe.style.height = '')
	const box = list.firstChild.getBoundingClientRect()
	iframe.style.inset = `${box.top}px 0 0 ${box.left}px`
	iframe.style.width = box.width+'px'
	const n = list.children[list.children.length-1]
	iframe.style.height = (n.offsetTop - list.firstChild.offsetTop)+'px'
})
let serverNode = null
export function serverClicked(n){
	let pressed = n < 0
	if(pressed) n = -1-n
	n += list.children[0].offsetTop
	serverNode?.classList.remove('hover')
	if(n != n) return
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