const src = loader(import.meta)

const fontAtlas = Img(src`font/ascii.png`)

const glyphs = new Map()
for(const g of `c0009,c1019,c2029,c8039,ca049,cb059,cd065,d3079,d4089,d5099,da0a9,df0b9,e30c9,f50d9,11f0e9,1300f5,131105,152119,15312b,15e139,15f149,174159,175169,17e179,207189,205,2007209,211,227,239,249,259,269,273,287,297,2a7,2b9,2c1,2d9,2e1,2f9,309,319,329,339,349,359,369,379,389,399,3a1,3b1,3c7,3d9,3e7,3f9,40b,419,429,439,449,459,469,479,489,495,4a9,4b9,4c9,4d9,4e9,4f9,509,519,529,539,549,559,569,579,589,599,5a9,5b5,5c9,5d5,5e9,5f9,603,619,629,639,649,659,667,679,689,691,6a9,6b7,6c3,6d9,6e9,6f9,709,719,729,739,745,759,769,779,789,799,7a9,7b7,7c1,7d7,7eb,c7809,fc819,e9829,e2839,e4849,e0859,e5869,e7879,ea889,eb899,e88a9,ef8b5,ee8c9,ec8d3,c48e9,c58f9,c9909,e6919,c6929,f4939,f6949,f2959,fb969,f9979,ff989,d6999,dc9a9,f89b9,a39c9,d89d9,d79e5,1929f9,e1a09,eda13,f3a29,faa39,f1a49,d1a59,aaa69,baa79,bfa89,aea9b,acaa9,bdab9,bcac9,a1ad1,abae9,bbaf9,2591b0d,2592b1f,2593b2f,2502b39,2524b49,2561b59,2562b6d,2556b7d,2555b89,2563b9d,2551bad,2557bbd,255dbcd,255cbdd,255bbe9,2510bf9,2514c0f,2534c1f,252cc2f,251cc3f,2500c4f,253cc5f,255ec6f,255fc7f,255ac8f,2554c9f,2569caf,2566cbf,2560ccf,2550cdf,256ccef,2567cff,2568d0f,2564d1f,2565d2f,2559d3f,2558d4f,2552d5f,2553d6f,256bd7f,256ad8f,2518d99,250cdaf,2588dbf,2584dcf,258cdd7,2590def,2580dff,3b1e0d,3b2e1b,393e2b,3c0e3d,3a3e4b,3c3e5d,3bce6d,3c4e7d,3a6e8b,398e9d,3a9ead,3b4ebb,221eecf,2205edf,2208ee9,2229efb,2261f0b,b1f1b,2265f2b,2264f3b,2320f4f,2321f59,f7f6b,2248f7d,b0f8b,2219f99,b7fa9,221afbf,207ffcb,b2fd9,25a0feb`.split(',')){
	const x = parseInt(g, 16)
	glyphs.set((x>>12)||(x>>4), fontAtlas.sub((x>>4&15)/16, ((~x>>8&15)+.001)/16, ((x&15)+1)/256, .998/16, 0))
}

const LETTER_SPACING = .125
const colors = [vec4(1,1,1,0), vec4(.333,1,1,0), vec4(1,.333,1,0), vec4(0,.333,1,0), vec4(1,1,.333,0), vec4(.333,1,.333,0), vec4(1,.333,.333,0), vec4(.333,.333,.333,0), vec4(.666,.666,.666,0), vec4(0,.666,.666,0), vec4(.666,0,.666,0), vec4(0,0,.666,0), vec4(.666,.666,0,0), vec4(0,.666,0,0), vec4(.666,0,0,0), vec4(0)]
const shadowColors = [vec4(1,1,1,.98), vec4(.84,1,1,0), vec4(1,.84,1,0), vec4(.84,.84,1,0), vec4(1,1,.84,0), vec4(.84,1,.84,0), vec4(1,.84,.84,0), vec4(.84,.84,.84,0), vec4(.98,.98,.98,.73), vec4(.75,.92,.92,0), vec4(.92,.75,.92,0), vec4(.75,.75,.92,0), vec4(.92,.92,.75,0), vec4(.75,.92,.75,0), vec4(.92,.75,.75,0), vec4(.75,.75,.75,0)]

const hexToInt = a => a>47&&a<58?a-48:a>64&&a<71?a-55:a>96&&a<103?a-87:a==43?131072:65536

let i = 0, text = '', style = 15, tint, tint2

function init(t, s){
	text = t; style = s; i = 0
	tint = colors[s&15]; tint2 = shadowColors[s&15]
}
function nextChar(){
	while(i < text.length){
		let c = text.charCodeAt(i)
		if(c==92){ // Backslash
			const c2 = text.charCodeAt(i+1)
			if(c2==88||c2==120){ // \x**
				c = hexToInt(text.charCodeAt(i+2))<<4|hexToInt(text.charCodeAt(i+3))
				i += 4
				if(c > 65535) c = 65533
			}else if(c2==85||c2==117){ // \u****
				c = hexToInt(text.charCodeAt(i+2))<<4|hexToInt(text.charCodeAt(i+3))|hexToInt(text.charCodeAt(i+4))<<4|hexToInt(text.charCodeAt(i+5))
				i += 6
				if(c > 65535) c = 65533
			}else if(c2 != 92){
				let s = hexToInt(text.charCodeAt(i+1))<<4|hexToInt(text.charCodeAt(i+2))
				if(s&131072) s = s&-131088|style&15
				if(s&2097152) s = s&-2097393|style&240
				i += 3
				if(s>255) continue
				tint = colors[s&15]; tint2 = shadowColors[s&15]
				style = style&-256|s; continue
			}else i++
		}else if(c>=0xd800&&c<0xdc00){ /* High/Low surrogate pair */
			const c2 = text.charCodeAt(++i)
			if(c2 >= 0xdc00 && c2 < 0xe000) i++, c = (c-0xd800<<10|c2-0xdc00)+0x10000
		}else i++
		const glyph = glyphs.get(c)
		if(glyph) return glyph
	}
	return null
}

export function drawText(ctx, t, x=0, y=0, size=1, s = 271){
	init(t, s&255)
	ctx = ctx.sub()
	ctx.translate(x, y)
	ctx.scale(size)
	if(s&32) ctx.skew(.2, 0),ctx.translate(-.0625,0)
	let char
	while(char = nextChar()){
		if((style^(style>>8))&32) ctx.skew(style&32?.2:-.2,0),ctx.translate(style&32?-.0625:.0625,0)
		const w = char.w*16
		if(s&256){
			ctx.drawRect(.125, -.125, w, 1, char, tint2)
			if(style&16) ctx.drawRect(.25, -.125, w, 1, char, tint2)
		}
		ctx.drawRect(0, 0, w, 1, char, tint)
		if(style&16) ctx.drawRect(.125, 0, w, 1, char, tint)
		if(style&64) ctx.drawRect(w, -.0625, style&16384?-w-LETTER_SPACING:-w, .125, vec4(1), tint)
		if(style&128) ctx.drawRect(w, 0.4375, style&32768?-w-LETTER_SPACING:-w, .125, vec4(1), tint)
		ctx.translate(w+LETTER_SPACING + (style&16 ? LETTER_SPACING : 0), 0)
		style = style&255|style<<8
	}
	return style
}

export function measureWidth(t, maxW = NaN, startStyle = 15){
	init(t, startStyle)
	let results = []
	let char, w = 0
	while(char = nextChar()){
		w += char.w*16 + LETTER_SPACING + (style&16 ? LETTER_SPACING : 0)
	}
	results.push(w&&w-LETTER_SPACING)
	return maxW == maxW ? results : results[0]
}

export const textShadeCol = vec4(.1777, .1777, .1777, .43)