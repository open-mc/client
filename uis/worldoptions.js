import { addServer, servers, storage } from '../js/save.js'
import { Btn, Div, Input, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist } from './serverlist.js'
import texts from '../js/lang.js'
import { pause } from './pauseui.js'
import { play, preconnect } from '../js/connectme.js'

const list = Div('serverlist')
let row, btn2
const wO = UI('dirtbg',
	Spacer.grow(1),
	Label(texts.options.general.name()),
	Spacer.grow(1), list,
	Spacer.grow(1),
	row = Row(Btn(texts.misc.menu_back(), () => id ? (setOptions(),pause()) : serverlist()), btn2 = Btn(texts.serverlist.new_world(), () => {
		id = '@' + Date.now()+Math.floor(Math.random()*1e16).toString(10).padStart(16,'0')
		setOptions()
		addServer(id)
		preconnect(id, play)
	})),
	Spacer.grow(1)
)
function setOptions(){

}
let id = ''
export function worldoptions(_id = ''){
	if(id=_id) btn2.remove()
	else row.append(btn2)
	showUI(wO)
}