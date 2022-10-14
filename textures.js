function loadfile(name){
	const terrain = new Image()
	terrain.src = name
	return new Promise(r => terrain.onload = () => (terrain.onload=null,r(terrain)))
}
const canvases = []
function extract(img, x, y, w, h){
	let c = canvases.pop()
	if(!c){
		c = document.createElement('canvas').getContext('2d')
	}
	c.canvas.width = w
	c.canvas.height = h
	c.drawImage(img, -x, -y)
	return new Promise(r => c.canvas.toBlob(a=>{
		const img = new Image()
		img.src = URL.createObjectURL(a)
		canvases.push(c)
		img.onload = () => (img.onload=null,r(img))
	}))
}
const filecache = Object.create(null)
export const terrain = async (n) => {
	if(!n)return null
	let [a] = n.match(/:\d+:\d+(?::\d+:\d+)?$/) || []
	if(a){
		n = n.slice(0,-a.length)
		let [, c, r, w, h] = a.split(':')
		if(w)c = +c, r = +r, w = +w, h = +h
		else c *= TEX_SIZE, r *= TEX_SIZE, w = TEX_SIZE, h = TEX_SIZE
		return await extract(filecache[n] || await loadfile(n), c, r, w, h)
	}
	return await loadfile(n)
}
export const TEX_SIZE = 16