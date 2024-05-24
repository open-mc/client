import { pause } from './pauseui.js'
import { options } from '../js/save.js'
import { Btn, Label, Row, Scale, showUI, Spacer, UI } from '../js/ui.js'
import { controllerScreen } from './controllerScreen.js'
import allTexts from '../js/lang.js'
const texts = allTexts.options.controls

function renderClick(){
	clickNode.text = options.click ? texts.left_click.place() : texts.left_click.break()
}
function renderFfx(){
	ffxNode.text = texts.zoom_fx[options.ffx]()
}

function clickChange(){
	options.click = !options.click
	renderClick()
}
function ffxChange(){
	options.ffx = (options.ffx + 1) % 4
	renderFfx()
}

function sensitivityChange(a = options.sensitivity){
	options.sensitivity = a
	return [texts.sensitivity(a > 0.005 ? a < 0.995 ? Math.floor(9 ** a * 10 / 3) / 10 : allTexts.options.common.sensitivity.fast() : allTexts.options.common.sensitivity.slow()), a]
}

function renderCamMode(){
	camNode.textContent = texts.camera[options.camera]()
}
function camChange(){
	options.camera = (options.camera + 1) % 5
	renderCamMode()
}

function renderFsc(){
	fscNode.textContent = texts.fullscreen[+options.fsc]()
}
function fscChange(){
	options.fsc = 1 - options.fsc
	renderFsc()
}

let clickNode, ffxNode, camNode, fscNode
const controlssui = UI('menu',
	Label(texts.name()),
	camNode = Btn('', camChange),
	Row(clickNode = Btn('', clickChange), ffxNode = Btn('', ffxChange)),
	Scale(sensitivityChange),
	fscNode = Btn('', fscChange),
	Spacer(20),
	Row(Btn(allTexts.misc.menu_back(), pause), Btn(allTexts.options.controller(), controllerScreen))
)
controlssui.esc = pause

renderCamMode()
renderFsc()
renderClick()
renderFfx()
export function controlsScreen(){
	showUI(controlssui)
}