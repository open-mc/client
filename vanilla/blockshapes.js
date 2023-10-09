import { Item } from 'definitions'

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

export const blockShaped = (C, s,o = class extends C{
	static blockShape = s
	static texture = C.texture ? C.texture.then(a => {
		const c = Can(TEX_SIZE, TEX_SIZE, true)
		c.defaultTransform()
		c.scale(TEX_SIZE, TEX_SIZE)
		for(let i = 0; i < s.length; i+=4){
			c.rect(s[0],s[1],s[2]-s[0],s[3]-s[1])
		}
		c.clip()
		c.image(a, 0, 0, 1, 1)
		return c
	}) : null
}) => ((C.variants??=new Map).set(s, o),o)

export const slabifyItem = (C, B) => class extends C{
	places(fx, fy){ return fy > .5 ? B.variants.get(BlockShape.UPPER_SLAB) : B.variants.get(BlockShape.SLAB) }
	static texture = B.variants.get(BlockShape.SLAB)?.texture
}

export const itemify = C => class extends Item{
	static texture = C.texture
	places(){ return C }
}