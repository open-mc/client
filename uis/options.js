import { pause } from './pauseui.js'
import { options } from '../js/save.js'
import { Btn, Label, Row, Scale, ScaleSmall, showUI, Spacer, UI } from '../js/ui.js'
import { advancedOptionsScreen } from './advanced.js'
import { controlsScreen } from './controlsScreen.js'
import allTexts from '../js/lang.js'
const texts = allTexts.options.general

function renderScale(){
	guiNode.textContent = texts.gui_scale(options.guiScale)
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
	return [texts.zoom(z<16?z.toPrecision(2+a%2):texts.zoom.super()), options.zoom]
}

const textsCommon = allTexts.options.common
function soundChange(a = options.sound){
	options.sound = a
	return [texts.sound(a >= 0.005 ? a < 0.995 ? textsCommon.percentage(Math.round(a*100)) : textsCommon.volume.loud() : textsCommon.volume.quiet()), a]
}
function musicChange(a = options.music){
	options.music = a
	return [texts.sound(a >= 0.005 ? a < 0.995 ? textsCommon.percentage(Math.round(a*100)) : textsCommon.volume.loud() : textsCommon.volume.quiet()), a]
}

function notifChange(){
	options.notifs = (options.notifs + 1) % 3
	renderChat()
}

function renderChat(){
	chatNode.textContent = texts.chat_notifications[options.notifs]()
}

let guiNode, chatNode
const optionsui = UI('menu',
	Label(texts.name()),
	Row(ScaleSmall(zoomChange), guiNode = Btn('', guiChange)),
	Row(ScaleSmall(soundChange), ScaleSmall(musicChange)),
	chatNode = Btn('', notifChange),
	Btn(allTexts.options.advanced(), advancedOptionsScreen),
	Spacer(20),
	Row(Btn(allTexts.misc.menu_back(), pause), Btn(allTexts.options.controls(), controlsScreen))
)
optionsui.esc = pause

renderScale()
renderChat()

export function optionsScreen(){
	showUI(optionsui)
}