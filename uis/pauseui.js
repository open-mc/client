import { Btn, Div, hideUI, Label, Row, setDefaultUI, showUI, UI } from "../ui.js"
import { controlsScreen } from "./controlsScreen.js"
import { feedback } from "./feedbackui.js"
import { optionsScreen } from "./options.js"
import { serverlist } from "./serverlist.js"


const pauseui = UI('menu',
	Label('Game menu'),
	Btn('Back to Game', hideUI),
	Row(Btn('Options', optionsScreen), Btn('Feedback', feedback)),
	Row(Btn('Controls', controlsScreen), Btn('Credits', () => open('https://github.com/openmc2d/client/blob/preview/CREDITS.md','_blank'))),
	Btn('Disconnect', serverlist),
	Div('', Label('Changelog').attr('style', 'height:unset;line-height:unset').attr('onclick', "window.open('https://github.com/openmc2d/client/blob/main/CHANGELOG.md','_blank')")).attr('style', 'position: absolute; bottom: 2rem; display: flex; right: 2rem; text-decoration: underline; opacity: 0.4; font-size: 7rem; cursor: pointer')
)
pauseui.esc = hideUI

export function pause(){
	showUI(pauseui)
}
setDefaultUI(pause)