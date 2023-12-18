import { options } from '../js/save.js'
import { Btn, Label, Row, Scale, showUI, Spacer, UI } from '../js/ui.js'
import { controlsScreen } from './controlsScreen.js'

function renderJoy(){
	joyNode.textContent = 'Joystick mode: ' + (options.joy+1)
}
function joyChange(){
	options.joy = (options.joy + 1) % 2
	renderJoy()
}
function sensitivityChange(a = options.controllerSensitivity){
	options.controllerSensitivity = a
	return [a > 0.005 ? a < 0.995 ? 'Controller sensitivity: '+Math.floor(9 ** a * 10 / 3) / 10 +'x' : 'Controller sensitivity: HYPERSPEED!!!' : 'Controller sensitivity: *yawn*', a]
}

let joyNode
const controllersui = UI('menu',
	Label('Controller options'),
	joyNode = Btn('', joyChange),
	Scale(sensitivityChange),
	Spacer(20),
	Row(Btn('Back', controlsScreen), Btn('', undefined, 'disabled'))
)
controllersui.esc = controlsScreen

renderJoy()
export function controllerScreen(){
	showUI(controllersui)
}