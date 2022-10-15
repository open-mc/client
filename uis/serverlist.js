import { connection } from "../lib/connectme.js"
import { onServer } from "../save.js"
import sounds from "../ui/sounds.js"
import { Div, Label, showUI, Spacer, UI } from "../ui/ui.js"

let list
const server = ip => {
	let n = Label(ip)
	n.onclick = () => {sounds.click(); connection(ip)}
	return n
}

const serverList = UI('dirtbg',
	Label('Connect to a server:'),
	Spacer(100),
	list = Div('serverlist'),
	Spacer(100)
)
onServer(ip => {
	list.append(server(ip))
})

export function serverlist(){
	showUI(serverList)
}