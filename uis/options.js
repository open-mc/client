import { pause } from "./pauseui.js"
import { options } from "../save.js"
import { Btn, Label, Row, Scale, ScaleSmall, showUI, Spacer, UI } from "../ui.js"
import { advancedOptionsScreen } from "./advanced.js"


function renderScale(){
	guiNode.textContent = 'GUI scale: ' + options.guiScale
	const size = Math.round(devicePixelRatio) / devicePixelRatio * options.guiScale * 2
	document.documentElement.style.fontSize = size + 'px'
	document.documentElement.style.setProperty('--scale', size)
}
function guiChange(){
	options.guiScale *= 2
	if(options.guiScale == 8)options.guiScale = 0.5
	renderScale()
}
function zoomChange(a = options.zoom){
	const z = 2 ** ((options.zoom = Math.round(a * 5) / 5) * 5 - 1)
	return [z<16?'Zoom: '+z/2:'Zoom: SUPER', options.zoom]
}

function soundChange(a = options.sound){
	options.sound = a
	return [a >= 0.005 ? a < 0.995 ? 'Sound: '+Math.round(a*100)+'%' : 'Sound: LOUD' : 'Sound: quiet', a]
}
function musicChange(a = options.music){
	options.music = a
	return [a >= 0.005 ? a < 0.995 ? 'Music: '+Math.round(a*100)+'%' : 'Music: LOUD' : 'Music: quiet', a]
}

function sensitivityChange(a = options.sensitivity){
	options.sensitivity = a
	return [a > 0.005 ? a < 0.995 ? 'Sensitivity: '+Math.floor(9 ** a * 10 / 3) / 10 +'x' : 'Sensitivity: HYPERSPEED!!!' : 'Sensitivity: *yawn*', a]
}
const cameraOptions = ['Dynamic', 'Follow Pointer', 'Follow player', 'Page']
function renderCamMode(){
	camNode.textContent = 'Camera: ' + cameraOptions[options.camera]
}
function camChange(){
	options.camera = (options.camera + 1) % 4
	renderCamMode()
}

let guiNode, camNode
const optionsui = UI('menu',
	Label('Options'),
	camNode = Btn('', camChange, 'small'),
	Row(ScaleSmall(zoomChange), guiNode = Btn('', guiChange, 'small')),
	Row(ScaleSmall(soundChange), ScaleSmall(musicChange)),
	Scale(sensitivityChange),
	Spacer(20),
	Row(Btn('Back', pause, 'small'), Btn('Advanced', advancedOptionsScreen, 'small'))
)
optionsui.esc = pause

renderScale()
renderCamMode()
export function optionsScreen(){
	showUI(optionsui)
}