import { drawLayer } from "api"

const chat = []

const chatLimit = 200

export function onChat(str){
	if(chat.unshift(str) > chatLimit) chat.pop()
}

drawLayer('ui', 999, (ctx, w, h) => {
	ctx.translate(2, 42)
	for(const c of chat){
		
	}
})