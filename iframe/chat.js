import { drawLayer, drawText, calcText, ping, chatFocused, renderUI } from "api"

const chat = []

const chatLimit = 200

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
})