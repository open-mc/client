import { reconnect } from '../js/connectme.js'
import { Btn, Div, Label, Row, showUI, UI } from '../js/ui.js'
import { serverlist } from './serverlist.js'

let label, reconnectBtn
const message = UI('dirtbg',
	label = Label('').attr('style','overflow:visible'),
	Div('spacing'),
	reconnectBtn = Row(Btn('Back', serverlist), Btn('Reconnect', reconnect)),
	Div('spacing')
)
export function msg(txt, code = 15){
	label.className = `s${code >> 4} c${code & 15}`
	label.textContent = txt
	reconnectBtn.hidden = true
	showUI(message)
}

export function reconn(txt, code = 15){
	label.className = `s${code >> 4} c${code & 15}`
	label.textContent = txt
	reconnectBtn.hidden = false
	showUI(message)
}

let label2
const message2 = UI('dirtbg',
	label2 = Label(''),
	Div('spacing'),
	Btn('Disconnect', serverlist),
	Div('spacing')
)

export function pendingConnection(txt, code = 15){
	label2.textContent = txt
	label2.className = `s${code >> 4} c${code & 15}`
	showUI(message2)
}