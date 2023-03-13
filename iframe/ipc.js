import { BitField } from './bitfield.js'
import { DataReader, jsonToType } from '../data.js'
import { codes } from './incomingPacket.js'
import { frame } from './index.js'
import { buttons, options, listen, _cbs, _mouseMoveCb, _pauseCb, _wheelCb, _optionListeners } from 'api'
import { Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, Block, Item, Entity } from 'definitions'
import 'world'
import { _setPaused } from './api.js'

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
		Promise.all(data.slice(3).map(a => import(a))).then(() => {
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
			const shared = Dict == Items ? new Thing(1) : Dict == Blocks ? new Thing : null
			List[Thing.id] = Dict[name] = Dict == Items ? c => new Thing(c) : Dict == Blocks ? 
				Thing.savedata ? () => shared : Function.returns(shared)
			: (x, y) => new Thing(x, y)
			Thing.constructor = Dict[name]
			if(Thing.prototype.static) Thing.prototype.static.call(Thing)
			else if(Thing.static) Thing.static()
			// Copy static props to prototype
			// This will also copy .prototype, which we want
			let proto = Thing
			do{
				const desc = Object.getOwnPropertyDescriptors(proto)
				delete desc.length; delete desc.name
				Object.defineProperties(proto.prototype, desc)
				proto = Object.getPrototypeOf(proto)
			}while(proto.prototype && !Object.hasOwn(proto.prototype, 'prototype'))
			Object.setPrototypeOf(Dict[name], Thing.prototype)
			if(Dict == Blocks || Dict == Items)
				Object.defineProperties(Dict[name], Object.getOwnPropertyDescriptors(shared))
		}
	}else if(data instanceof ArrayBuffer){
		if(loading) return void msgQueue.push(data)
		const packet = new DataReader(data)
		const code = packet.byte()
		if(!codes[code])return
		codes[code](packet)
	}else if(typeof data == 'number'){
		if(data >= 0){
			buttons.set(data)
			if(_cbs[data])for(const f of _cbs[data])f()
		}else buttons.unset(~data)
	}else if(typeof data == 'boolean'){
		_setPaused(data)
		for(const cb of _pauseCb) cb()
	}
}
for(const data of [msgQueue, msgQueue = []][0]) onMsg({data})
addEventListener('message', onMsg)
onmessage = null

send = buf => postMessage(buf.build ? buf.build().buffer : buf.buffer || buf, '*')
download = blob => postMessage(blob, '*')