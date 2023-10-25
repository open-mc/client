import { storage } from '../js/save.js'
import { Btn, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist } from './serverlist.js'

// Web technologies are a mess * ** [citation needed]
// Here we aim to detect and warn the user about an L browser, advising them to use a more based browser
const defects = {
	/**
	 * Safari is a defect. It should not exist, it is an abomination. I don't even know where to start
	 * No canvas filter support
	 * No pattern fill nearest neighbour support (blurry clouds)
	 * Almost all css metrics are rounded to integers, completely butchering pretty much any scaled-up css art
	 * as well as canvas metrics with methods like .measureText()
	 * Page zoom does not properly update devicePixelRatio,
	 * making it completely impossible to reliably measure a physical pixel
	 * Mediocre pointerlock and fullscreen support
	 * Not adequately performant in many common tasks
	 */
	safari: false, 
	/**
	 * Sound being processed on GPU causes choppy or glitchy sounds when GPU is very busy
	 * Odd-looking text
	 * Atlas texture bleeding (not sure if this is M1 only)
	 */
	m1: false,
	/**
	 * Damn, I had hoped you would excell in this, firefox.
	 * Horrendous canvas2d performance on some systems
	 */
	firefox: false,
	/* Chrome, you do not disappoint! If you find a V8 dev in the wild, give them a hug :) */

	/**
	 * No mobile support (yet!)
	 */
	mobile: false
}
const M1 = `
Your computer appears to be using an apple silicon chip, which is known to be experimental and not stable handling audio and textures in certain cases.`
// Fuck you, safari!
const SAFARI = `
You seem to be using safari, which has proven multiple times to be an incompetent browser for developers, not supporting technologies that are standard almost anywhere else and offering mediocre quality and performance for graphical applications\nWe urge you, please, to switch to a different browser.`
const FF = `
You seem to be using firefox, meaning you may occasionally experience low performance while playing this game. If this becomes an issue, consider switching to chromium (for privacy enthusiasts) or any other chromium-based browsers (e.g brave, opera gx, ...).`
const MOBILE = `
We currently provide no touch control support\nCome back on a desktop device.`
const w = document.createElement("canvas").getContext("webgl"); w.width = w.height = 1
const d = w.getExtension('WEBGL_debug_renderer_info')
const g = d && w.getParameter(d.UNMASKED_RENDERER_WEBGL) || ""
if (/Apple/.test(g) && !/Apple GPU/.test(g))
	defects.m1 = true

// L, safari cant even detect M1
if(!('filter' in CanvasRenderingContext2D.prototype))defects.safari = true

// Firefox has been redeemed, thanks zekiah for testing on linux (he uses arch btw)
if(navigator.userAgent.toLowerCase().includes('firefox'))
	defects.firefox = false, defects.safari = false

if(matchMedia("not (pointer: fine)").matches)
	defects.mobile = true, defects.safari = false

export function start(){
	const loading = document.getElementById('loading')
	if(loading) loading.remove()
	if(!storage.shownDefects && (defects.firefox || defects.safari || defects.m1)){
		showUI(UI('dirtbg',
			Label('Notice about your current environment').attr('style', 'font-size: 12rem; max-width: calc(100% - 20px); white-space: pre-wrap; height: auto'),
			Spacer(25),
			Label(((defects.safari ? SAFARI : '') + (defects.firefox ? FF : '') + (defects.m1 ? M1 : '') + (defects.mobile ? MOBILE : '')).slice(1)).attr('style', 'max-width: calc(100% - 20px); opacity: 0.7; height: auto; white-space: pre-wrap'),
			Spacer(25),
			Row(Btn('Don\'t warn again', () => (storage.shownDefects = true, serverlist())), Btn('Ok, proceed', serverlist))
		))
	}else serverlist()
}