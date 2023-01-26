import { finished, play, preconnect } from "../lib/connectme.js"
import { addServer, onServer, saveServers, servers, storage } from "../save.js"
import { Btn, Div, hideUI, Input, Label, Row, showUI, Spacer, ui, UI } from "../ui/ui.js"

let list, input, addBtn

const serverList = UI('dirtbg',
	Label('Welcome, ' + storage.name + '!').attr('style', 'color: #E92'),
	Label('Connect to a server:'),
	Spacer(50),
	Row('', Btn('Refresh', serverlist)).attr('style', 'align-self: flex-end; padding: 8rem'),
	list = Div('serverlist'),
	Spacer(20),
	Row(input = Input('text', 'server ip'), addBtn = Btn('Add server', () => {if(input.value=='server ip')return input.value = 'very funny';else if(input.value=='very funny')return;addServer(input.value);input.value='';addBtn.disabled=true}, 'small disabled'))
)
input.oninput = () => {addBtn.disabled = !input.value}

serverList.finish = () => {
	for(const node of list.children) node.end()
}

onServer(ip => {
	if(ui == serverList) list.append(preconnect(ip))
})

export function serverlist(){
	finished()
	list.innerHTML = ''
	hideUI()
	for(const ip of servers){
		list.append(preconnect(ip))
	}
	showUI(serverList)
}