import { options } from "../save.js"
import { Btn, Label, Scale, showUI, Spacer, UI } from "../ui.js"
import { optionsScreen } from "./options.js"

function speedChange(a = options.speed/4){
	if(a > 0.24 && a < 0.26)a = 0.25
	options.speed = a*4
	return [a > 0.01 ? 'Speed: '+(Math.round(a*400)/100).toFixed(2)+'x' : 'Speed: Paused', a]
}
let af3Node
const ui = UI('menu',
	Label('Advanced Options'),
	Scale(speedChange),
	af3Node = Btn('Open debug automatically: '+(options.autof3 ? 'YES' : 'NO'), () => af3Node.text = 'Open debug automatically: '+((options.autof3 = !options.autof3) ? 'YES' : 'NO'), 'small'),
	Spacer(20),
	Btn('Back', optionsScreen)
)
ui.esc = optionsScreen
export function advancedOptionsScreen(){
	showUI(ui)
}