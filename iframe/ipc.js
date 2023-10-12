import { DataReader, jsonToType } from 'https://unpkg.com/dataproto/index.js'
import { frame } from './index.js'
import { options, listen, _cbs, _mouseMoveCb, _joypadMoveCbs, _pauseCb, _wheelCb, _optionListeners, fakePause, codes, paused } from 'api'
import { Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, Block, Item, Entity } from 'definitions'
import 'world'
import { Chunk } from './chunk.js'

loaded = () => {
	for(const data of msgQueue) try{ onMsg({data}) }catch(e){console.error(e)}
	msgQueue = null
}
listen('music', () => _bgGain.gain.value = options.music * options.music)
listen('sound', () => _volume = options.sound)

const onMsg = ({data,origin}) => {
	if(origin=='null') return
	if(Array.isArray(data)){
		if(data.length == 2){
			const [a, b] = data
			if(typeof a == 'string'){
				options[a] = b
				if(_optionListeners[a]) for(const f of _optionListeners[a]) f(b)
			}else if(me){
				if(paused){
					delta.mx = -(cursor.mx - (cursor.mx = a * devicePixelRatio))
					delta.my = -(cursor.my - (cursor.my = b * devicePixelRatio))
				}else{
					delta.mx = a; delta.my = b
					for(const cb of _mouseMoveCb) cb(a, b)
				}
			}
			return
		}else if(data.length == 3){
			const [id, dx, dy] = data
			if(id == 0){
				delta.jlx = -(cursor.jlx - (cursor.jlx = dx))
				delta.jly = -(cursor.jly - (cursor.jly = dy))
			}else if(id == 1){
				delta.jrx = -(cursor.jrx - (cursor.jrx = dx))
				delta.jry = -(cursor.jry - (cursor.jry = dy))
			}
			if(Object.hasOwn(_joypadMoveCbs, id)) for(const cb of _joypadMoveCbs[id]) cb(dx, dy, id)
			return
		}else if(data.length == 1){
			for(const cb of _wheelCb) cb(data[0])
			return
		}
		// import scripts
		const classes = [{}, Chunk], list = data[3].split('\n')
		for(let i = 0; i < classes.length; i++){
			const h = (list[i]||'{}').split(' ')
			classes[i].savedata = jsonToType(h.pop())
			classes[i].savedatahistory = h.mmap(jsonToType)
		}
		Promise.all(data.slice(4).map(a => import(a))).then(() => {
			// done importing
			let i
			i = 0; for(const b of data[0].split('\n'))funcify(b, i++, Blocks)
			i = 0; for(const b of data[1].split('\n'))funcify(b, i++, Items)
			i = 0; for(const b of data[2].split('\n'))funcify(b, i++, Entities)
			for(const b in Blocks) Object.setPrototypeOf(Blocks[b], Blocks[b].prototype)
			if(!--loading)loaded()
			frame()
		})
		function funcify(a, i, Dict){
			const Constructor = Dict == Items ? Item : Dict == Entities ? Entity : Block
			const List = Dict == Items ? ItemIDs : Dict == Entities ? EntityIDs : BlockIDs
			a = a.split(' ')
			const name = a.shift()
			let Thing = Dict[name] || class extends Constructor{static _ = console.warn((Dict == Blocks ? 'Blocks.' : Dict == Items ? 'Items.' : 'Entities.') + name + ' missing!')}
			if(!Object.hasOwn(Thing, 'prototype')) Thing = class extends Thing.__constructor{}
			if(!(Thing.prototype instanceof Constructor)){
				console.warn('Class ' + name + ' does not extend ' + Constructor.name)
				let T = Thing
				for(let i = T; i.prototype; i = Object.getPrototypeOf(i)) T = i;
				Object.setPrototypeOf(T, Constructor)
				Object.setPrototypeOf(T.prototype, Constructor.prototype)
			}
			Thing.id = i
			Thing.className = name
			Thing[Symbol.toStringTag] = (Dict == Blocks ? 'Blocks.' : Dict == Items ? 'Items.' : 'Entities.') + name
			Thing.savedata = a.length ? jsonToType(a.pop()) : null
			Thing.savedatahistory = a.map(jsonToType)
			List[Thing.id] = Thing
			if(Thing.init) Thing.init()

			// Copy static props to prototype
			// This will also copy .prototype, which we want
			let proto = Thing
			do{
				const desc = Object.getOwnPropertyDescriptors(proto)
				delete desc.length; delete desc.name
				Object.defineProperties(proto.prototype, desc)
				proto = Object.getPrototypeOf(proto)
			}while(proto.prototype && !Object.hasOwn(proto.prototype, 'prototype'))
			if(Dict == Blocks){
				if(!Thing.savedata) Object.defineProperties(Thing.constructor, Object.getOwnPropertyDescriptors(new Thing))
			}
		}
	}else if(data instanceof ArrayBuffer){
		if(loading) return void msgQueue.push(data)
		const packet = new DataReader(data)
		const code = packet.byte()
		if(!codes[code]) return
		try{
			codes[code](packet)
		}catch(e){
			console.error(e)
			console.log(packet, packet.i)
		}
	}else if(typeof data == 'number'){
		if(data >= 0){
			buttons.set(data)
			changed.set(data)
			if(_cbs[data])for(const f of _cbs[data])f()
		}else buttons.unset(~data), changed.set(~data)
	}else if(typeof data == 'boolean') fakePause(data)
}
const m = msgQueue; msgQueue = []
for(const data of m) try{ onMsg({data}) }catch(e){console.error(e)}
addEventListener('message', onMsg)
onmessage = null

download = blob => postMessage(blob, '*')