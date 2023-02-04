import { BitField } from './bitfield.js'
import { DataReader, jsonToType } from '../data.js'
import { codes } from './incomingPacket.js'
import { frame } from './index.js'
import { cbs, mouseMoveCb, pauseCb, wheelCb } from './controls.js'

buttons = new BitField()
options = {}
loaded = () => {
	for(const data of msgQueue)onMsg({data})
	msgQueue = null
}

const onMsg = ({data}) => {
	if(Array.isArray(data)){
		if(data.length == 2){
			if(typeof data[0] == 'string') options[data[0]] = data[1]
			else for(const cb of mouseMoveCb) cb(data[0], data[1])
			return
		}else if(data.length == 1){
			for(const cb of wheelCb) cb(data[0])
			return
		}
		// import scripts
		Promise.all(data.slice(3).map(a => import(a))).then(() => {
			// done importing
			let i
			i = 0; for(const b of data[0].split('\n'))BlockIDs.push(funcify(b, i++, Blocks))
			i = 0; for(const b of data[1].split('\n'))ItemIDs.push(funcify(b, i++, Items))
			i = 0; for(const b of data[2].split('\n'))EntityIDs.push(funcify(b, i++, Entities))
			if(!--loading)loaded()
			frame()
		})
		function funcify(e, i, dict){
			const a = e.split(" ")
			const name = a.shift()
			const thing = dict[name] || {}
			thing.id = i
			thing.name = name
			thing[Symbol.toStringTag] = (dict == Blocks ? 'Blocks.' : dict == Items ? 'Items.' : 'Entities.') + name
			thing.savedata = jsonToType(a.pop()||'null')
			thing.savedatahistory = a.map(jsonToType)
			const f = dict == Blocks ? 
				thing.savedata ? (data = {}) => Object.setPrototypeOf(data, thing) : (i => i).bind(undefined, Object.create(thing))
			: dict == Items ?
				(count, data = {}) => (data.count=count|0,data.name = data.name||'',Object.setPrototypeOf(data, thing))
			: (data = {}) => {
					data.ix = data.x = data.x || 0
					data.iy = data.y = data.y || 0
					data.dx = data.dx || 0
					data.dy = data.dy || 0
					data.state = data.state || 0
					data.f = typeof data.f == 'number' ? data.f : PI/2
					Object.setPrototypeOf(data, thing)
					return data
				}
			f._ = thing
			thing.constructor = f
			dict[name] = f
			return f
		}
	}else if(data instanceof ArrayBuffer){
		if(loading) return void msgQueue.push(data)
		const packet = new DataReader(data)
		const code = packet.byte()
		if(!codes[code])return
		codes[code](packet)
	}else if(typeof data == 'number'){
		if(data > 65535){
			data -= 65536
			const fn = _soundEndedCbs.get(data)
			if(fn)fn(), _soundEndedCbs.delete(data)
		}else if(data >= 0){
			buttons.set(data)
			if(cbs[data])for(const f of cbs[data])f()
		}else buttons.unset(~data)
	}else if(typeof data == 'boolean'){
		paused = data
		for(const cb of pauseCb) cb()
	}
}
for(const data of [msgQueue, msgQueue = []][0])onMsg({data})
addEventListener('message', onMsg)
onmessage = null

pause = paused => me && postMessage(!!paused, '*')
send = buf => postMessage(buf.build ? buf.build().buffer : buf.buffer || buf, '*')
download = blob => postMessage(blob, '*')