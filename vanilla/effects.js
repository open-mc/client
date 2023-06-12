import { music } from 'world'
const {Audio, Texture} = loader(import.meta)

export const audioSet = (name, variant, count) => Array.from({length: count}, (_, i) => Audio('sound/'+name+'/'+variant+(i+1)+'.mp3'))

export const click = Audio('../img/click.mp3')

export const icons = Texture('icons.png')
const btns = Texture('../img/button.png')
export const uiButtons = {
	large: btns.crop(124,20,200,20),
	largeSelected: btns.crop(124,40,200,20),
	largeDisabled: btns.crop(124,0,200,20)
}

music('overworld',
	Audio("sound/calm1.mp3"),
	Audio("sound/calm2.mp3"),
	Audio("sound/calm3.mp3"),
	Audio("sound/hal1.mp3"),
	Audio("sound/hal2.mp3"),
	Audio("sound/hal3.mp3"),
	Audio("sound/hal4.mp3"),
	Audio("sound/nuance1.mp3"),
	Audio("sound/nuance2.mp3"),
	Audio("sound/piano1.mp3"),
	Audio("sound/piano2.mp3"),
	Audio("sound/piano3.mp3")
)
music('nether',
	Audio('sound/nether1.mp3'),
	Audio('sound/nether2.mp3'),
	Audio('sound/nether3.mp3'),
	Audio('sound/nether4.mp3')
)

music('end', Audio('sound/end.mp3'))

export const lava = {
	ambient: Audio('sound/lava/ambient.mp3'),
	pop: Audio('sound/lava/pop.mp3')
}

export const water = {
	ambient: [Audio('sound/water/ambient1.mp3'), Audio('sound/water/ambient2.mp3')],
}

export function renderItem(c, item, respectModel = false){
	if(item && item.texture){
		if(!respectModel || item.model == 0){
			c.image(item.texture, -0.5, 0, 1, 1)
		}else if(item.model == 1){
			c.push()
			c.translate(0.5,0)
			c.translate(-1.2,1.2)
			c.rotate(PI * -0.75)
			c.scale(-1.6, 1.6)
			c.image(item.texture, -0.5, 0, 1, 1)
			c.pop()
		}else if(item.model == 2){
			c.image(item.texture, -0.75, -0.25, 1.5, 1.5)
		}
	}
}

export function renderItemCount(c, item){
	if(!item) return
	const count = item.count
	if(count != 1){
		c.textBaseline = 'alphabetic'
		c.textAlign = 'right'
		c.fillStyle = '#000'
		c.fillText(count + '', 0.56, -0.06, 0.6)
		c.fillStyle = count === (count & 255) ? '#fff' : '#e44'
		c.fillText(count + '', 0.5, 0, 0.6)
	}
}