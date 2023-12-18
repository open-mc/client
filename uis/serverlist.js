import { finished, preconnect, skin } from '../js/connectme.js'
import { addServer, onServer, servers, storage } from '../js/save.js'
import { Btn, Div, Input, Label, Row, showUI, Spacer, ui, UI } from '../js/ui.js'

if(!storage.skin)storage.skin = Math.random() > .5 ? "缀\x7f罿缀\x7f孛缀\x7f罿缀\x7f罿缀\x7f罿缀\x7f罿⠰ひ爨Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0缀\x7f桨栀h罿栀h桨栀h罿缀\x7f桨栀h罿⠰♲嬡Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h桨栀h罿缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0嬀[桨栀h孛缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h孛嬀[孛徖陁䅟徖蝁㭕徖陁䅟徖蝁㭕⠰♲嬡⠰ひ爨⠰♲嬡⠰ひ爨ᬨ⠊ਛᨦ✊ଛᰩ㈌ဣ\u202dⴐဠ嬀[孛嬀[桨徖陁䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰♲嬡Ωせ爨ᬨ⠊ਛᨦ☊ਚḬ⤎జḫ㌍ᄤ栀h孛嬀[桨喇阻䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨Ḭ☎ଘᨦ⤊జḫ⠎ଛᠤ⤊జ缀\x7f桨栀h罿喇阻䅟徖陁䅟喇阻䅟喇阻䅟⠰ひ爨⠰ひ爨⠰ひ爨Ωせ爨ᬨ⠊ചᴭⰎพᬨ✊ଛḬ⼎ᄢ缀\x7f桨栀h罿喇阻䅟喇阻䅟喇阻䅟徖陁䅟⠰ひ爨⠰ひ爨⠰ひ爨⠰ひ爨ᬨ⠊ਛᬨ☊చᜣ蜉㩘掜㩅ᐨ缀\x7f桨缀\x7f罿徖陁䅟喇阻䅟徖陁䅟徖陁䅟㼿㼿㼿⠰ひ爨㼿㼿㼿⠰ひ爨ᬨ⠊ਛᨨ☍ଘḬ萑ㅒ徖衁㥚⠰♲嬡⠰♲嬡徖陁䅟喇阻䅟徖蝁㭕徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿Ḭ⠎ਛᴭ戎⽃檝驏䑣历甴⽇⠰♲嬡⠰ひ爨徖陁䅟徖陁䅟徖陁䅟徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿历蘴㑓掚虄㑓果陈䅟妊琻⽈" : "띻筸碷띻筸碱녻筸碷녻筸碱녻筸碷녻䖚녻筸碷띻筸碱䍨搬⠿䍨搬⠿\0\0\0\0\0\0\0\0\0\0\0\0띻筸碷녻筸碱녻筸碱녻筸碷녻筸碱녻䮟㽤笨碱녻桸ⱃ㽤栨ⱃ㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷녻筸碱녻筸碷띻筸碷녻筸碷띻筸碷㽤栨ⱃ㽤栨ⱃ㽤栨ⱃ㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷녻筸碱莁衚把誈腢媃莁衚把誈腢媃㽤搨⠿㽤栨ⱃ㽤搨⠿㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷띻筸碷쫥꧊쫥꧊쫥꧊쫥꧊㽤搨⠿㽤搨⠿㽤搨⠿㽤搨⠿髦㶎鿩䖚鿩䮟鿩㶎녻筸碷녻筸碷쫥꧊퓬뗔쫥꧊퓬뗔㠸㠸㠸㠸搸⠿㠸㠸㠸㠸搸⠿軦䖚髦㶎髦㶎軦䖚녻筸碷녻筸碷쫥뗔퓬뗔쫥뗔퓬뗔䝇䝇䝇䝇㡇㠸䝇䝇䝇䝇㡇㠸鿩䮟軦䖚軦䖚鿩䖚띻筸碷띻筸碷헭뗔헭뗔헭뗔헭뿚䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇髦\udd45㦔髦䖚鿩\udd4b㦔铝䖚㔑ጎሽ㔑ጎሽ헭뫕헭뫕헭뫕헭뫕䝇䝇䝇㠸䜸䝇䝇䝇䝇㠸䜸䝇铝䖚髦䖚铝뗔퓬\uddb5㦔띻筸碱띻筸碱헭뫕\udbef샛헭뫕\udbef뫕䱌䱌䱌兑㡑㠸䱌䱌䱌兑㡑㠸铝㶎鿩\udd4b㦔퓬쏞\udbf2볛띻筸碱띻筸碱\udbef샛헭샛\udbef뫕\udbef뫕䱌䱌䱌兑屑屜䱌䱌䱌兑屑屜軦䖚鿩䖚퓬볛\udef2쏞녻筸碷띻筸碱헭뿚헭샛\udbef뗔헭뫕㴽㴽㴽㴽尽屜㴽㴽㴽㴽尽屜髦㶎髦뗔퓬쏞\udbf2볛"

const i = document.createElement('input')
i.type = 'file'
const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true})
ctx.width = 28
ctx.height = 12
const skin16 = new Uint16Array(skin.buffer)
for(let i = 0; i < 1008; i+=2) skin[i] = storage.skin.charCodeAt(i>>1), skin[i+1] = storage.skin.charCodeAt(i>>1)>>8
async function getSkin(accept){
	i.accept = accept
	if(i.onchange)i.onchange()
	i.click()
	if(!await new Promise(r => i.onchange = r) || !i.files.length) return ''
	const img = new Image()
	if((await new Promise(r => {
		img.onload = r
		img.onerror = r
		img.src = URL.createObjectURL(i.files[0])
	})).type == 'error') return 'Not an image!'
	if(img.width == 64 && img.height == 64){
		//body
		ctx.drawImage(img, 16, 20, 4, 12, 0, 0, 4, 12)
		ctx.drawImage(img, 16, 36, 4, 12, 0, 0, 4, 12)
		//left (front) arm
		ctx.drawImage(img, 32, 52, 4, 12, 4, 0, 4, 12)
		ctx.drawImage(img, 48, 52, 4, 12, 4, 0, 4, 12)
		//right (back) arm
		ctx.drawImage(img, 40, 20, 4, 12, 8, 0, 4, 12)
		ctx.drawImage(img, 40, 36, 4, 12, 8, 0, 4, 12)
		//left (front) leg
		ctx.drawImage(img, 16, 52, 4, 12, 12, 0, 4, 12)
		ctx.drawImage(img, 0, 52, 4, 12, 12, 0, 4, 12)
		//right (back) leg
		ctx.drawImage(img, 0, 20, 4, 12, 16, 0, 4, 12)
		ctx.drawImage(img, 0, 36, 4, 12, 16, 0, 4, 12)
		//head
		ctx.drawImage(img, 0, 8, 8, 8, 20, 4, 8, 8)
		ctx.drawImage(img, 32, 8, 8, 8, 20, 4, 8, 8)
	}else if(img.width == 28 && img.height == 12){
		ctx.drawImage(img, 0, 0)
	}else return 'Wrong size!'
	const {data} = ctx.getImageData(0, 0, 28, 12)
	for(let i = 0; i < 336; i++){
		skin[i * 3] = data[i << 2]
		skin[i * 3 + 1] = data[(i << 2) + 1]
		skin[i * 3 + 2] = data[(i << 2) + 2]
	}
	storage.skin = String.fromCharCode.apply(null, skin16)
	drawSkin()
	return 'Done!'
}
const skinCtx = document.createElement('canvas').getContext('2d')
skinCtx.canvas.width = skinCtx.canvas.height = 8
function drawSkin(){
	const head = new ImageData(8, 8)
	for(let i = 396, j = 0; j < 256; i+=3,j+=4){
		if(!(i%84))i+=60
		head.data[j] = skin[i]
		head.data[j+1] = skin[i+1]
		head.data[j+2] = skin[i+2]
		head.data[j+3] = 255
	}
	skinCtx.putImageData(head,0,0)
}
drawSkin()
let list, input, addBtn, selectSkinBtn, logoutBtn
const serverList = UI('dirtbg serverlist',
	Spacer(20),
	Row(
		Label('Welcome, '),
		skinCtx.canvas.attr('style','height:16rem;align-self:center'),
		Label(storage.name).attr('style', 'color: #E92'),
		selectSkinBtn = Label('Select skin').attr('style', 'color: #888; text-decoration: underline; cursor: pointer'),
		logoutBtn = Label('Log out').attr('style', 'color: #888; text-decoration: underline; cursor: pointer')
	),
	Spacer(20),
	Row(
		Label('Connect to a server:'),
		Spacer.grow(1),
		Btn('Hosting a server', () => window.open('https://github.com/open-mc/server','_blank')),
		Btn('Refresh', serverlist)
	).attr('style', 'align-self: stretch; justify-content: space-between; margin-left: 7rem; flex-wrap: wrap'),
	list = Div('serverlist'),
	Spacer(20),
	Row(input = Input('text', 'server ip'), addBtn = Btn('Add server', () => {if(input.value=='server ip') return input.value = 'very funny';else if(input.value=='very funny') return;addServer(input.value);input.value='';addBtn.disabled=true}, 'small disabled')),
	Spacer(20)
)
selectSkinBtn.classList.add('selectable')
selectSkinBtn.onclick = btn => getSkin().then(a => {
	if(!a) return
	btn.textContent = a
	setTimeout(() => btn.textContent = 'Select skin', 2000)
})
logoutBtn.classList.add('selectable')
logoutBtn.onclick = () => {
	storage.name = storage.privKey = storage.pubKey = storage.authSig = ''
	location+=''
}
input.oninput = () => {addBtn.disabled = !input.value}

serverList.finish = () => {
	for(const node of [...list.children]) node.end()
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