import { options } from '../js/save.js'
import { Btn, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { controlsScreen } from './controlsScreen.js'

function renderJoy(){
	joyNode.textContent = 'Joystick mode: ' + (options.joy+1)
}
function joyChange(){
	options.joy = (options.joy + 1) % 2
	renderJoy()
}

let joyNode
const controllersui = UI('menu',
	Label('Controller options'),
	joyNode = Btn('', joyChange),
	Spacer(20),
	Row(Btn('Back', controlsScreen), Btn('', undefined, 'disabled'))
)
controllersui.esc = controlsScreen

renderJoy()
export function controllerScreen(){
	showUI(controllersui)
}