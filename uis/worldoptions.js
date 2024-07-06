import { Btn, Div, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist, addServer } from './serverlist.js'
import texts from '../js/lang.js'
import { pause } from './pauseui.js'
import { play, preconnect } from '../js/connectme.js'
import { LocalSocket } from '../js/iframe.js'

const list = Div('serverlist')
let row, btn2
const wO = UI('dirtbg',
	Spacer.grow(1),
	Label(texts.options.general.name()),
	Spacer.grow(1), list,
	Spacer.grow(1),
	row = Row(Btn(texts.misc.menu_back(), () => id ? (LocalSocket.setOptions(id, config),pause()) : serverlist()), btn2 = Btn(texts.serverlist.new_world(), () => {
		id = '@' + Date.now()+Math.floor(Math.random()*1e16).toString(10).padStart(16,'0')
		LocalSocket.setOptions(id, config)
		addServer(id)
		preconnect(id, play)
	})),
	Spacer.grow(1)
)
let config = null
let id = ''

function showConfig(c){
	config=c
	showUI(wO)
}

export function worldoptions(_id = ''){
	if(id=_id) btn2.remove()
	else row.append(btn2)
	if(id) LocalSocket.getOptions(id).catch(e=>null).then(showConfig)
	else showConfig({
		name: 'New world', icon: '/img/end_portal.png',
		motd: ['Singleplayer world'], banner: ''
	})
}