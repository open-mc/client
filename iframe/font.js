const src = loader(import.meta)

const fontAtlas = Img(src`font/ascii.png`)

const glyphs = new Map()
for(const g of `c0009,c1019,c2029,c8039,ca049,cb059,cd065,d3079,d4089,d5099,da0a9,df0b9,e30c9,f50d9,11f0e9,1300f5,131105,152119,15312b,15e139,15f149,174159,175169,17e179,207189,205,211,227,239,249,259,269,273,287,297,2a7,2b9,2c1,2d9,2e1,2f9,309,319,329,339,349,359,369,379,389,399,3a1,3b1,3c7,3d9,3e7,3f9,40b,419,429,439,449,459,469,479,489,495,4a9,4b9,4c9,4d9,4e9,4f9,509,519,529,539,549,559,569,579,589,599,5a9,5b5,5c9,5d5,5e9,5f9,603,619,629,639,649,659,667,679,689,691,6a9,6b7,6c3,6d9,6e9,6f9,709,719,729,739,745,759,769,779,789,799,7a9,7b7,7c1,7d7,7eb,c7809,fc819,e9829,e2839,e4849,e0859,e5869,e7879,ea889,eb899,e88a9,ef8b5,ee8c9,ec8d3,c48e9,c58f9,c9909,e6919,c6929,f4939,f6949,f2959,fb969,f9979,ff989,d6999,dc9a9,f89b9,a39c9,d89d9,d79e5,1929f9,e1a09,eda13,f3a29,faa39,f1a49,d1a59,aaa69,baa79,bfa89,aea9b,acaa9,bdab9,bcac9,a1ad1,abae9,bbaf9,2591b0d,2592b1f,2593b2f,2502b39,2524b49,2561b59,2562b6d,2556b7d,2555b89,2563b9d,2551bad,2557bbd,255dbcd,255cbdd,255bbe9,2510bf9,2514c0f,2534c1f,252cc2f,251cc3f,2500c4f,253cc5f,255ec6f,255fc7f,255ac8f,2554c9f,2569caf,2566cbf,2560ccf,2550cdf,256ccef,2567cff,2568d0f,2564d1f,2565d2f,2559d3f,2558d4f,2552d5f,2553d6f,256bd7f,256ad8f,2518d99,250cdaf,2588dbf,2584dcf,258cdd7,2590def,2580dff,3b1e0d,3b2e1b,393e2b,3c0e3d,3a3e4b,3c3e5d,3bce6d,3c4e7d,3a6e8b,398e9d,3a9ead,3b4ebb,221eecf,2205edf,2208ee9,2229efb,2261f0b,b1f1b,2265f2b,2264f3b,2320f4f,2321f59,f7f6b,2248f7d,b0f8b,2219f99,b7fa9,221afbf,207ffcb,b2fd9,25a0feb`.split(',')){
	const x = parseInt(g, 16)
	glyphs.set((x>>12)||(x>>4), fontAtlas.sub((x>>4&15)/16, ((~x>>8&15)+0.001)/16, ((x&15)+1)/256, .998/16, 0))
}

const LETTER_SPACING = .125
export function drawText(c, t, x=0, y=0, tint){
	c = c.sub()
	c.translate(x, y)
	for(let i = 0; i < t.length; i++){
		const char = glyphs.get(t.charCodeAt(i))
		if(!char) continue
		const w = char.w*16
		c.drawRect(0, 0, w, 1, char, tint)
		c.translate(w+LETTER_SPACING, 0)
	}
}

export function measureWidth(t){
	let w = 0
	for(let i = 0; i < t.length; i++){
		const char = glyphs.get(t.charCodeAt(i))
		if(!char) continue
		w += char.w*16 + LETTER_SPACING
	}
	return w&&w-LETTER_SPACING
}

export const textShadeCol = vec4(.1777, .1777, .1777, .43)