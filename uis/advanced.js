import { options } from '../js/save.js'
import { Btn, Label, Scale, showUI, Spacer, UI } from '../js/ui.js'
import { optionsScreen } from './options.js'
import texts from '../js/lang.js'

function speedChange(a = options.speed/4){
	if(a > 0.24 && a < 0.26)a = 0.25
	options.speed = a*4
	return [a > 0.01 ? texts.options.advanced.speed((Math.round(a*400)/100).toFixed(2)) : texts.options.advanced.speed.paused(), a]
}

function maxParticlesChange(a = Math.max(0, Math.log10(options.maxParticles)) / 7){
	a = Math.round(a * 7)
	options.maxParticles = a ? 10 ** a : 0
	return [texts.options.advanced.max_particles(options.maxParticles), a/7]
}
function supersampleChange(a = options.supersample){
	options.supersample = (a = Math.round(a * 6)) / 6
	const z = 2 ** (a - 3)
	return [texts.options.advanced.supersampling(z), options.supersample]
}

let af3Node
const ui = UI('menu',
	Label(texts.options.advanced.name()),
	Scale(speedChange),
	Scale(supersampleChange),
	Scale(maxParticlesChange),
	af3Node = Btn(texts.options.advanced.default_debug[options.autof3](), () => {
		options.autof3 = (options.autof3+1)%4
		af3Node.text = texts.options.advanced.default_debug[options.autof3]()
	}),
	Spacer(20),
	Btn(texts.misc.menu_back(), optionsScreen)
)
ui.esc = optionsScreen
export function advancedOptionsScreen(){
	showUI(ui)
}