import { Btn, Input, Label, Row, showUI, Spacer, UI } from '../js/ui.js'
import { pause } from './pauseui.js'
import { popup } from './popup.js'

function selectBug(){
	if(bug.disabled) return
	bug.disabled = true
	suggestion.disabled = false
}
function selectSuggestion(){
	if(suggestion.disabled) return
	suggestion.disabled = true
	bug.disabled = false
}

let input, send, bug, suggestion
const feedbackui = UI('menu',
	Label('Feedback'),
	Label('Consider joining our discord!').attr('onclick', 'window.open("https://discord.gg/NUUwFNUHkf", "_blank")').css({cursor: 'pointer', textDecoration: 'underline'}),
	input = Input('long', 'Write your feedback').attr('class', 'tall'),
	Row(bug = Btn('Bug', selectBug, 'disabled small'), suggestion = Btn('Suggestion', selectSuggestion, 'small')),
	Spacer(20),
	Row(Btn('Back', pause), send = Btn('Send', submit, 'disabled'))
)

feedback.esc = pause

async function submit(){
	const feedback = input.value
	if(!feedback) return
	send.disabled = true
	input.disabled = false
	//send
	try{
		//wait a some time, then throw an error 😈
		let timeToWait = 200
		while(Math.random() < 0.7) timeToWait += 200
		await new Promise(r => setTimeout(r,timeToWait))
		throw 1
	}catch{
		send.disabled = false
		popup('Failed to send feedback', pause)
		return
	}
	send.disabled = false
	popup('Feedback sent!', pause)
}
feedbackui.finish = () => {
	input.clear()
	input.disabled = false
	send.disabled = true
}
input.oninput = () => {
	if(input.value){
		send.disabled = false
		if(/(trash|rubbish|dumb|stupid|useless) (game|app|clone)|knockoff/i.test(input.value)) input.value = 'no it isn\'t'
		if(/(\W|^)(sh[i1]t|fu?ck\w*|crappy|bullshi|asshol)(?!\w)/i.test(input.value)) input.value = 'don\'t f' + String.fromCharCode(117) + 'cking swear'
	}else send.disabled = true
}

export function feedback(){
	showUI(feedbackui)
}