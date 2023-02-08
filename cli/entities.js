import { terrainPng } from "./defs.js"
import { renderItem } from "./effects.js"

const meInterface = Texture('/cli/meint.png')

Entities.player = class extends Entity{
	inv = Array.null(36)
	items = [null, null, null, null, null, null]
	health = 20
	selected = 0
	skin = null
	textures = null
	render(c){
		if(!this.textures) return
		const angle = (this.state & 3) == 2 ? sin(t * 4) * this.dx / 5 : sin(t * 12) * this.dx / 10, xs = this.f >= 0 ? 0.9 : -0.9, ys = this.name == 'Dinnerbone' || this.name == 'Grumm' ? -0.9 : 0.9
		const extraAngle = this.state & 8 ? ((-5*t%1+1)%1)*((-5*t%1+1)%1)/3 : 0
		if(this.name && this != me){
			c.textAlign = 'center'
			const {width, top, bottom} = c.measure(this.name)
			c.fillStyle = '#000'
			c.globalAlpha = 0.2
			c.fillRect(width * -0.15 - 0.05, this.height + 0.15 - 0.05, width * 0.3 + 0.1, (bottom + top) * 0.3 + 0.1)
			c.globalAlpha = 1
			c.fillStyle = '#fff'
			c.fillText(this.name, 0, this.height + 0.15 + bottom * 0.3, 0.3)
		}
		if(ys < 0)c.translate(0, this.height)
		c.scale(xs, ys)
		if(this.state & 2){
			c.translate(0.2, 1.2)
			c.rotate(angle - .5)
			c.image(this.textures.arm2, -0.125, -0.625, 0.25, 0.75)
			c.rotate(-angle + .5)
			c.translate(-0.3,-0.45)
			c.rotate(-angle)
			c.image(this.textures.leg2, -0.125, -0.75, 0.25, 0.75)
			c.rotate(angle - .5)
			c.image(this.textures.body, -0.125, -0.125, 0.25, 0.75)
			c.rotate(0.5)
			c.rotate(angle)
			c.image(this.textures.leg1, -0.125, -0.75, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0.3, 0.45)
			c.rotate(-angle - .5 + extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], false)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.image(this.textures.arm1, -0.125, -0.625, 0.25, 0.75)
			c.rotate(angle + .5 - extraAngle)
		}else{
			c.translate(0, 1.375)
			c.rotate(angle)
			c.image(this.textures.arm2, -0.125, -0.625, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0,-0.625)
			c.rotate(-angle)
			c.image(this.textures.leg2, -0.125, -0.75, 0.25, 0.75)
			c.rotate(angle)
			c.image(this.textures.body, -0.125, 0, 0.25, 0.75)
			c.rotate(angle)
			c.image(this.textures.leg1, -0.125, -0.75, 0.25, 0.75)
			c.rotate(-angle)
			c.translate(0, 0.625)
			c.rotate(-angle + extraAngle)
			c.translate(0.2,-0.8)
			c.scale(0.4,0.4)
			renderItem(c, this.inv[this.selected], false)
			c.scale(2.5,2.5)
			c.translate(-0.2,0.8)
			c.image(this.textures.arm1, -0.125, -0.625, 0.25, 0.75)
			c.rotate(angle - extraAngle)
			c.translate(0,0.115)
		}
		c.rotate(PI/2-abs(this.f))
		c.image(this.textures.head, -0.25, 0, 0.5, 0.5)
	}
	appeared(){
		const can = Can(28, 12)
		const skinUnpacked = new ImageData(28, 12)
		for(let i = 0; i < 336; i++){
			skinUnpacked.data[i << 2] = this.skin[i * 3]
			skinUnpacked.data[(i << 2) + 1] = this.skin[i * 3 + 1]
			skinUnpacked.data[(i << 2) + 2] = this.skin[i * 3 + 2]
			skinUnpacked.data[(i << 2) + 3] = 255
		}
		can.putImageData(skinUnpacked, 0, 0)
		this.textures = {
			head: can.texture(20, 4, 8, 8),
			body: can.texture(0, 0, 4, 12),
			arm1: can.texture(4, 0, 4, 12),
			arm2: can.texture(8, 0, 4, 12),
			leg1: can.texture(12, 0, 4, 12),
			leg2: can.texture(16, 0, 4, 12)
		}
	}
	static width = 0.3
	get height(){return this.state & 2 ? 1.5 : 1.8}
	get head(){return this.state & 2 ? 1.4 : 1.6}
	drawInterface(id, c){
		let slot = -1
		// x=0, y=0 => left middle
		// x=176 => right
		if(id == 0){
			c.image(meInterface, 0, 0)
			c.push()
			c.translate(50,5)
			c.scale(32,32)
			const f = this.f
			const {x, y} = c.mouse()
			this.f = atan2(x, y - me.head)
			this.render(c)
			this.f = f
			c.pop()
			c.translate(16, 2)
			c.scale(16,16)
			for(let i = 0; i < 4; i++){
				renderItem(c, this.items[i], undefined, 0)
				const {x, y} = c.mouse()
				if(y >= 0 && y < 1 && x >= -0.5 && x < .5){
					c.fillStyle = '#fff'
					c.globalAlpha = 0.2
					c.fillRect(-0.5, 0, 1, 1)
					c.globalAlpha = 1
					slot = i
				}
				c.translate(0, 1.125)
			}
			c.translate(4.3125, -4.5)
			{
				renderItem(c, this.items[5], undefined, 0)
				const {x, y} = c.mouse()
				if(y >= 0 && y < 1 && x >= -0.5 && x < .5){
					c.fillStyle = '#fff'
					c.globalAlpha = 0.2
					c.fillRect(-0.5, 0, 1, 1)
					c.globalAlpha = 1
					slot = 5
				}
			}
		}
		return slot
	}
}

const pop = Audio('/music/pop.mp3')

Entities.item = class extends Entity{
	item = null
	static width = 0.25
	static height = 0.25
	static savedata = {item: Item}
	render(c){
		c.translate(0, sin(t*2)/12+.15)
		c.scale(0.3125, 0.3125)
		renderItem(c, this.item, false, 0)
	}
	immevent(i){
		if(i == 1){
			sound(pop, this.ix-.5,this.iy-.5,0.2,random()*1.5+0.5)
		}
	}
}