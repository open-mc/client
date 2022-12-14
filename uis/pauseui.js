import { finished } from "../lib/connectme.js"
import { Btn, hideUI, Label, Row, showUI, UI } from "../ui/ui.js"
import { feedback } from "./feedbackui.js";
import { optionsScreen } from "./options.js";
import { serverlist } from "./serverlist.js";

const pauseui = UI('menu',
	Label('Game menu'),
	Btn('Back to Game', hideUI),
	Row(Btn('Options', optionsScreen), Btn('Feedback', feedback)),
	Btn('Disconnect', serverlist)
)

export function pause(){
	showUI(pauseui)
}