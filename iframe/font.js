import fontAtlas from './font/ascii.png'

const glyphs = new Map()
for(const g of `c0009,c1019,c2029,c8039,ca049,cb059,cd065,d3079,d4089,d5099,da0a9,df0b9,e30c9,f50d9,11f0e9,1300f5,131105,152119,15312b,15e139,15f149,174159,175169,17e179,207189,205,2007209,211,227,239,249,259,269,273,287,297,2a7,2b9,2c1,2d9,2e1,2f9,309,319,329,339,349,359,369,379,389,399,3a1,3b1,3c7,3d9,3e7,3f9,40b,419,429,439,449,459,469,479,489,495,4a9,4b9,4c9,4d9,4e9,4f9,509,519,529,539,549,559,569,579,589,599,5a9,5b5,5c9,5d5,5e9,5f9,603,619,629,639,649,659,667,679,689,691,6a9,6b7,6c3,6d9,6e9,6f9,709,719,729,739,745,759,769,779,789,799,7a9,7b7,7c1,7d7,7eb,c7809,fc819,e9829,e2839,e4849,e0859,e5869,e7879,ea889,eb899,e88a9,ef8b5,ee8c9,ec8d3,c48e9,c58f9,c9909,e6919,c6929,f4939,f6949,f2959,fb969,f9979,ff989,d6999,dc9a9,f89b9,a39c9,d89d9,d79e5,1929f9,e1a09,eda13,f3a29,faa39,f1a49,d1a59,aaa69,baa79,bfa89,aea9b,acaa9,bdab9,bcac9,a1ad1,abae9,bbaf9,2591b0d,2592b1f,2593b2f,2502b39,2524b49,2561b59,2562b6d,2556b7d,2555b89,2563b9d,2551bad,2557bbd,255dbcd,255cbdd,255bbe9,2510bf9,2514c0f,2534c1f,252cc2f,251cc3f,2500c4f,253cc5f,255ec6f,255fc7f,255ac8f,2554c9f,2569caf,2566cbf,2560ccf,2550cdf,256ccef,2567cff,2568d0f,2564d1f,2565d2f,2559d3f,2558d4f,2552d5f,2553d6f,256bd7f,256ad8f,2518d99,250cdaf,2588dbf,2584dcf,258cdd7,2590def,2580dff,3b1e0d,3b2e1b,393e2b,3c0e3d,3a3e4b,3c3e5d,3bce6d,3c4e7d,3a6e8b,398e9d,3a9ead,3b4ebb,221eecf,2205edf,2208ee9,2229efb,2261f0b,b1f1b,2265f2b,2264f3b,2320f4f,2321f59,f7f6b,2248f7d,b0f8b,2219f99,b7fa9,221afbf,207ffcb,b2fd9,25a0feb`.split(',')){
	const x = parseInt(g, 16)
	glyphs.set((x>>12)||(x>>4), fontAtlas.sub((x>>4&15)/16, ((~x>>8&15)+.001)/16, ((x&15)+1)/256, .998/16, 0))
}

const LETTER_SPACING = .125
const colors = [vec4(0,0,0,1), vec4(.667,0,0,1), vec4(0,.667,0,1), vec4(1,.667,0,1), vec4(0,0,.667,1), vec4(.667,0,.667,1), vec4(0,.667,.667,1), vec4(.667,.667,.667,1), vec4(.333,.333,.333,1), vec4(1,.333,.333,1), vec4(.333,1,.333,1), vec4(1,1,.333,1), vec4(.333,.333,1,1), vec4(1,.333,1,1), vec4(.333,1,1,1), vec4(1)]
const shadowColors = [vec4(0,0,0,.02), vec4(.16,0,0,1), vec4(0,.16,0,1), vec4(.16,.16,0,1), vec4(0,0,.16,1), vec4(.16,0,.16,1), vec4(0,.16,.16,1), vec4(.16,.16,.16,1), vec4(.02,.02,.02,.27), vec4(.25,.08,.08,1), vec4(.08,.25,.08,1), vec4(.25,.25,.08,1), vec4(.08,.08,.25,1), vec4(.25,.08,.25,1), vec4(.08,.25,.25,1), vec4(.25,.25,.25,1)]

const a = vec4(0)
let ctx = null, alphaTint = 0, style = 0, tint, tint2
function drawGlyph(code){
	const char = glyphs.get(code)
	if(!char) return
	const w = char.w*16, charWidth = w+(style&16?LETTER_SPACING:0)
	if(style&256){
		const otint2 = alphaTint<1 ? (a.x=tint2.x*alphaTint, a.y=tint2.y*alphaTint, a.z=tint2.z*alphaTint, a.w=tint2.w*alphaTint,a) : tint2
		ctx.drawRect(.125, -.125, w, 1, char, otint2)
		if(style&16) ctx.drawRect(.25, -.125, w, 1, char, otint2)
	}
	const otint = alphaTint<1 ? (a.x=tint.x*alphaTint, a.y=tint.y*alphaTint, a.z=tint.z*alphaTint, a.w=tint.w*alphaTint,a) : tint
	ctx.drawRect(0, 0, w, 1, char, otint)
	if(style&16) ctx.drawRect(.125, 0, w, 1, char, otint)
	if(style&64) ctx.drawRect(w, -.0625, style&4194304?-charWidth-LETTER_SPACING:-charWidth, .125, vec4.one, otint)
	if(style&128) ctx.drawRect(w, 0.4375, style&8388608?-charWidth-LETTER_SPACING:-charWidth, .125, vec4.one, otint)
	ctx.translate(charWidth+LETTER_SPACING, 0)
	style = style&65535|style<<16
}
export function drawText(c, t, x=0, y=0, size=1, alpha = 1){
	if(!fontAtlas.loaded) return void fontAtlas.load()
	alphaTint = alpha; style = 271; let lstyle = 271
	ctx = c.sub()
	ctx.translate(x, y)
	ctx.scale(size)
	tint = colors[15]; tint2 = shadowColors[15]
	if(typeof t=='string') t = [t]
	for(const v of t){
		if(typeof v == 'number' && v<65536){ style = v; continue }
		if((style^lstyle)&15) tint = colors[style&15], tint2 = shadowColors[style&15]
		if((style^lstyle)&32) ctx.skew(style&32?.2:-.2,0),ctx.translate(style&32?-.0625:.0625,0)
		lstyle = style
		if(typeof v == 'number') drawGlyph(v)
		else for(let i = 0; i < v.length; i++) drawGlyph(v.charCodeAt(i))
	}
	return style
}
export const TokenSet = (...a) => {
	const m = new Map
	m.add = (s, f=0, sep) => {
		const set = new Set
		for(let i = 0; i < s.length; i++){
			const c = s.codePointAt(i)
			if(c > 65535) i++
			set.add(c)
		}
		set.sepLen = 0
		if(set.sep = sep) for(let i = 0; i < sep.length; i++){
			const c = sep.codePointAt(i)
			if(c > 65535) i++
			set.sepWidth = glyphs.get(c).w*16+LETTER_SPACING, set.sepLen++
		}else set.sepWidth = 0
		set.flags = f
		for(const itm of set) m.set(itm, set)
		return m
	}
	return m
}
TokenSet.BREAK_BEFORE = 1
TokenSet.BREAK_AFTER = 2
TokenSet.TRIM_START = 4

const defaultTs = TokenSet()
	.add('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúñüÁÉÍÓÚÑÜ', _, '-')
	.add('0123456789()+-.,[]{}')
	.add(' \t', TokenSet.TRIM_START)
	.add('\n', TokenSet.BREAK_AFTER)
let i = 0, j = 0, text = '', charWidth = 0, cs0 = 0, strings = []
const hexToInt = a => a>47&&a<58?a-48:a>64&&a<71?a-55:a>96&&a<103?a-87:a==43?131072:65536
function nextChar(c1 = 0){
	while(i < text.length){
		let c = text.charCodeAt(i)
		if(c==92){ // Backslash
			cs0<i&&strings.push(text.slice(cs0,i))
			let c2 = text.charCodeAt(i+1)
			if(c2>96) c2 -= 32
			if(c2==88){ // \x**
				c = hexToInt(text.charCodeAt(i+2))<<4|hexToInt(text.charCodeAt(i+3))
				i += 4
				if(c > 65535) c = 65533
			}else if(c2==85){ // \u****
				c = hexToInt(text.charCodeAt(i+2))<<12|hexToInt(text.charCodeAt(i+3))<<8|hexToInt(text.charCodeAt(i+4))<<4|hexToInt(text.charCodeAt(i+5))
				i += 6
				if(c > 65535) c = 65533
			}else if(c2==78){ c = 10; i+=2 }
			else if(c2==92){ c = 92; i+=2 }
			else if(c2==84){ c = 9; i+=2 }
			else{
				let s = hexToInt(text.charCodeAt(i+1))<<4|hexToInt(text.charCodeAt(i+2))
				if(s&131072) s = s&-131088|style&15
				if(s&2097152) s = s&-2097393|style&240
				cs0 = i += 3
				if(s>255) continue
				tint = colors[s&15]; tint2 = shadowColors[s&15]
				style = style&-256|s
				strings.push(style); continue
			}
			strings.push(String.fromCharCode(c)); cs0 = i
		}else i++
		if(c1) return c
		if(c>=0xd800&&c<0xdc00){ /* High/Low surrogate pair */
			let j = i, cs1 = cs0, c2 = nextChar(c)
			if(c2 >= 0xdc00 && c2 < 0xe000){
				c = (c-0xd800<<10|c2-0xdc00)+0x10000
				i>cs0+1&&strings.push(text.slice(cs0, i-1), c)
				cs0 = ++i
			}
			else i = j, cs0 = cs1
		}
		const glyph = glyphs.get(c)
		charWidth = glyph ? glyph.w*16+LETTER_SPACING+(style&16 ? LETTER_SPACING : 0) : 0
		return c
	}
	return -1
}
let ls = 271
function pushStrings(arr, len = Infinity){
	let x = 0
	if(cs0<j) strings.push(text.slice(cs0,j)), cs0 = j
	if(ls!=271) arr.push(ls)
	while(x<strings.length&&len>0){
		const i = strings[x++]
		if(typeof i=='string'){
			if((len-=i.length)>=0) arr.push(i)
			else arr.push(i.slice(0,len)),strings[--x]=i.slice(len)
		}else i>65535?len--:ls=i,arr.push(i)
	}
	if(len==Infinity) return void(strings.length = 0)
	strings.splice(0, x)
}
export function calcText(txt, maxW = undefined, s = 271, ts = defaultTs){
	text = txt; style = ls = s; i = 0; cs0 = 0
	let char = nextChar(), line = 0, res = []
	const results = [res], chars = []
	let lineWidth = (typeof maxW == 'number' ? maxW : typeof maxW == 'function' ? maxW(line) : Array.isArray(maxW) ? maxW[line] : Infinity) + LETTER_SPACING, w = 0
	let tokenMatch = null, tokenWidth = 0, count = 0, f = 0
	while(char>=0){
		tokenMatch = ts.get(char) ?? null; f = tokenMatch?tokenMatch.flags:0
		if(tokenMatch) while(true){
			chars.push(charWidth); tokenWidth += charWidth
			if((j=i,(char = nextChar())<0) || !tokenMatch.has(char)) break
		}else chars.push(charWidth), tokenWidth = charWidth, j=i,char = nextChar()
		if(f&1){
			res.width = w-LETTER_SPACING
			pushStrings(res); results.push(res = [])
			line++; lineWidth = (typeof maxW == 'number' ? maxW : typeof maxW == 'function' ? maxW(line) : Array.isArray(maxW) ? maxW[line] : Infinity) + LETTER_SPACING; w = count = 0
		}
		count += chars.length; w += tokenWidth
		while(w>lineWidth){
			let excess = (w-lineWidth)+(tokenMatch?tokenMatch.sepWidth:0)
			res.width = w-LETTER_SPACING-tokenWidth
			line++; lineWidth = (typeof maxW == 'number' ? maxW : typeof maxW == 'function' ? maxW(line) : Array.isArray(maxW) ? maxW[line] : Infinity) + LETTER_SPACING; w = 0
			if((f&4)){
				pushStrings(res, count-chars.length)
				results.push(res = [])
				for(const x of strings) if(typeof x == 'number' && x < 65536) res.push(x)
				cs0 = j; strings.length = 0; count = 0
				break
			}
			if(tokenWidth < lineWidth){
				pushStrings(res, count-chars.length)
				results.push(res = []); w = tokenWidth
				count = chars.length
				break
			}
			let c = 0
			while(excess > 0){ const cw = chars.pop(); if(cw===undefined) break; excess -= cw; w += cw; c++ }
			tokenWidth -= w
			pushStrings(res, count-c)
			if(chars.length>0){
				res.width += tokenWidth
				tokenMatch.sep && res.push(tokenMatch.sep)
			}
			results.push(res = []); count = c
			tokenWidth = w
		}
		if(f&2){
			res.width = w-LETTER_SPACING
			pushStrings(res); results.push(res = [])
			line++; lineWidth = (typeof maxW == 'number' ? maxW : typeof maxW == 'function' ? maxW(line) : Array.isArray(maxW) ? maxW[line] : Infinity) + LETTER_SPACING
			w = count = 0
		}
		chars.length = 0; tokenWidth = 0; tokenMatch = null
	}
	res.width = w-LETTER_SPACING
	pushStrings(res)
	return maxW != undefined ? results : results[0]
}

export const textShadeCol = vec4(.1777, .1777, .1777, .43)