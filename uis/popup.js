import { Btn, Label, showUI, Spacer, UI } from '../js/ui.js'
import texts from '../js/lang.js'

let label, cb = Function.prototype
export const message = UI('',
	label = Label(''),
	Spacer(20),
	Btn(texts.misc.ok(), () => cb()),
)

export function popup(txt, fn){
	label.textContent = txt
	cb = fn
	showUI(message)
}