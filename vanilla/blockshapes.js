import { Item, toTex, BlockTexture, editBlockTexture, awaitLoad } from 'definitions'
import { peekup, peekdown, peekright, peekleft } from 'ant'

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

const trimTexture = Texture(16, 16, 1).drawable(0, true)
trimTexture.blend = Blend.REPLACE
const trimTex = (t, s) => {
	const b = BlockTexture()
	awaitLoad(t).then(t => {
		trimTexture.clear()
		trimTexture.mask = SET
		for(let i = 0; i < s.length; i+=4)
			trimTexture.drawRect(s[i], s[i+1], s[i+2]-s[i], s[i+3]-s[i+1])
		trimTexture.mask = RGBA | IF_SET
		trimTexture.draw(toTex(t))
		editBlockTexture(b, trimTexture.texture)
	})
	return b
}

const shapeKeys = new Map()
	.set(BlockShape.SLAB, 'slabShape')
	.set(BlockShape.UPPER_SLAB, 'upperSlabShape')

export const blockShaped = (B, s, t = trimTex(B.texture, s, B)) => {
	const o = class extends B{
		static blockShape = s
		static texture = t
	}
	const k = shapeKeys.get(s); if(k) B[k] = o
	return o
}

export const slabifyItem = (I, B) => class extends I{
	places(fx, fy){ return fy > .5 ? B.upperSlabShape : B.slabShape }
	static texture = B.slabShape?.texture
	static defaultName = I.defaultName + ' slab'
}

export const itemify = (B, n) => class extends Item{
	static texture = B.texture
	static defaultName = n
	static useTint = B.brightness==0
	places(){return B}
}
let fluidGeometry
{
	const arr = new Float32Array(488)
	for(let i = 0; i < 82; i++){
		const j = i*6
		arr[j+1] = i%9/8
		arr[j+2] = 1
		arr[j+3] = floor(i/9)/8
		arr[j+6] = 1
		i++
		arr[j+9] = i%9/8
		arr[j+10] = 1
		arr[j+11] = floor(i/9)/8
	}
	fluidGeometry = Geometry(TRIANGLE_STRIP, arr)
}

export const fluidify = (B, type, tex, flowingTex) => {
	B.texture = tex
	B.fluidType = type
	const filled = class extends B{
		variant(){ return !peekup().fluidLevel ? top : undefined }
		static fluidLevel = 8
		static flows = false
	}
	const top = class extends B{
		variant(){ return peekup().fluidLevel ? filled : undefined }
		static blockShape = BlockShape.TWO_SHORT
		static texture = -1
		static fluidLevel = 8
		static flows = false
		render(c, tint){
			const tx = toTex(peekdown() == flowing ? flowingTex : tex)
			tx.h *= .875
			c.drawRect(0, 0, 1, .875, tx, tint)
		}
	}
	const flowing = class extends B{
		static texture = flowingTex
		static fluidLevel = 8
		static flows = true
		static pushY = -6
	}
	const level = class extends B{
		get pushX(){
			const L = this.fluidLevel
			return (peekright().fluidLevel??0) < L ? (peekleft().fluidLevel??0) < L ? 0 : 8 : (peekleft().fluidLevel??0) < L ? -8 : 0
		}
		static texture = -1
		static flows = true
		render(c, tint){
			let y1 = 0, y2 = 0
			{
				const {solid, fluidLevel=0} = peekright()
				y2 = fluidLevel ? min(this.fluidLevel, fluidLevel) : (this.fluidLevel >> 1) + solid
			}
			{
				const {solid, fluidLevel=0} = peekleft()
				y1 = fluidLevel ? min(this.fluidLevel, fluidLevel) : (this.fluidLevel >> 1) + solid
			}
			y1 += y2*9
			c.geometry = fluidGeometry.sub((y1>>1)*6+(y1<<1&2), 4)
			c.draw(toTex(flowingTex), tint)
			c.geometry = null
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