import { BitField } from './bitfield.js'
import { DataReader, jsonToType } from '../data.js'
import { codes } from './incomingPacket.js'
import { frame } from './index.js'
import { cbs, mouseMoveCb, pauseCb, wheelCb } from './controls.js'
import { blockBreak, punchParticles, stepParticles } from './particles.js'
import './world.js'

Block = class Block{
	static placeSounds = []; static stepSounds = []
	static solid = true
	static texture = null
	static climbable = false
	static gooeyness = 0
	static breaktime = 3
	place(x, y){
		if(this.placeSounds.length)
			sound(this.placeSounds[Math.floor(Math.random() * this.placeSounds.length)], x, y, 1, 0.8)
	}
	break(x, y){
		if(this.placeSounds.length)
			sound(this.placeSounds[Math.floor(Math.random() * this.placeSounds.length)], x, y, 1, 0.8)
		blockBreak(this, x, y)
	}
	punch(x, y){
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], x, y, 0.1375, 0.5)
		punchParticles(this, x, y)
	}
	walk(x, y, e){
		if(!e.alive) return
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], x, y, 0.15, 1)
		if((e.state & 0x1010000) == 0x10000 || (e.state & 4)) stepParticles(this, e)
	}
	fall(x, y){
		if(this.stepSounds.length)
			sound(this.stepSounds[Math.floor(Math.random() * this.stepSounds.length)], x ,y, 0.5, 0.75)
	}
}
Item = class Item{
	constructor(a){ this.count=a&255; this.name='' }
	breaktime(b){ return b.breaktime }
	static maxStack = 64
	static model = 0
}
Entity = class Entity{
	constructor(x,y){
		this.ix = this.x = x
		this.iy = this.y = y
		this.dx = this.dy = 0
		this.state = 0
		this.age = 0
		this.f = PI / 2
		this.blocksWalked = 0
	}
	prestep(){
		const { gooeyness } = getblock(floor(this.x), floor(this.dy > 0 ? this.y : this.y + this.height / 4))
		if(gooeyness) this.dx *= (1 - gooeyness), this.dy *= (1 - gooeyness)
	}
	step(){
		this.blocksWalked += abs(this.dx * dt)
		if((this.state & 0x10000) && !(this.state & 2)){
			if(this.blocksWalked >= 1.7){
				this.blocksWalked = 0
				const x = floor(this.x + this.dx * dt), y = ceil(this.y) - 1
				const block = getblock(x, y)
				if(block.walk) block.walk(x, y, this)
			}
		}else this.blocksWalked = this.dy < -10 ? 1.7 : 1.68
	}
	tick(){}
	event(i){}
	sound(a,b=1,c=1){sound(a, this.ix-.5, this.iy-.5+this.head, b, c)}
	static width = 0.5
	static height = 1
	static head = .5
	static gx = 1
	static gy = 1
	static alive = false
}


buttons = new BitField()
options = {}
loaded = () => {
	for(const data of msgQueue)onMsg({data})
	msgQueue = null
}
const optionListeners = {}
listen = (...keys) => {
	const cb = keys.pop()
	for(const key of keys){
		(optionListeners[key] || (optionListeners[key] = [])).push(cb)
		if(key in options) cb(options[key])
	}
}
listen('music', () => _bgGain.gain.value = options.music * options.music)

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
			if(cbs[data])for(const f of cbs[data])f()
		}else buttons.unset(~data)
	}else if(typeof data == 'boolean'){
		paused = data
		for(const cb of pauseCb) cb()
	}
}
for(const data of [msgQueue, msgQueue = []][0]) onMsg({data})
addEventListener('message', onMsg)
onmessage = null

pause = paused => me && postMessage(!!paused, '*')
send = buf => postMessage(buf.build ? buf.build().buffer : buf.buffer || buf, '*')
download = blob => postMessage(blob, '*')