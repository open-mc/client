import { DataReader, jsonToType } from 'https://unpkg.com/dataproto/index.js'
import { frame } from './index.js'
import { options, listen, _cbs, _mouseMoveCb, _pauseCb, _wheelCb, _optionListeners, fakePause, codes } from 'api'
import { Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, Block, Item, Entity } from 'definitions'
import 'world'
import { Chunk } from './chunk.js'

loaded = () => {
	for(const data of msgQueue)onMsg({data})
	msgQueue = null
}
listen('music', () => _bgGain.gain.value = options.music * options.music)
listen('sound', () => _volume = options.sound)

const onMsg = ({data}) => {
	if(Array.isArray(data)){
		if(data.length == 2){
			const [a, b] = data
			if(typeof a == 'string'){
				options[a] = b
				if(_optionListeners[a]) for(const f of _optionListeners[a]) f(b)
			}else for(const cb of _mouseMoveCb) cb(a, b)
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
			classes[i].savedatahistory = h.mutmap(jsonToType)
		}
		Promise.all(data.slice(4).map(a => import(a))).then(() => {
			// done importing
			let i
			i = 0; for(const b of data[0].split('\n'))funcify(b, i++, Blocks)
			i = 0; for(const b of data[1].split('\n'))funcify(b, i++, Items)
			i = 0; for(const b of data[2].split('\n'))funcify(b, i++, Entities)
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
			Thing.__constructor = Thing
			Thing.constructor = List[Thing.id] = Dict[name] = Dict == Blocks && !Thing.savedata ? function a(){return a} : a => new Thing(a)
			Thing.constructor.prototype = Thing.prototype
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
			if(Dict == Blocks && !Thing.savedata)
				Object.setPrototypeOf(Thing.constructor, Thing.prototype)
				Object.defineProperties(Thing.constructor, Object.getOwnPropertyDescriptors(new Thing))
		}
	}else if(data instanceof ArrayBuffer){
		if(loading) return void msgQueue.push(data)
		const packet = new DataReader(data)
		const code = packet.byte()
		if(!codes[code]) return
		codes[code](packet)
	}else if(typeof data == 'number'){
		if(data >= 0){
			buttons.set(data)
			changed.set(data)
			if(_cbs[data])for(const f of _cbs[data])f()
		}else buttons.unset(~data), changed.set(~data)
	}else if(typeof data == 'boolean') fakePause(data)
}
for(const data of [msgQueue, msgQueue = []][0]) onMsg({data})
addEventListener('message', onMsg)
onmessage = null

download = blob => postMessage(blob, '*')