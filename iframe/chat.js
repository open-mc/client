import { drawLayer, drawText, calcText, ping } from "api"

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
	ctx.translate(6, 43)
	for(const {data, sent, pinged} of chat){
		const alpha = max(0, min(1, t-sent-9)), a = (1-alpha)*.25
		ctx.drawRect(-3, -1, 250, 10*data.length, vec4(0, 0, 0, a))
		if(pinged) ctx.drawRect(-3, -1, 2, 10*data.length, vec4(a*4, a*3, 0, a*2))
		for(const part of data) drawText(ctx, part, 0, 0, 8, alpha), ctx.translate(0, 10)
	}
})