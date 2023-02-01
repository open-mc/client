import { options } from "../save.js"
import { Btn, Label, Scale, showUI, Spacer, UI } from "../ui.js"
import { optionsScreen } from "./options.js"

function speedChange(a = options.speed/2){
	if(a > 0.49 && a < 0.51)a = 0.5
	options.speed = a*2
	return [a > 0.005 ? 'Speed: '+(Math.round(a*200)/100).toFixed(2)+'x' : 'Speed: Paused', a]
}
let resetBtn
const ui = UI('menu',
	Label('Advanced Options'),
	Scale(speedChange),
	Spacer(20),
	Btn('Back', optionsScreen)
)
ui.esc = optionsScreen
export function advancedOptionsScreen(){
	showUI(ui)
}