import { key } from "../ui/events.js";
import { hideUI, Input, showUI, UI } from "../ui/ui.js";
let input
const chatui = UI('noshade',
	input = Input('text', '', { txt:/^[^/][^]*/y, c14:/\/\w*/y, c10:/\S+/y}).attr('id', 'chatbox')
)
key('t', () => {
	showUI(chatui)
	input.focus()
	input.value = ''
	chat.classList.add('focus')
})
key('/', () => {
	showUI(chatui)
	input.focus()
	input.value = '/'
	chat.classList.add('focus')
})
chatui.finish = () => {
	input.blur()
	chat.classList.remove('focus')
}
let history = [], hi = 0, tg = ''
input.key = (key) => {
	a: if(key == 'ArrowUp'){
		if(!hi)break a
		if(hi == history.length)tg = input.value
		input.value = history[--hi]
	}else if(key == 'ArrowDown'){
		if(hi >= history.length)break a
		input.value = history[++hi] || tg
	}else if(key == 'Enter'){
		let v = input.value
		hi = history.push(v)
		input.value = tg = ''
		hideUI()
		ws.send(v)
	}else return
	event.preventDefault()
}