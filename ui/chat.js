import { bind, key } from "./events.js";
import { bindInput, hideUI, showUI } from "./ui.js";

bindInput(chatbox, {
	txt:/^[^/][^]*/y,
	c14:/\/\w*/y,
	c10:/\S+/y
})

key('t', () => {
	showUI('chatui')
	chatbox.focus()
	chat.classList.add('focus')
})
key('/', () => {
	showUI('chatui')
	chatbox.focus()
	chatbox.val('/')
	chat.classList.add('focus')
})
chatui.finish = () => {
	chatbox.blur(),chat.classList.remove('focus')
	
}
let history = [], hi = 0, tx = ''
chatbox.key = (key) => {
	a: if(key == 'ArrowUp'){
		if(!hi)break a
		if(hi == history.length)tx = chatbox.val()
		chatbox.val(history[--hi])
	}else if(key == 'ArrowDown'){
		if(hi >= history.length)break a
		chatbox.val(history[++hi] || tx)
	}else if(key == 'Enter'){
		let v = chatbox.val()
		hi = history.push(v)
		chatbox.val(tx = '')
		hideUI()
		ws.send(v)
	}else return
	event.preventDefault()
}