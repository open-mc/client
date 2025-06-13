import { Btn, click, Div, IconBtn, Input, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist } from './serverlist.js'
import texts from '../js/lang.js'
import { storage } from '../js/save.js'
import { login } from './login.js'
import { skin } from '../js/iframe.js'

if(!storage.skin) storage.skin = Math.random() > .5 ? "缀\x7f罿缀\x7f孛缀\x7f罿缀\x7f罿缀\x7f罿缀\x7f罿⠰ひ爨Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0缀\x7f桨栀h罿栀h桨栀h罿缀\x7f桨栀h罿⠰♲嬡Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h桨栀h罿缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0嬀[桨栀h孛缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h孛嬀[孛徖陁䅟徖蝁㭕徖陁䅟徖蝁㭕⠰♲嬡⠰ひ爨⠰♲嬡⠰ひ爨ᬨ⠊ਛᨦ✊ଛᰩ㈌ဣ\u202dⴐဠ嬀[孛嬀[桨徖陁䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰♲嬡Ωせ爨ᬨ⠊ਛᨦ☊ਚḬ⤎జḫ㌍ᄤ栀h孛嬀[桨喇阻䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨Ḭ☎ଘᨦ⤊జḫ⠎ଛᠤ⤊జ缀\x7f桨栀h罿喇阻䅟徖陁䅟喇阻䅟喇阻䅟⠰ひ爨⠰ひ爨⠰ひ爨Ωせ爨ᬨ⠊ചᴭⰎพᬨ✊ଛḬ⼎ᄢ缀\x7f桨栀h罿喇阻䅟喇阻䅟喇阻䅟徖陁䅟⠰ひ爨⠰ひ爨⠰ひ爨⠰ひ爨ᬨ⠊ਛᬨ☊చᜣ蜉㩘掜㩅ᐨ缀\x7f桨缀\x7f罿徖陁䅟喇阻䅟徖陁䅟徖陁䅟㼿㼿㼿⠰ひ爨㼿㼿㼿⠰ひ爨ᬨ⠊ਛᨨ☍ଘḬ萑ㅒ徖衁㥚⠰♲嬡⠰♲嬡徖陁䅟喇阻䅟徖蝁㭕徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿Ḭ⠎ਛᴭ戎⽃檝驏䑣历甴⽇⠰♲嬡⠰ひ爨徖陁䅟徖陁䅟徖陁䅟徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿历蘴㑓掚虄㑓果陈䅟妊琻⽈" : "띻筸碷띻筸碱녻筸碷녻筸碱녻筸碷녻䖚녻筸碷띻筸碱䍨搬⠿䍨搬⠿\0\0\0\0\0\0\0\0\0\0\0\0띻筸碷녻筸碱녻筸碱녻筸碷녻筸碱녻䮟㽤笨碱녻桸ⱃ㽤栨ⱃ㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷녻筸碱녻筸碷띻筸碷녻筸碷띻筸碷㽤栨ⱃ㽤栨ⱃ㽤栨ⱃ㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷녻筸碱莁衚把誈腢媃莁衚把誈腢媃㽤搨⠿㽤栨ⱃ㽤搨⠿㽤栨ⱃ\0\0\0\0\0\0\0\0\0\0\0\0녻筸碷띻筸碷쫥꧊쫥꧊쫥꧊쫥꧊㽤搨⠿㽤搨⠿㽤搨⠿㽤搨⠿髦㶎鿩䖚鿩䮟鿩㶎녻筸碷녻筸碷쫥꧊퓬뗔쫥꧊퓬뗔㠸㠸㠸㠸搸⠿㠸㠸㠸㠸搸⠿軦䖚髦㶎髦㶎軦䖚녻筸碷녻筸碷쫥뗔퓬뗔쫥뗔퓬뗔䝇䝇䝇䝇㡇㠸䝇䝇䝇䝇㡇㠸鿩䮟軦䖚軦䖚鿩䖚띻筸碷띻筸碷헭뗔헭뗔헭뗔헭뿚䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇䝇髦\udd45㦔髦䖚鿩\udd4b㦔铝䖚㔑ጎሽ㔑ጎሽ헭뫕헭뫕헭뫕헭뫕䝇䝇䝇㠸䜸䝇䝇䝇䝇㠸䜸䝇铝䖚髦䖚铝뗔퓬\uddb5㦔띻筸碱띻筸碱헭뫕\udbef샛헭뫕\udbef뫕䱌䱌䱌兑㡑㠸䱌䱌䱌兑㡑㠸铝㶎鿩\udd4b㦔퓬쏞\udbf2볛띻筸碱띻筸碱\udbef샛헭샛\udbef뫕\udbef뫕䱌䱌䱌兑屑屜䱌䱌䱌兑屑屜軦䖚鿩䖚퓬볛\udef2쏞녻筸碷띻筸碱헭뿚헭샛\udbef뗔헭뫕㴽㴽㴽㴽尽屜㴽㴽㴽㴽尽屜髦㶎髦뗔퓬쏞\udbf2볛"

const i = document.createElement('input')
i.type = 'file'
const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true})
ctx.width = 28
ctx.height = 12
const skin16 = new Uint16Array(skin.buffer)
for(let i = 0; i < 1008; i+=2) skin[i] = storage.skin.charCodeAt(i>>1), skin[i+1] = storage.skin.charCodeAt(i>>1)>>8
async function getSkin(){
	i.accept = 'image/*'
	i.value = ''
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
async function newBg(){
	i.accept = 'image/*'
	i.value = ''
	if(i.onchange) i.onchange()
	i.click()
	if(!await new Promise(r => i.onchange = r) || !i.files.length) return await caches.open('').then(c => c.delete('/.user/bg')).then(() => {
		customBgEl.style.background = selectImgIcon
		document.body.style.background = ''
	})
	const f = i.files[0]
	await caches.open('').then(c => c.put('/.user/bg', new Response(f)))
	document.body.style.background = 'url('+URL.createObjectURL(f)+') center/cover'
	customBgEl.style.background = selectImgIcon
	storage.theme = theme = -1
	themeEl.style.outlineColor = ''
	;(themeEl = customBgEl).style.outlineColor = 'white'
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

const themes = [
	'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAVUExURTEhF1I8KEMvIGZKM0pKSjw8PD8xJbEI8eEAAAEHSURBVGje7ZnREcMwCENZISt0ha6QFbpC9x+hkIt6skoHMCf9JMHk+UdnIIln6rj1uNXFIsXruIYBIwB1U4mcUM9nCjEAeT0gA0YAYAqYhZ/ZNJzDeQbMAJQpXikE2FR6sODKxjJgDgCLV6FIdYdH3ddGGjNgBgCHhBomSF2TsTQYBmwPgHkQrMaCE7ip5EPnu5EBYwCcoIMGTNXFDZgD0CBfeSDhPF4zYA5AB08tKFpMlqbUgFGArpAArC/hA8ViJAO2B2ix4OQaMngTHkiim04M2BKgQYX8E8xlwBwAm+md0qYCh0r3gcqAGQBNWppIaTL0J4YB8wA6dFYDcZD0xZ/KZMDOgA8e4JHuRQtYaAAAAABJRU5ErkJggg) 0 0/64px',
	'linear-gradient(to top, #000, #222)',
	'linear-gradient(to top right, red, #b400b4, blue)',
	'linear-gradient(to top right, #00f, black)',
	'radial-gradient(circle at top, white, #59f)',
	'linear-gradient(to top, #e61 20%, #421 80%)',
	'linear-gradient(15deg, #000 25%, #f00 50%, #000 75%)',
]
let theme = +storage.theme || 0

const selectImgIcon = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURXd3d////w7kBl4AAAArSURBVAjXY2BABwnIBPPnPzACzAUTTGAWEDArgAgLENcuAUXJ/wdQAi8AAB8eDBx5eZDkAAAAAElFTkSuQmCC") center/cover'
let fileInput, mapInput, skinErr, themeEl, customBgEl
export const settingsUI = UI('',
	Spacer.grow(1),
	Label(texts.serverlist.settings()),
	skinErr = Label().css({color: '#f33'}),
	Row(
		...themes.map((bg, i) => {
			const el = Btn('', () => {
				themeEl.style.outlineColor = ''
				if(themeEl == customBgEl && themeEl.style.background.length > 200 && document.body.style.background)
					themeEl.style.background = document.body.style.background
				;(themeEl = el).style.outlineColor = 'white'
				document.body.style.background = themes[storage.theme = theme = i]
			}).css({ width: '50px', height: '50px', background: bg })
			if(i == theme) el.css({ outlineColor: 'white' }), themeEl = el
			return el
		}),
		customBgEl = Btn('', () => {
			if(customBgEl.style.background.length > 200) return newBg()
			themeEl.style.outlineColor = ''
			;(themeEl = customBgEl).style.outlineColor = 'white'
			storage.theme = theme = -1
			document.body.style.background = customBgEl.style.background
			customBgEl.style.background = selectImgIcon
		}).css({ width: '50px', height: '50px', imageRendering: 'pixelated' })
	),
	Spacer(10),
	Row(
		IconBtn(skinCtx.canvas.css({width: '32px', height: '32px', alignSelf: 'center'})/*'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAD5JREFUKFNjZCARMGJT//////8gcUZGRgx56mjA50qwDTAnEPIOyIkYTkLXjK5mgDTAnAFyHlFOoq0GQkELAN3dMA15b7c5AAAAAElFTkSuQmCC'*/, texts.serverlist.select_skin(), () => getSkin().then(a => {
			if(!a) return
			skinErr.textContent = a
			setTimeout(() => (skinErr.textContent = ''), 3000)
		})),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAADJJREFUKFNjZCADMP7///8/TB8jIyMKH5d5YEUwxdhomEYUw8myiQwvMYz6CRpqgzyeAMHxa+q4OmUOAAAAAElFTkSuQmCC', texts.serverlist.hosting_info(), () => window.open('https://github.com/open-mc/server','_blank')),
		IconBtn('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAE5JREFUKFOlkkEKACAIBNv/P3pjA0MsKcurjY4aWjGg9yS54wCMvI8JxKSKPAERTDuYhulatwXI5lEBQf9A3MpRybvL4Hro41pLh6v8jg4z/FANyvEmWwAAAABJRU5ErkJggg', texts.serverlist.logout(), () => {
			click()
			delete storage.name
			delete storage.privKey
			delete storage.pubKey
			delete storage.authSig
			login()
		})
	),
	Spacer(10),
	fileInput = Input('long', 'Components').attr('class', 'tall').css({width: 'calc(100% - 8rem)'}),
	mapInput = Input('long', 'Resource maps').attr('class', 'tall').css({borderTop: 0, width: 'calc(100% - 8rem)'}),
	Spacer(10),
	Btn(texts.misc.save(), () => {
		storage.files = fileInput.value.trim()
		storage.maps = mapInput.value.trim()
		serverlist()
	}),
	Spacer.grow(1),
)
if(theme >= 0) document.body.style.background = themes[theme]
else (themeEl = customBgEl).style.outlineColor = 'white'
caches.open('').then(c => c.match('/.user/bg')).then(a => a?.blob()).then(v => {
	if(!v) return void(customBgEl.style.background = selectImgIcon)
	const bg = 'url('+URL.createObjectURL(v)+') center/cover'
	if(theme == -1){
		document.body.style.background = bg
		customBgEl.style.background = selectImgIcon
	}else{
		customBgEl.style.background = bg
	}
})

export function settings(){
	fileInput.value = storage.files||''
	mapInput.value = storage.maps||''
	showUI(settingsUI)
}