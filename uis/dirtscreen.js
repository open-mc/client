import { reconnect } from "../lib/connectme.js"
import { Btn, Label, showUI, Spacer, UI } from "../ui/ui.js"

let label, reconnectBtn
const message = UI('dirtbg',
	label = Label(''),
	Spacer(100),
	reconnectBtn = Btn('Reconnect', reconnect),
	Spacer(100)
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