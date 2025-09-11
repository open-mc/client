import { Btn, Div, Input, Label, Row, Scale, showUI, Spacer, UI } from '../js/ui.js'
import { serverlist, addServer, rmServer } from './serverlist.js'
import texts from '../js/lang.js'
import { pause } from './pauseui.js'
import { play, preconnect } from '../js/connectme.js'
import { LocalSocket } from '../js/iframe.js'
import { defaultConfig, fallback } from '../js/worldconfig.js'

const wtexts = texts.worldoptions

let delTimer = -1
const inputs = {
	name: Input('', '').on('change', () => {config.name = inputs.name.value}),
	seed: Input('', 'Any text. Hashed to 256 bits').on('change', () => {
		config.world.seed = inputs.seed.value
	}),
	clr: Scale(v => {
		config.world.chunk_loading_range = (v=Math.round(v*31)+1)
		return [wtexts.loading_range(v<<6), (v-1)/31]
	}),
	delete: Btn(wtexts.delete(), () => {
		if(delTimer >= 0) return clearTimeout(delTimer), inputs.delete.css({color:'red'}).text = wtexts.delete(), delTimer = -1
		inputs.delete.css({color:'white'}).text = wtexts.delete_undo(3)
		const delId = id
		let timer = 3
		delTimer = setInterval(() => {
			inputs.delete.text = wtexts.delete_undo(--timer)
			if(!timer){
				rmServer(delId)
				serverlist()
			}
		}, 1000)
	}).css({color: '#f33'})
}

const list = Div('optionlist',
	Row(Label(wtexts.world_name()), inputs.name),
	Row(Label(wtexts.world_seed()), inputs.seed),
	Row(Label(''), inputs.clr),
	inputs.delete
)
let row1 = Row(Btn(texts.misc.menu_back(), ()=>(config = null, id='',serverlist()), 'small'), Btn(texts.serverlist.new_world(), () => {
	id = '@' + Date.now()+Math.floor(Math.random()*1e16).toString(10).padStart(16,'0')
	LocalSocket.setOptions(id, config)
	addServer(id)
	preconnect(id, play)
	config = null, id=''
}, 'small'))
let row2 = Row(Btn(texts.misc.discard(), () => (config = null, id='',ws ? pause() : serverlist()), 'small').css({color:'#f33'}), Btn(texts.misc.save(), () => {
	if(typeof id == 'object') id.setOptions(config)
	else LocalSocket.setOptions(id, config)
	config = null, id=''
	ws ? pause() : serverlist()
}, 'small'))
const wO = UI('',
	Spacer.grow(1),
	Label(wtexts()),
	Spacer.grow(1), list,
	Spacer.grow(1),
	row1,
	Spacer.grow(1)
)
let config = null
let id = ''

function showConfig(config){
	inputs.name.placeholder = id
	inputs.name.value = config.name
	inputs.seed.value = config.world.seed
	inputs.clr.set((config.world.chunk_loading_range-1)/31)
	showUI(wO)
}

wO.finish = () => {
	if(delTimer > -1){
		clearInterval(delTimer); delTimer = -1
		inputs.delete.css({color:'red'}).text = wtexts.delete()
	}
}

export function worldoptions(_id = ''){
	if(typeof _id == 'object'){
		row1.parentElement&&row1.replaceWith(row2), inputs.delete.style.display='none'
		showConfig(config = _id.opts)
		id = _id
		return
	}
	if(id=_id) row1.parentElement&&row1.replaceWith(row2), inputs.delete.style.display=''
	else row2.parentElement&&row2.replaceWith(row1), inputs.delete.style.display='none'
	if(id) LocalSocket.getOptions(id).catch(e=>null).then(c => showConfig(config = fallback(c, defaultConfig)))
	else showConfig(config = fallback({}, defaultConfig))
}
