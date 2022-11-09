import { terrain, TEX_SIZE } from '../textures.js'
import { jsonToType } from './data.js'

const functions = {
	sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan',
	abs: 'Math.abs', max: 'Math.max', min: 'Math.min',
	pow: 'Math.pow', sqrt: 'Math.sqrt', cbrt: 'Math.cbrt',
	rand: 'Math.random', floor: 'Math.floor', ceil: 'Math.ceil',
	sign: 'Math.sign'
}, identifiers = {
	pi: 'Math.PI', e: 'Math.E', exp: 'Math.exp', t: 't', x: "args.x", y: "args.y", f: "args.f", dx: "args.dx", dy: "args.dy"
}, indeterministic = new Set('t rand x y f dx dy'.split(' '))
Object.setPrototypeOf(identifiers, null)
Object.setPrototypeOf(functions, null)
Number.prototype.times = function(a){return this*a}
function expr(a){
	if(typeof a == 'object')return 0
	else if(typeof a != 'string')return +a
	try{
		let i = 0, br = 0, len = 0, ind = false
		let arr = a.toLowerCase().match(/[a-z]+|(\d+(\.\d+)?|\.\d+)([Ee][+-]?\d+)?|[+\-*\/%]|\(|\)| +/gy).filter(a => a[0] == ' ' ? (len += a.length, false) : true)
		for(let t of arr){
			let peek = arr[i + 1] || ''
			len += t.length
			if(t >= 'a' && t <= 'z'){
				let id = identifiers[t]
				if(id){
					if(peek == '(')id+='.times'
				}else{
					id = functions[t]
					if(!id)throw t+' isn\'t a variable or a function'
					if(peek != '(')throw 'expected a \'(\' after '+t
				}
				if(indeterministic.has(t))ind = true
				if(/[\.a-z0-9]/y.test(peek))throw 'unexpected \''+peek+'\''
				t = id
			}else if(t == '('){
				br++
				if(peek == ')')t = '(0'
				else if(/[,*\/%]/y.test(peek))throw 'unexpected \''+peek+'\''
			}else if(t == ')'){
				br--
				if(br < 0)throw 'too many \')\''
				if(/[\.a-z0-9]/y.test(peek))throw 'unexpected \''+peek+'\''
				if(peek == '(')t+='*'
			}else if(/[\.0-9]/y.test(t)){
				if(/[a-z]/y.test(peek))throw 'unexpected \''+peek+'\''
			}else if(t == ','){
			if(/[,*\/%)]/y.test(peek))throw 'unexpected \''+peek+'\''
			}else{
				if(peek == ')' || !peek)throw 'unexpected end of expression'
			}
			arr[i++] = t
		}
		if(len < a.length)throw 'bad character: '+a[len]
		if(br > 0)throw 'not enough \')\''
		return ind ? new Function('args', 'return '+arr.join('')) : eval(arr.join(''))
	}catch(e){
		console.warn(e)
		return 0
	}
}
async function processblock(obj, c){
	obj.texture = obj.texture ? await terrain(c.base_url + obj.texture) : null
}
async function processitem(obj, c){
	obj.texture = obj.texture ? await terrain(c.base_url + obj.texture) : null
}
export const entityTextureProps = ['x', 'y', 'ax', 'ay', 'w', 'h', 'r']
async function processentity(obj, c){
	let el = document.createElement('entity')
	obj.renderfns = []
	for(const t of obj.textures){
		const i = await terrain(c.base_url + t.src)
			el.append(i)
			if(t.w)i.width = t.w * TEX_SIZE
			else t.w = i.width / TEX_SIZE
			if(t.h)i.height = t.h * TEX_SIZE
			else t.h = i.height / TEX_SIZE
			let fns = []
			obj.renderfns.push(fns)
			for(let p of entityTextureProps){
			if(!(p in t)){fns.push(null);continue}
			let fn = expr(t[p])
			if(typeof fn == 'number')i.style.setProperty('--'+p, fn),fns.push(null)
			else fns.push(fn)
		}
	}
	el.style.width = TEX_SIZE * (obj.width || 1) + 'px'
	el.style.height = TEX_SIZE * (obj.height || 1) + 'px'
	obj.width /= 2
	obj.textures = el
}
function processall(o){
	let arr = []
	const config = Object.assign({
		base_url: ""
	}, o.config)
	Object.defineProperty(o, 'config', {value:config,enumerable:false})
	for(const v in o)arr.push(this(o[v], config))
	return Promise.all(arr).then(_=>o)
}
export const [Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs] = await Promise.all([
	fetch('../ext/blocks.json').then(a=>a.json()).then(processall.bind(processblock)),
	fetch('../ext/items.json').then(a=>a.json()).then(processall.bind(processitem)),
	fetch('../ext/entities.json').then(a=>a.json()).then(processall.bind(processentity)),
	fetch('../ext/blockindex.txt').then(a=>a.text()).then(a=>a.split('\n')),
	fetch('../ext/itemindex.txt').then(a=>a.text()).then(a=>a.split('\n')),
	fetch('../ext/entityindex.txt').then(a=>a.text()).then(a=>a.split('\n'))
])
function iterate(list, dict, n, fngen){
	for(let i = 0; i < list.length; i++){
		const a = list[i].split(" ")
		const name = a.shift()
		const block = dict[name] || {}
		block.id = i
		block.name = name
		block[Symbol.toStringTag] = n + '.' + name
		block.savedata = jsonToType(a.pop()||'null')
		block.savedatahistory = a.map(jsonToType)
		const f = fngen(block)
		f._ = block
		list[i] = f
		dict[name] = f
	}
}
const CONSTR = (obj, data = {}) => Object.setPrototypeOf(data, obj)
iterate(BlockIDs, Blocks, 'Blocks', block => block.savedata ? CONSTR.bind(undefined, block) : _ => block)
iterate(ItemIDs, Items, 'Item', item => ((obj, count, data = {}) => (data.count=count|0,Object.setPrototypeOf(data, obj))).bind(undefined, item))
iterate(EntityIDs, Entities, 'Entities', entity => (data = {}) => {
	data.x = data.x || 0; data.y = data.y || 0
	data.dx = data.dx || 0; data.dy = data.dy || 0
	data.f = typeof data.f == 'number' ? data.f : Math.PI/2
	data.tx = data.ty = data.tf = NaN
	Object.setPrototypeOf(data, entity)
	return data
})