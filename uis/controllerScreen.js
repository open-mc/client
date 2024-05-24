import { options } from '../js/save.js'
import { Btn, Label, Row, Scale, showUI, Spacer, UI } from '../js/ui.js'
import { controlsScreen } from './controlsScreen.js'
import allTexts from '../js/lang.js'
const texts = allTexts.options.controller
function renderJoy(){
	joyNode.textContent = texts.joystick_mode(options.joy+1)
}
function joyChange(){
	options.joy = (options.joy + 1) % 2
	renderJoy()
}
function sensitivityChange(a = options.controllerSensitivity){
	options.controllerSensitivity = a
	return [texts.sensitivity(a > 0.005 ? a < 0.995 ? Math.floor(9 ** a * 10 / 3) / 10 : allTexts.options.common.sensitivity.fast() : allTexts.options.common.sensitivity.slow()), a]
}

let joyNode
const controllersui = UI('menu',
	Label(texts.name()),
	joyNode = Btn('', joyChange),
	Scale(sensitivityChange),
	Spacer(20),
	Row(Btn(allTexts.misc.menu_back(), controlsScreen), Btn('', undefined, 'disabled'))
)
controllersui.esc = controlsScreen

renderJoy()
export function controllerScreen(){
	showUI(controllersui)
}