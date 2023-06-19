import { key } from '../events.js'
import { hideUI, Input, showUI, ui, UI } from '../ui.js'
let input
const chatui = UI('noshade',
	input = Input('text', '', { msg: /^[^/][^]*/y, c7: /\/\w*/y, c11: /~|~?[+-]?(\d+(\.\d*)?|\.\d+)([Ee][+-]?\d+)?/y, c13: /"(?:[^\\"]|\\.)*"/y, c10: /[^"\s]\S*/y, c9: /"/u}).attr('id', 'chatbox')
)
key('t', () => {
	if(ui) return
	showUI(chatui)
	input.focus()
	input.value = ''
	chat.classList.add('focus')
})
key('/', () => {
	if(ui) return
	showUI(chatui)
	input.focus()
	input.value = '/'
	chat.classList.add('focus')
})
chatui.finish = () => {
	input.blur()
	chat.classList.remove('focus')
}

chatui.esc = hideUI

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
		let v = input.value.trimEnd()
		if(!v) return
		hi = history.push(v)
		input.value = tg = ''
		hideUI()
		ws.send(v)
	}else if(key == 'Backspace' && !input.value){
		hideUI()
	}else return
	event.preventDefault()
}