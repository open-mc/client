import { Item } from 'definitions'
import { getblock, world } from 'world'
export const BlockShape = {}
BlockShape.SLAB = [0, 0, 1, 0.5]
BlockShape.UPPER_SLAB = [0, 0.5, 1, 1]
BlockShape.STAIRS_RIGHT = [0, 0, 1, 0.5, 0, 0.5, 0.5, 1]
BlockShape.STAIRS_LEFT = [0, 0, 1, 0.5, 0.5, 0.5, 1, 1]
BlockShape.UPPER_STAIRS_RIGHT = [0, 0.5, 1, 1, 0, 0, 0.5, 0.5]
BlockShape.UPPER_STAIRS_LEFT = [0, 0.5, 1, 1, 0.5, 0, 1, 0.5]
BlockShape.VERTICAL_THIN = [0.25, 0, 0.75, 1]
BlockShape.HORIZONTAL_THIN = [0, 0.25, 1, 0.75]
BlockShape.ONE_SHORT = [0, 0, 1, 15/16]
BlockShape.TWO_SHORT = [0, 0, 1, 14/16]


function trimTex(t, s){
	return t && t.then(a => {
		const c = Can(a.w, a.h, true)
		c.defaultTransform()
		c.scale(a.w, a.w)
		for(let y = floor(a.h / a.w) - 1; y >= 0; y--)
			for(let i = 0; i < s.length; i+=4){
				c.rect(s[0],y+s[1],s[2]-s[0],s[3]-s[1])
			}
		c.clip()
		c.image(a, 0, 0, 1, a.h/a.w)
		return c
	})
}

const shapeKeys = new Map()
	.set(BlockShape.SLAB, 'slabShape')
	.set(BlockShape.UPPER_SLAB, 'upperSlabShape')

export const blockShaped = (B, s, t = trimTex(B.texture, B.texture)) => {
	const o = class extends B{
		static blockShape = s
		static texture = trimTex(B.texture, s)
	}
	const k = shapeKeys.get(s); if(k) B[k] = o
	return o
}

export const slabifyItem = (I, B) => class extends I{
	places(fx, fy){ return fy > .5 ? B.upperSlabShape : B.slabShape }
	static texture = B.slabShape?.texture
	static defaultName = I.defaultName + ' slab'
}

export const itemify = (B, n, cat) => class extends Item{
	static texture = B.texture
	static defaultName = n
	static categories = cat
	places(){return B}
}



export const fluidify = (B, type, tex, flowingTex) => {
	B.texture = tex
	B.fluidType = type
	const filled = class extends B{
		variant(x, y){ return !getblock(x, y+1).fluidLevel ? top : undefined }
		static fluidLevel = 8
		static flows = false
	}
	const top = class extends filled{
		variant(x, y){ return getblock(x, y+1).fluidLevel ? filled : undefined }
		static blockShape = BlockShape.TWO_SHORT
		static texture = null
		render(c, x, y){
			const b = getblock(x, y-1)
			const t = b == flowing ? flowingTex : tex
			c.scale(1/16,1/16)
			c.fillPattern(t)
			t.setPatternTransform(1, 0, 0, 1, 0, -t.w-(world.tick%floor(t.h/t.w))*t.w)
			c.fillRect(0, 0, 16, 14)
		}
	}
	const flowing = class extends B{
		static texture = flowingTex
		static fluidLevel = 8
		static flows = true
	}
	const level = class extends B{
		static texture = null
		static flows = true
		render(c, x, y){
			c.scale(1/16,1/16)
			c.fillPattern(flowingTex)
			flowingTex.setPatternTransform(1, 0, 0, 1, 0, -flowingTex.w-(world.tick%floor(flowingTex.h/flowingTex.w))*flowingTex.w)
			let y1 = 0, y2 = 0
			{
				const {solid, fluidLevel} = getblock(x+1,y)
				y2 = fluidLevel ? min(this.fluidLevel, fluidLevel)*2 : this.fluidLevel * (solid/2+.5)
			}
			{
				const {solid, fluidLevel} = getblock(x-1,y)
				y1 = fluidLevel ? min(this.fluidLevel, fluidLevel)*2 : this.fluidLevel * (solid/2+.5)
			}
			c.beginPath()
			c.moveTo(0, 0)
			c.lineTo(16, 0)
			c.lineTo(16, y2)
			c.lineTo(0, y1)
			c.closePath()
			c.fill()
		}
	}
	const levels = [
		null,
		class extends level{static fluidLevel = 1; static blockShape = [0, 0, 1, 2/16]},
		class extends level{static fluidLevel = 2; static blockShape = [0, 0, 1, 4/16]},
		class extends level{static fluidLevel = 3; static blockShape = [0, 0, 1, 6/16]},
		class extends level{static fluidLevel = 4; static blockShape = [0, 0, 1, 8/16]},
		class extends level{static fluidLevel = 5; static blockShape = [0, 0, 1, 10/16]},
		class extends level{static fluidLevel = 6; static blockShape = [0, 0, 1, 12/16]},
		class extends level{static fluidLevel = 7; static blockShape = [0, 0, 1, 14/16]},
	]
	return {filled, top, flowing, levels}
}