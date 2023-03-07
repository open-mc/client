export const audioSet = (name, variant, count) => Array.from({length: count}, (_, i) => Audio('/music/'+name+'/'+variant+(i+1)+'.mp3'))

music('overworld',
	"/music/calm1.mp3",
	"/music/calm2.mp3",
	"/music/calm3.mp3",
	"/music/hal1.mp3",
	"/music/hal2.mp3",
	"/music/hal3.mp3",
	"/music/hal4.mp3",
	"/music/nuance1.mp3",
	"/music/nuance2.mp3",
	"/music/piano1.mp3",
	"/music/piano2.mp3",
	"/music/piano3.mp3"
)
music('nether',
	'/music/nether1.mp3',
	'/music/nether2.mp3',
	'/music/nether3.mp3',
	'/music/nether4.mp3'
)

export const lava = {
	ambient: Audio('/music/lava/ambient.mp3'),
	pop: Audio('/music/lava/pop.mp3')
}

export const water = {
	ambient: [Audio('/music/water/ambient1.mp3'), Audio('/music/water/ambient2.mp3')],
}

export function renderItem(c, item, showCount = item && item.count != 1, model = item ? item.model : 0){
	if(!item) return
	if(item.texture){
		if(model == 0){
			c.image(item.texture, -0.5, 0, 1, 1)
		}else if(model == 1){
			c.push()
			c.translate(0.5,0)
			c.translate(-1.2,1.2)
			c.rotate(PI * -0.75)
			c.scale(-1.6, 1.6)
			c.image(item.texture, -0.5, 0, 1, 1)
			c.pop()
		}else if(model == 2){
			c.image(item.texture, -0.75, -0.25, 1.5, 1.5)
		}
	}
	if(showCount){
		c.textBaseline = 'alphabetic'
		c.textAlign = 'right'
		c.fillStyle = '#000'
		c.fillText(item.count + '', 0.56, -0.06, 0.6)
		c.fillStyle = item.count === (item.count & 127) ? '#fff' : '#e44'
		c.fillText(item.count + '', 0.5, 0, 0.6)
	}
}