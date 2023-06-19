import { options } from '../save.js'
import { Btn, Label, Scale, showUI, Spacer, UI } from '../ui.js'
import { optionsScreen } from './options.js'

function speedChange(a = options.speed/4){
	if(a > 0.24 && a < 0.26)a = 0.25
	options.speed = a*4
	return [a > 0.01 ? 'Speed: '+(Math.round(a*400)/100).toFixed(2)+'x' : 'Speed: Paused', a]
}

function maxParticlesChange(a = Math.max(0, Math.log10(options.maxParticles)) / 7){
	a = Math.round(a * 7)
	options.maxParticles = a ? 10 ** a : 0
	return ['Max particles: '+options.maxParticles, a/7]
}

let af3Node
const ui = UI('menu',
	Label('Advanced Options'),
	Scale(speedChange),
	Scale(maxParticlesChange),
	af3Node = Btn('Open debug automatically: '+(options.autof3 ? 'YES' : 'NO'), () => af3Node.text = 'Open debug automatically: '+((options.autof3 = !options.autof3) ? 'YES' : 'NO')),
	Spacer(20),
	Btn('Back', optionsScreen)
)
ui.esc = optionsScreen
export function advancedOptionsScreen(){
	showUI(ui)
}