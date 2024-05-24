import { storage } from '../js/save.js'
import { Btn, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist } from './serverlist.js'
import texts from '../js/lang.js'

// Web technologies are a mess * ** [citation needed]
// Here we aim to detect and warn the user about an L browser, advising them to use a more based browser
const defects = {
	/**
	 * Safari is a defect. It should not exist, it is an abomination. I don't even know where to start
	 * No canvas filter support
	 * No pattern fill nearest neighbour support (blurry clouds before webgl2 switch)
	 * Almost all css metrics are rounded to integers, completely butchering pretty much any scaled-up css art
	 * as well as canvas metrics with methods like .measureText()
	 * Page zoom does not properly update devicePixelRatio,
	 * making it completely impossible to reliably measure a physical pixel
	 * Mediocre pointerlock and fullscreen support
	 * Not adequately performant in many common tasks
	 * Only very recently supports import maps, OffscreenCanvas, etc...
	 */
	safari: false,
	/**
	 * Damn, I had hoped you would excell in this, firefox.
	 * Horrendous canvas2d performance on some systems
	 */
	firefox: false,
	/**
	 * No mobile support (yet!)
	 */
	mobile: false
}

// Fuck you, safari!
if(!('filter' in CanvasRenderingContext2D.prototype)) defects.safari = true

if(navigator.userAgent.toLowerCase().includes('firefox'))
	defects.firefox = false, defects.safari = false

if(matchMedia("not (pointer: fine)").matches)
	defects.mobile = true, defects.safari = false

export function start(){
	document.getElementById('loading')?.remove()
	if(ws) return
	if(!storage.shownDefects && (defects.firefox || defects.safari)){
		showUI(UI('dirtbg',
			Label('Notice about your current environment').attr('style', 'font-size: 12rem; max-width: calc(100% - 20px); white-space: pre-wrap; height: auto'),
			Spacer(25),
			Label(((defects.safari ? '\n'+texts.defects.safari() : '') + (defects.firefox ? '\n'+texts.defects.firefox() : '') + (defects.mobile ? '\n'+texts.defects.mobile() : '')).slice(1)).attr('style', 'max-width: calc(100% - 20px); opacity: 0.7; height: auto; white-space: pre-wrap'),
			Spacer(25),
			Row(Btn('Don\'t warn again', () => (storage.shownDefects = true, serverlist())), Btn('Ok, proceed', serverlist))
		))
	}else serverlist()
}