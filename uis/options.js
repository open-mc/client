import { pause } from './pauseui.js'
import { options } from '../js/save.js'
import { Btn, Label, Row, Scale, ScaleSmall, showUI, Spacer, UI } from '../js/ui.js'
import { advancedOptionsScreen } from './advanced.js'
import { controlsScreen } from './controlsScreen.js'

function renderScale(){
	guiNode.textContent = 'GUI scale: ' + options.guiScale
	const size = Math.round(devicePixelRatio) / devicePixelRatio * options.guiScale * 2
	document.documentElement.style.fontSize = size + 'px'
}
function guiChange(){
	options.guiScale *= 2
	if(options.guiScale == 8)options.guiScale = 0.5
	renderScale()
}
function zoomChange(a = options.zoom){
	a = Math.round(a * 20)
	const z = 2 ** ((options.zoom = a / 20) * 10 - 7)
	return [z<16?'Zoom: '+z.toPrecision(2+a%2):'Zoom: SUPER', options.zoom]
}

function soundChange(a = options.sound){
	options.sound = a
	return [a >= 0.005 ? a < 0.995 ? 'Sound: '+Math.round(a*100)+'%' : 'Sound: LOUD' : 'Sound: quiet', a]
}
function musicChange(a = options.music){
	options.music = a
	return [a >= 0.005 ? a < 0.995 ? 'Music: '+Math.round(a*100)+'%' : 'Music: LOUD' : 'Music: quiet', a]
}

function notifChange(){
	options.notifs = (options.notifs + 1) % 3
	renderChat()
}

function renderChat(){
	chatNode.textContent = 'Chat notifications: ' + (options.notifs == 0 ? 'None' : options.notifs == 1 ? 'Mentions' : 'All')
}

let guiNode, chatNode
const optionsui = UI('menu',
	Label('Options'),
	Row(ScaleSmall(zoomChange), guiNode = Btn('', guiChange)),
	Row(ScaleSmall(soundChange), ScaleSmall(musicChange)),
	chatNode = Btn('', notifChange),
	Btn('Advanced', advancedOptionsScreen),
	Spacer(20),
	Row(Btn('Back', pause), Btn('Controls', controlsScreen))
)
optionsui.esc = pause

renderScale()
renderChat()

export function optionsScreen(){
	showUI(optionsui)
}