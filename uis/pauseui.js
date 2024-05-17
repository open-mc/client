import { Btn, Div, hideUI, Label, Row, setDefaultUI, showUI, UI } from '../js/ui.js'
import { controlsScreen } from './controlsScreen.js'
import { feedback } from './feedbackui.js'
import { optionsScreen } from './options.js'
import { serverlist } from './serverlist.js'

const keybindsBtn = Btn('Keybinds')
keybindsBtn.disabled = true
const pauseui = UI('menu',
	Label('Game menu'),
	Btn('Back to Game', hideUI),
	Row(Btn('Options', optionsScreen), Btn('Server Page', () => {
		const { protocol, host } = new URL(ws.url)
		open(protocol.replace('ws','http')+'//'+host,'_blank')
	})),
	Row(Btn('Controls', controlsScreen), keybindsBtn),
	Btn('Disconnect', serverlist),
	Div('',
		Label('Credits').attr('style', 'height:unset;cursor:pointer;line-height:unset').attr('onclick', "window.open('https://github.com/open-mc/client/blob/main/CREDITS.md','_blank')"),
		Label(' / ').attr('style', 'height:unset;line-height:unset'),
		Label('Changelog').attr('style', 'height:unset;cursor:pointer;line-height:unset').attr('onclick', "window.open('https://github.com/open-mc/client/blob/main/CHANGELOG.md','_blank')")
	).attr('style', 'position: absolute; bottom: 2rem; display: flex; right: 2rem; opacity: 0.4; font-size: 10rem; cursor: pointer')
)
pauseui.esc = hideUI

export function pause(){
	showUI(pauseui)
}
setDefaultUI(pause)