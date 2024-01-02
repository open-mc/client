import { ephemeralInterfaces } from "definitions"
import { renderSlot } from "./effects.js"
const {Texture} = loader(import.meta)

const craftingInterface = Texture('crafting.png')
ephemeralInterfaces[1] = class{
	slots = [null, null, null, null, null, null, null, null, null]
	output = null
	getItem(id, slot){ return id == 0 ? slot == 10 ? this.output : this.slots[slot] : undefined }
	setItem(id, slot, item, force){
		if(id == 0){
			if(slot == 10){
				if(!force) return true
				this.output = slot
			}else this.slots[slot] = item
		}else return true
	}
	drawInterface(id, c, drawInv){
		if(id == 0){
			c.image(craftingInterface, -88, 0)
			c.push()
			c.translate(-14, -7)
			c.scale(16, 16)
			for(let i = 0; i < 9; i++){
				if(i%3) c.translate(1.125, 0)
				else c.translate(-2.25, 1.125)
				renderSlot(c, this, i, 0)
			}
			c.pop()
			drawInv(0, 0)
		}
	}
}