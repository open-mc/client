import { key } from '../js/events.js'
import { keyMsg } from '../js/iframe.js'
import { hideUI, Input, showUI, ui, UI } from '../js/ui.js'
let input
const chatui = UI('noshade',
	input = Input('text', '', { msg: /^[^/][^]*/y, c7: /\/\w*/y, c11: /~|~?[+-]?(\d+(\.\d*)?|\.\d+)([Ee][+-]?\d+)?/y, c13: /"(?:[^\\"]|\\.)*"/y, c10: /[^"\s]\S*/y, c9: /"/u}).attr('id', 'chatbox')
)
key('t', () => {
	if(ui) return
	showUI(chatui)
	keyMsg([Infinity])
	input.focus()
	input.value = ''
})
key('/', () => {
	if(ui) return
	showUI(chatui)
	keyMsg([Infinity])
	input.focus()
	input.value = '/'
})
chatui.finish = () => {
	input.blur()
	keyMsg([-Infinity])
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