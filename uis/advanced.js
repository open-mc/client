import { options } from '../js/save.js'
import { Btn, Label, Row, Scale, ScaleSmall, showUI, Spacer, UI } from '../js/ui.js'
import { optionsScreen } from './options.js'
import allTexts from '../js/lang.js'
const texts = allTexts.options.advanced

function speedChange(a){
	if(a > 0.24 && a < 0.26) a = 0.25
	options.speed = a*4
	return [a > 0.01 ? texts.speed((Math.round(a*400)/100).toFixed(2)) : texts.speed.paused(), a]
}

function maxParticlesChange(a){
	a = Math.round(a * 7)
	options.maxParticles = a ? 10 ** a : 0
	return [texts.max_particles(options.maxParticles), a/7]
}
function supersampleChange(a){
	options.supersample = (a = Math.round(a * 6)) / 6
	const z = 2 ** (a - 3)
	return [texts.supersampling((z>=1?''+z:'1/'+1/z)), options.supersample]
}
function gammaChange(a){
	options.gamma = a = Math.round(a*50)/50
	return [a==0?texts.gamma[0]:a==1?texts.gamma[1]:texts.gamma(allTexts.options.common.percentage(Math.round(a*100))), a]
}

let af3Node
const ui = UI('menu',
	Label(texts.name()),
	Label(texts.experts_only()).css({color: '#f33', marginTop: '-8rem'}),
	Scale(speedChange).set(options.speed/4),
	Row(ScaleSmall(supersampleChange).set(options.supersample), ScaleSmall(gammaChange).set(options.gamma)),
	Scale(maxParticlesChange).set(Math.max(0, Math.log10(options.maxParticles)) / 7),
	af3Node = Btn(texts.default_debug[options.autof3](), () => {
		options.autof3 = (options.autof3+1)%4
		af3Node.text = texts.default_debug[options.autof3]()
	}),
	Spacer(20),
	Btn(allTexts.misc.menu_back(), optionsScreen, 'small')
)
ui.esc = optionsScreen
export function advancedOptionsScreen(){
	showUI(ui)
}