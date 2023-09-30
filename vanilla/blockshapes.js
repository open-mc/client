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

export const slabify = C => C.slabVariant ??= class extends C{
	static blockShape = BlockShape.SLAB
	static texture = C.texture ? C.texture.then(a => {
		const c = Can(16, 16)
		c.defaultTransform()
		c.rect(0, 0, 16, 8)
		c.clip()
		c.image(a, 0, 0)
		return c
	}) : null
}
export const upperslabify = C => C.upperSlabVariant ??= class extends C{
	static blockShape = BlockShape.UPPER_SLAB
	static texture = C.texture ? C.texture.then(a => {
		const c = Can(16, 16)
		c.defaultTransform()
		c.rect(0, 8, 16, 8)
		c.clip()
		c.image(a, 0, 0)
		return c
	}) : null
}

export const slabifyItem = (C, B) => class extends C{
	places(fx, fy){ return fy > .5 ? B.upperSlabVariant : B.slabVariant }
	static texture = B.slabVariant.texture
}