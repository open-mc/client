import { Btn, Div, hideUI, Label, Row, setDefaultUI, showUI, UI } from '../js/ui.js'
import { controlsScreen } from './controlsScreen.js'
import { feedback } from './feedbackui.js'
import { optionsScreen } from './options.js'
import { serverlist } from './serverlist.js'
import texts from '../js/lang.js'

const keybindsBtn = Btn(texts.keybinds())
keybindsBtn.disabled = true
const pauseui = UI('menu',
	Label(texts.pause.name()),
	Btn(texts.pause.resume(), hideUI),
	Row(Btn(texts.options.general(), optionsScreen), Btn(texts.pause.server_page(), () => {
		const { protocol, host } = new URL(ws.url)
		open(protocol.replace('ws','http')+'//'+host,'_blank')
	})),
	Row(Btn(texts.options.controls(), controlsScreen), keybindsBtn),
	Btn(texts.connection.disconnect(), serverlist),
	Div('',
		Label(texts.pause.credits()).attr('style', 'height:unset;cursor:pointer;line-height:unset').attr('onclick', "window.open('https://github.com/open-mc/client/blob/main/CREDITS.md','_blank')"),
		Label(' / ').attr('style', 'height:unset;line-height:unset'),
		Label(texts.pause.changelog()).attr('style', 'height:unset;cursor:pointer;line-height:unset').attr('onclick', "window.open('https://github.com/open-mc/client/blob/main/CHANGELOG.md','_blank')")
	).attr('style', 'position: absolute; bottom: 2rem; display: flex; right: 2rem; opacity: 0.4; font-size: 8rem; cursor: pointer')
)
pauseui.esc = hideUI

export function pause(){
	showUI(pauseui)
}
setDefaultUI(pause)