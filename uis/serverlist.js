import { connection } from "../lib/connectme.js"
import { addServer, onServer, saveServers, servers } from "../save.js"
import sounds from "../ui/sounds.js"
import { Btn, Div, Input, Label, Row, showUI, Spacer, UI } from "../ui/ui.js"

let list, input, addBtn
const server = ip => {
	let n = Row(Label(ip),Btn('x',()=>{
		servers.splice(n.parentElement.children.indexOf(n), 1)
		n.remove()
		saveServers()
	},'tiny'))
	n.onclick = () => {sounds.click(); connection(ip)}
	return n
}
const serverList = UI('dirtbg',
	Label('Connect to a server:'),
	Spacer(60),
	list = Div('serverlist'),
	Spacer(20),
	Row(input = Input('text', 'server ip'), addBtn = Btn('Add server', () => {if(input.value=='server ip')return input.value = 'very funny';else if(input.value=='very funny')return;addServer(input.value);input.value='';addBtn.disabled=true}, 'small disabled'))
)
input.oninput = () => {addBtn.disabled = !input.value}

onServer(ip => {
	list.append(server(ip))
})

export function serverlist(){
	showUI(serverList)
}