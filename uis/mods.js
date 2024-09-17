import { Btn, Input, Label, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist } from './serverlist.js'
import texts from '../js/lang.js'
import { storage } from '../js/save.js'

let fileInput, mapInput
export const modsUI = UI('dirtbg',
	Spacer.grow(1),
	Label(texts.serverlist.mods()),
	Spacer(20),
	fileInput = Input('long', 'Files').attr('class', 'tall').css({width: 'calc(100% - 8rem)'}),
	mapInput = Input('long', 'Maps').attr('class', 'tall').css({borderTop: 0, width: 'calc(100% - 8rem)'}),
	Spacer(20),
	Btn(texts.misc.save(), () => {
		storage.files = fileInput.value.trim()
		storage.maps = mapInput.value.trim()
		serverlist()
	}),
	Spacer.grow(1),
)
export function mods(){
	fileInput.value = storage.files||''
	mapInput.value = storage.maps||''
	showUI(modsUI)
}