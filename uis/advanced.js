import { options } from "../save.js"
import { Btn, Label, Scale, showUI, Spacer, UI } from "../ui.js"
import { optionsScreen } from "./options.js"

function speedChange(a = options.speed/4){
	if(a > 0.24 && a < 0.26)a = 0.5
	options.speed = a*4
	return [a > 0.01 ? 'Speed: '+(Math.round(a*200)/100).toFixed(2)+'x' : 'Speed: Paused', a]
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