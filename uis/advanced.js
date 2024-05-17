import { options } from '../js/save.js'
import { Btn, Label, Scale, showUI, Spacer, UI } from '../js/ui.js'
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
function supersampleChange(a = options.supersample){
	options.supersample = (a = Math.round(a * 6)) / 6
	const z = 2 ** (a - 3)
	return ['Supersampling: '+z, options.supersample]
}

let af3Node
const ui = UI('menu',
	Label('Advanced Options'),
	Scale(speedChange),
	Scale(supersampleChange),
	Scale(maxParticlesChange),
	af3Node = Btn('Default debug: '+(options.autof3 > 1 ? options.autof3 > 2 ? 'EVERYTHING' : 'DETAILED' : options.autof3 ? 'MINIMAL' : 'NO'), () => {
		options.autof3 = (options.autof3+1)%4
		af3Node.text = 'Default debug: '+(options.autof3 > 1 ? options.autof3 > 2 ? 'EVERYTHING' : 'DETAILED' : options.autof3 ? 'MINIMAL' : 'NO')
	}),
	Spacer(20),
	Btn('Back', optionsScreen)
)
ui.esc = optionsScreen
export function advancedOptionsScreen(){
	showUI(ui)
}