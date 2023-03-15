import { pause } from "./pauseui.js"
import { options } from "../save.js"
import { Btn, Label, Row, Scale, showUI, Spacer, UI } from "../ui.js"
import { optionsScreen } from "./options.js"

function renderClick(){
	clickNode.text = options.click ? 'Left click: place' : 'Left click: break'
}
function renderFfx(){
	ffxNode.text = options.ffx < 2 ? options.ffx == 0 ? 'Zoom FX: None' : 'Zoom FX: Normal' : options.ffx == 2 ? 'Zoom FX: 3x' : 'Zoom FX: CRAZY!!!'
}

function clickChange(){
	options.click = !options.click
	renderClick()
}
function ffxChange(){
	options.ffx = (options.ffx + 1) % 4
	renderFfx()
}

function sensitivityChange(a = options.sensitivity){
	options.sensitivity = a
	return [a > 0.005 ? a < 0.995 ? 'Sensitivity: '+Math.floor(9 ** a * 10 / 3) / 10 +'x' : 'Sensitivity: HYPERSPEED!!!' : 'Sensitivity: *yawn*', a]
}
let clickNode, ffxNode
const controlssui = UI('menu',
	Label('Options'),
	Row(clickNode = Btn('', clickChange, 'small'), ffxNode = Btn('', ffxChange, 'small')),
	Scale(sensitivityChange),
	Spacer(20),
	Row(Btn('Back', pause, 'small'), Btn('Other options', optionsScreen, 'small'))
)
controlssui.esc = pause

renderClick()
renderFfx()
export function controlsScreen(){
	showUI(controlssui)
}