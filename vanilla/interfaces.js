import { ephemeralInterfaces, EphemeralInterface } from "definitions"
import { renderSlot } from "./effects.js"
const src = loader(import.meta)

export function closeInterface(){
	const buf = new DataWriter()
	buf.byte(15)
	send(buf)
}

const craftingInterface = Img(src`crafting.png`)
ephemeralInterfaces[1] = class extends EphemeralInterface{
	slots = [null, null, null, null, null, null, null, null, null]
	output = null
	getItem(id, slot){ return slot == 9 ? this.output : slot < 9 ? this.slots[slot] : null }
	setItem(id, slot, item){
		// TODO
		if(slot < 9) this.slots[slot] = item
		else this.output = item
	}
	slotClicked(id, slot, holding){
		if(slot < 9) return super.slotClicked(id, slot, holding)
		else return holding
	}
	slotAltClicked(id, slot, holding){
		if(slot < 9) return super.slotAltClicked(id, slot, holding)
		else return holding
	}
	drawInterface(id, c, drawInv){
		if(id != 0) return
		c.drawRect(-88, 0, 176, craftingInterface.subHeight, craftingInterface)
		const c2 = c.sub()
		c2.translate(-14, -7)
		c2.scale(16, 16)
		for(let i = 0; i < 9; i++){
			if(i%3) c2.translate(1.125, 0)
			else c2.translate(-2.25, 1.125)
			renderSlot(c2, this, i, 0)
		}
		c2.translate(3.625, -1.125)
		renderSlot(c2, this, 9, 0)
		drawInv(0, 0)
	}
}