import { storage } from "../save.js"
import { Btn, Label, Row, showUI, Spacer, UI } from "../ui.js"
import { serverlist } from "./serverlist.js"

// Web technologies are a mess * ** [citation needed]
// Here we aim to detect and warn the user about an L browser, advising them to use a more based browser
const defects = {
	/**
	 *  Safari is a defect. It should not exist, it is an abomination. I don't even know where to start
	 * No canvas support
	 * No pattern fill NEAREST_NEIGHBOUR support (blurry clouds)
	 * Almost all metrics are rounded to integers, completely butchering pretty much any scaled-up css art
	 * as well as canvas metrics with methods like .measureText()
	 * Page zoom does not properly update devicePixelRatio,
	 * making it completely impossible to reliably measure a physical pixel
	 * Mediocre pointerlock and fullscreen support
	 * Not adequately performant in many common tasks
	 */
	safari: false, 
	/**
	 * No dedicated sound thread causes choppy or glitchy sounds when CPU is busy
	 * Odd-looking text
	 * Texture bleeding in atlases
	 */
	m1: false,
	/**
	 * Damn, I had hoped you would excell in this, firefox. Still not even comparable to safari though xD
	 * Bad performance with postMessage
	 * Not the best canvas performance
	 */
	firefox: false,
	/* Chrome, you do not disappoint! If you find a V8 dev in the wild, give them a hug :) */

	/**
	 * No mobile support (yet!)
	 */
	mobile: false
}
const M1 = `
Your computer appears to be using an apple silicon chip, which is known to be experimental and not stable handling audio and textures`
// Fuck you, safari!
const SAFARI = `
You seem to be using safari, which has proven multiple times to\n(1) Not support even relatively standard and stable technologies\n(2) Be buggy, with countless defects developers have to work around and\n(3) Be significantly slower and less secure than other more popular browsers\nWe urge you, please, to use a different browser`
const FF = `
You seem to be using firefox, meaning you may occasionally experience performance issues. If this becomes an issue, consider switching to chrome, chromium (for privacy enthusiasts) or opera`
const MOBILE = `
We currently provide no touch control support\nCome back on a desktop device`
const w = document.createElement("canvas").getContext("webgl"); w.width = w.height = 1
const d = w.getExtension('WEBGL_debug_renderer_info')
const g = d && w.getParameter(d.UNMASKED_RENDERER_WEBGL) || ""
if (/Apple/.test(g) && !/Apple GPU/.test(g)) {
	defects.m1 = true
}
// L, safari cant even detect M1
if(!('filter' in CanvasRenderingContext2D.prototype))defects.safari = true

// Firefox has been redeemed, thanks zekiah for testing on linux (he uses arch btw)
if(navigator.userAgent.toLowerCase().includes('firefox')) defects.firefox = false, defects.safari = false

if(matchMedia("not (pointer: fine)").matches)defects.mobile = true

export function start(){
	if(!storage.shownDefects && (defects.firefox || defects.safari || defects.m1)){
		showUI(UI('dirtbg',
			Label('Notice about your current environment').attr('style', 'font-size:12rem'),
			Spacer(30),
			Label(((defects.safari ? SAFARI : '') + (defects.firefox ? FF : '') + (defects.m1 ? M1 : '') + (defects.mobile ? MOBILE : '')).slice(1)).attr('style', 'max-width: 50%; opacity: 0.7; height: auto; white-space: pre-wrap'),
			Spacer(30),
			Row(Btn('Don\'t warn again', () => (storage.shownDefects = true, serverlist())), Btn('Ok, proceed', serverlist)),
			Spacer(30)
		))
	}else serverlist()
}
