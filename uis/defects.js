import { storage } from '../js/save.js'
import { Btn, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist } from './serverlist.js'
import { login } from './login.js'
import texts from '../js/lang.js'

// Web technologies are a mess * ** [citation needed]
// Here we aim to detect and warn the user about an L browser, advising them to use a more based browser
const defects = {
	/**
	 * Safari is a defect. It should not exist, it is an abomination. I don't even know where to start
	 * No canvas filter support
	 * No pattern fill nearest neighbour support (blurry clouds before webgl2 rewrite)
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
	 * No mobile support (yet!)
	 */
	mobile: false
}

// Fuck you, safari!
if(!('filter' in CanvasRenderingContext2D.prototype)) defects.safari = true

// OffscreenCanvas doesn't support webgl until iOS 17.0
if(defects.safari && !('popover' in HTMLElement.prototype)) OffscreenCanvas = null

if(matchMedia("not (hover: hover)").matches)
	defects.mobile = true, defects.safari = false

export function start(){
	document.getElementById('loading')?.remove()
	if(!storage.shownDefects && (defects.firefox || defects.safari)){
		showUI(UI('dirtbg',
			Label('Notice about your current environment').css({fontSize: '12rem', maxWidth: 'calc(100% - 20px)', whiteSpace: 'pre-wrap', height: 'auto'}),
			Spacer(25),
			Label(((defects.safari ? '\n'+texts.defects.safari() : '') + (defects.mobile ? '\n'+texts.defects.mobile() : '')).slice(1)).css({maxWidth: 'calc(100% - 20px)', opacity: '0.7', height: 'auto', whiteSpace: 'pre-wrap'}),
			Spacer(25),
			Row(Btn('Don\'t warn again', () => (storage.shownDefects = true, start())), Btn('Ok, proceed', start))
		))
		return
	}
	if(!storage.name) login()
	else serverlist()
}