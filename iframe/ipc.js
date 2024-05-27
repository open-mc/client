import { DataReader, jsonToType } from '/server/modules/dataproto.js'
import { options, listen, _cbs, onmousemove, _joypadMoveCbs, onwheel, _optionListeners, codes, paused, _onvoice, voice, _updatePaused, _onPacket, onfocus, onblur } from 'api'
import { Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, Block, Item, Entity, Classes } from 'definitions'
import { me } from 'world'
import { onChat } from './chat.js'

Object.assign(globalThis, {Blocks, Items, Entities, BlockIDs, ItemIDs, EntityIDs, me})

Classes[0] = {savedata: null, savedatahistory: []}
let loading = 1
const loaded = () => {
	for(const data of msgQueue) try{ onMsg({data}) }catch(e){Promise.reject(e)}
	loading = -1
	msgQueue = null
}
globalThis.addToQueue = p => p?.then&&(loading++,p.then(()=>--loading||loaded()))
listen('music', () => bgGain.gain.value = options.music * options.music * 2)
listen('sound', () => masterVolume = options.sound*2)
listen('fps', () => ctxFramerate = options.fps ? options.fps < 1 ? options.fps*250 : Infinity : -1)
const onMsg = ({data,origin}) => {
	if(origin=='null') return
	if(Array.isArray(data)){
		if(data.length == 2){
			const {0:a,1:b} = data
			if(typeof a == 'string'){
				options[a] = b
				if(_optionListeners[a]) for(const f of _optionListeners[a]) f(b)
			}else if(me){
				if(paused){
					delta.x = -(cursor.x - (cursor.x = a / innerWidth))
					delta.y = -(cursor.y - (cursor.y = 1 - b / innerHeight))
				}else{
					delta.x = a; delta.y = b
					onmousemove.fire(a, b)
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
		}else if(data.length == 1) return onwheel.fire(data[0])
		// import scripts
		const list = data[3].split('\n')
		for(let i = 0; i < Classes.length; i++){
			const h = (list[i]||'{}').split(' ')
			Classes[i].savedata = jsonToType(h.pop())
			Classes[i].savedatahistory = h.mmap(jsonToType)
		}
		Promise.all(data.slice(4).map(a => import(a))).then(() => {
			// done importing
			let i
			i = 0; for(const b of data[0].split('\n'))funcify(b, i++, Blocks)
			i = 0; for(const b of data[1].split('\n'))funcify(b, i++, Items)
			i = 0; for(const b of data[2].split('\n'))funcify(b, i++, Entities)
			if(!--loading)loaded()
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
				const desc = Object.getOwnPropertyDescriptors(proto), desc2 = Object.getOwnPropertyDescriptors(proto.prototype)
				delete desc.length; delete desc.name
				Object.defineProperties(proto.prototype, desc)
				Object.defineProperties(proto, desc2)
				proto = Object.getPrototypeOf(proto)
			}while(proto.prototype && !Object.hasOwn(proto.prototype, 'prototype'))
			if(Dict == Blocks && !Thing.savedata){
				if(!Thing.savedata) Object.defineProperties(Thing.constructor, Object.getOwnPropertyDescriptors(new Thing))
			}
		}
	}else if(data instanceof ArrayBuffer){
		if(loading>0) return void msgQueue.push(data)
		_onPacket(data)
	}else if(typeof data == 'string'){
		onChat(data)
	}else if(data instanceof Float32Array) _onvoice?.(data)
	else if(typeof data == 'number'){
		if(!Number.isFinite(data)){
			if(data > 0) onfocus.fire()
			else if(data < 0) onblur.fire()
		}else if(data >= 5e9) voice.sampleRate = data - 5e9
		else if(data >= 0){
			buttons.set(data)
			changed.set(data)
			if(_cbs[data])for(const f of _cbs[data])f()
		}else buttons.pop(~data) && changed.set(~data)
	}else if(typeof data == 'boolean') _updatePaused(data)
}
const m = msgQueue; msgQueue = []
for(const data of m) try{ onMsg({data}) }catch(e){ Promise.reject(e) }
addEventListener('message', onMsg)
onmessage = null