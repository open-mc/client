import { finished, preconnect, skin } from "../connectme.js"
import { addServer, onServer, servers, storage } from "../save.js"
import { Btn, Div, Input, Label, Row, showUI, Spacer, ui, UI } from "../ui.js"
import { STEVE, ALEX } from "./defaultSkins.js"

let list, input, addBtn

const i = document.createElement('input')
i.type = 'file'
const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true})
ctx.width = 28
ctx.height = 12
const skin16 = new Uint16Array(skin.buffer)
if(!storage.skin)storage.skin = Math.random() > .5 ? STEVE : ALEX
for(let i = 0; i < 504; i++) skin16[i] = storage.skin.charCodeAt(i)
async function getSkin(accept){
	i.accept = accept
	if(i.onchange)i.onchange()
	i.click()
	if(!await new Promise(r => i.onchange = r) || !i.files.length)return ''
	const img = new Image()
	if((await new Promise(r => {
		img.onload = r
		img.onerror = r
		img.src = URL.createObjectURL(i.files[0])
	})).type == 'error')return 'Not an image!'
	if(img.width != 28 || img.height != 12)return 'Wrong size!'
	ctx.drawImage(img, 0, 0)
	const {data} = ctx.getImageData(0, 0, 28, 12)
	for(let i = 0; i < 336; i++){
		skin[i * 3] = data[i << 2]
		skin[i * 3 + 1] = data[(i << 2) + 1]
		skin[i * 3 + 2] = data[(i << 2) + 2]
	}
	storage.skin = String.fromCharCode.apply(null, skin16)
	return 'Done!'
}

const serverList = UI('dirtbg',
	Label('Welcome, ' + storage.name + '!').attr('style', 'color: #E92'),
	Label('Connect to a server:'),
	Spacer(50),
	Row(Btn('Select skin', btn => getSkin().then(a => {
		if(!a)return
		btn.textContent = a
		setTimeout(() => btn.textContent = 'Select skin', 2000)
	})), Btn('Refresh', serverlist)).attr('style', 'align-self: stretch; justify-content: space-between; padding: 8rem'),
	list = Div('serverlist'),
	Spacer(20),
	Row(input = Input('text', 'server ip'), addBtn = Btn('Add server', () => {if(input.value=='server ip')return input.value = 'very funny';else if(input.value=='very funny')return;addServer(input.value);input.value='';addBtn.disabled=true}, 'small disabled'))
)
input.oninput = () => {addBtn.disabled = !input.value}

serverList.finish = () => {
	for(const node of list.children) node.end()
}

onServer(ip => {
	if(ui == serverList) list.append(preconnect(ip))
})

export function serverlist(){
	finished()
	showUI(null)
	for(const ip of servers){
		list.append(preconnect(ip))
	}
	showUI(serverList)
}