import { drawLayer, drawText, calcText, ping, renderUI, Input } from "api"
import { element, onkey, send, setPointerLock } from "./api.js"

const chat = []

const chatLimit = 200
let chatFocused = false
export function onChat(str){
	if(!str.length) return void ping()
	const pinged = options.notifs === 2 || (options.notifs === 1 && !!me&&str.includes('@'+me.name))
	if(pinged) ping()
	const m = calcText(str, 30.5)
	if(chat.unshift({pinged, sent: t, data: m.reverse()}) > chatLimit) chat.pop()
}
drawLayer('ui', 999, (ctx, w, h) => {
	if(!renderUI) return
	ctx.translate(5, 43)
	for(const {data, sent, pinged} of chat){
		const alpha = chatFocused ? 1 : max(0, min(1, 10-t+sent))
		if(alpha<=0) break
		ctx.drawRect(-3, -1, 250, 10*data.length, vec4(0, 0, 0, alpha*.25))
		if(pinged) ctx.drawRect(-3, -1, 2, 10*data.length, vec4(alpha, alpha*75, 0, alpha*.5))
		for(const part of data) drawText(ctx, part, 0, 0, 8, alpha), ctx.translate(0, 10)
	}
	if(chatFocused) element(chatbox), setPointerLock(false), chatbox.focus()
})

const chatbox = Input('text', '', { msg: /^[^/][^]*/y, c7: /\/\w*/y, c11: /~|~?[+-]?(\d+(\.\d*)?|\.\d+)([Ee][+-]?\d+)?/y, c13: /"(?:[^\\"]|\\.)*"/y, c14: /!|@\w|(@\w)?\[\S*\]/y, c10: /[^"\s]\S*/y, c9: /"/y}).css({
	position: 'fixed',
	bottom: '30rem',
	zIndex: '20',
	left: '2rem',
	background: '#0004',
	border: 'none',
	height: '12rem',
	width: 'calc(100% - 4rem)',
})
chatbox.style.setProperty('--padding', '0 3rem')

onkey(KEYS.T, () => chatFocused = true)
onkey(KEYS.SLASH, () => (chatbox.value = '/', chatFocused = true))
chatbox.on('blur', () => chatFocused = false)
let history = [], hi = 0, tg = ''
chatbox.key = key => {
	a: if(key == KEYS.UP){
		if(!hi) break a
		if(hi == history.length) tg = chatbox.value
		chatbox.value = history[--hi]
	}else if(key == KEYS.DOWN){
		if(hi >= history.length) break a
		chatbox.value = history[++hi] || tg
	}else if(key == KEYS.ENTER){
		let v = chatbox.value.trimEnd()
		if(!v) return
		hi = history.push(v)
		chatbox.value = tg = ''
		chatbox.blur()
		send(v)
	}else if(key == KEYS.BACK && !chatbox.value) chatbox.blur()
	else return false
	return true
}