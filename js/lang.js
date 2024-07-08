import { options }  from './save.js'

let langObj = null
const langCache = new Map
const proxHandlers = {get: (t, k) => k == Symbol.toPrimitive ? t : prox(t.path?t.path+'.'+k:k)}
function prox(path){
	let fn = langCache.get(path)
	if(fn) return fn
	fn = (...a) => {
		const o = langObj.get(path)
		if(!Array.isArray(o)) return path
		let str = ''
		for(const i of o) if(typeof i == 'string') str += i; else{
			const v = a[i-1]
			str += typeof v=='undefined'?'\\'+i:!v?'':typeof v=='number'?nf.format(v):v instanceof Date?df.format(v):v
		}
		return str
	}
	fn.path = path
	langCache.set(path, fn = new Proxy(fn, proxHandlers))
	return fn
}
export default prox('')
let nf=null, df=null
const hexToInt = a => a>47&&a<58?a-48:a>64&&a<71?a-55:a>96&&a<103?a-87:a==43?131072:65536
export const setLang = lang => {
	lang = lang || navigator.language.split('-',1)[0]
	nf = Intl.NumberFormat(lang)
	df = Intl.DateTimeFormat(lang)
	return fetch('langs/'+lang+'.lang').then(a => a.status == 200 ? a.text().then(a => a[0]=='<'?fetch('langs/en.lang').then(a=>a.text()):a) : fetch('langs/en.lang').then(a => a.text())).then(str => {
		langObj = new Map
		if(!str) return
		for(let line of str.split('\n')){
			let j = line.indexOf('#')
			if(j >= 0) line = line.slice(0, j)
			const match = line.split('=', 2)
			if(match.length < 2) continue
			const str = match[1].trim()
			const txt = []; let l = 0, i = 0; j = 0
			while(i < str.length){
				if(str.charCodeAt(i++) != 92) continue
				if(i-1>j)
					if(l) txt[txt.length-1] += str.slice(j, i-1)
					else txt.push(str.slice(j, i-1)), l = 1
				let c2 = str.charCodeAt(i++)
				let char = 0
				if(c2 == 92) char = 92
				else if(c2==88||c2==120){ // \x**
					char = hexToInt(str.charCodeAt(i+2))<<4|hexToInt(str.charCodeAt(i+3))
					i += 3
					if(char > 65535) char = 65533
				}else if(c2==85||c2==117){ // \u****
					char = hexToInt(str.charCodeAt(i+2))<<4|hexToInt(str.charCodeAt(i+3))|hexToInt(str.charCodeAt(i+4))<<4|hexToInt(str.charCodeAt(i+5))
					i += 5
					if(char > 65535) char = 65533
				}else if(c2==78||c2==110) char = 10;
				else if(c2==83||c2==115) char = 32;
				else if(c2==84||c2==116) char = 9;
				else if(c2 >= 49 && c2 < 58){
					let code = c2-48
					while((c2=str.charCodeAt(i++))>=48&&c2<58) code = code*10+c2-48
					j = --i
					txt.push(code), l = 0
					continue
				}else{ j = i-2; continue }
				if(l) txt[txt.length-1] += String.fromCharCode(char)
				else txt.push(char), l = 1
				j = i
			}
			if(i>j)
				if(l) txt[txt.length-1] += str.slice(j, i)
				else txt.push(str.slice(j, i))
			langObj.set(match[0].trim(), txt)
		}
	})
}
await setLang(options.lang)

export const availableLanguages = ['en', 'es']