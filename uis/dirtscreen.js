import { reconnect } from '../js/connectme.js'
import { Btn, Div, Label, Row, showUI, UI, styleToHtml } from '../js/ui.js'
import { serverlist } from './serverlist.js'
import texts from '../js/lang.js'

let label, reconnectBtn
const message = UI('dirtbg',
	label = Label('').css({overflow: 'visible'}),
	Div('spacing'),
	reconnectBtn = Row(Btn(texts.misc.menu_back(), serverlist), Btn(texts.connection.reconnect(), reconnect)),
	Div('spacing')
)
export function msg(txt, allowReconnect = true){
	styleToHtml(txt, label)
	reconnectBtn.hidden = allowReconnect
	showUI(message)
}

let label2
const message2 = UI('dirtbg',
	label2 = Label(''),
	Div('spacing'),
	Btn(texts.connection.disconnect(), serverlist),
	Div('spacing')
)

export function pendingConnection(txt){
	styleToHtml(txt, label2)
	showUI(message2)
}