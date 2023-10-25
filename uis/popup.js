import { Btn, Label, showUI, Spacer, UI } from '../js/ui.js'

let label, cb = Function.prototype
export const message = UI('',
	label = Label(''),
	Spacer(20),
	Btn('Ok', () => cb()),
)

export function popup(txt, fn){
	label.textContent = txt
	cb = fn
	showUI(message)
}