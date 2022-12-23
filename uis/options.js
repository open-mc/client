import "../me.js"
import { pause } from "./pauseui.js"
import { options } from "../save.js"
import { Btn, Label, Row, Scale, ScaleSmall, showUI, Spacer, UI } from "../ui/ui.js"
import { musicVol, soundVol } from "../ui/sounds.js"


function renderScale(){
	guiNode.textContent = 'GUI scale: ' + options.guiScale
	document.documentElement.style.fontSize = Math.round(devicePixelRatio) / devicePixelRatio * options.guiScale * 2 + 'px'
}
function guiChange(){
	options.guiScale *= 2
	if(options.guiScale == 8)options.guiScale = 0.5
	renderScale()
}
function zoomChange(a = options.zoom){
	let v = Math.round(a * 5)
	cam.z = 2 ** (v-1)
	return [cam.z<16?'Zoom: '+cam.z/2:'Zoom: SUPER', options.zoom = v / 5]
}

function soundChange(a = options.sound){
	options.sound = a
	soundVol(a)
	return [a >= 0.005 ? a < 0.995 ? 'Sound: '+Math.round(a*100)+'%' : 'Sound: LOUD' : 'Sound: quiet', a]
}
function musicChange(a = options.music){
	options.music = a
	musicVol(a)
	return [a >= 0.005 ? a < 0.995 ? 'Music: '+Math.round(a*100)+'%' : 'Music: LOUD' : 'Music: quiet', a]
}

function sensitivityChange(a = options.sensitivity){
	options.sensitivity = a
	return [a > 0.005 ? a < 0.995 ? 'Sensitivity: '+Math.floor(9 ** a * 10 / 3) / 10 +'x' : 'Sensitivity: HYPERSPEED!!!' : 'Sensitivity: *yawn*', a]
}

let guiNode
const optionsui = UI('menu',
	Label('Options'),
	Row(ScaleSmall(zoomChange), guiNode = Btn('', guiChange, 'small')),
	Row(ScaleSmall(soundChange), ScaleSmall(musicChange)),
	Scale(sensitivityChange),
	Spacer(20),
	Row(Btn('Back', pause, 'small'), Btn('Advanced', Function.prototype, 'small disabled'))
)
renderScale()
export function optionsScreen(){
	showUI(optionsui)
}