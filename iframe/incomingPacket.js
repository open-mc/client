import { gridEventMap, gridEvents, map, entityMap, server, world, CONFIG, bigintOffset, configLoaded, me, foundMe, _setPerms, worldEvents, exposureMap, cam } from 'world'
import { Chunk, gotId } from './chunk.js'
import { queue } from './sounds.js'
import { moveEntity } from './entity.js'
import { BlockIDs, EntityIDs, Classes, Entity } from 'definitions'
import { codes } from 'api'
import { _add, _addDark, newChunks } from './lighting.js'
import { goto, place, getblock } from 'ant'

function rubberPacket(data){
	Entity.meid = data.uint32() + data.uint16() * 4294967296
	const e = entityMap.get(Entity.meid)??recentlyDeleted.get(Entity.meid)
	if(e && (e != me)) foundMe(e)
	world.r = data.byte()
	world.tps = data.float()
	_setPerms(data.byte(), data.byte())
}
export let loadingChunks = true
function dimensionPacket(data){
	if(!data.left) return void (loadingChunks = false)
	loadingChunks = true
	if(world.type != (world.type = data.byte())){
		queue(world.type)
		gridEventMap.clear()
	}
	world.gx = data.float()
	world.gy = data.float()
	data.read(Classes[0].savedata, world)
}
function clockPacket(data){
	world.tick = data.double()
}

function chunkPacket(buf){
	const chunk = new Chunk(buf)
	const {x,y} = chunk
	const ky = y*0x4000000
	const k = x+ky
	const down = x+(y-1&0x3FFFFFF)*0x4000000
	map.set(k, chunk)
	newChunks.push(chunk)
	let ex = null
	const u = map.get(x+(y+1&0x3FFFFFF)*0x4000000)
	if(u){
		u.down = chunk, chunk.up = u
		const {light,lightI} = u
		if(lightI>-2) for(let i = 0; i < 64; i++) if(light[i]) _add(u, i)
	}
	const d = map.get(down)
	if(d){
		d.up = chunk, chunk.down = d
		chunk.exposure = ex = d.exposure, ex.ref++
		const {light,lightI} = d
		if(lightI>-2) for(let i = 4032; i < 4096; i++) if(light[i]) _add(d, i)
	}else if(ex=exposureMap.get(x))(chunk.exposure=ex).ref++
	else{
		exposureMap.set(x,chunk.exposure=ex=new Int32Array(64).fill(chunk.y<<6))
		ex.ref=1
	}
	if(ex.ref > 1){
		const top = chunk.y+1<<6
		for(let i = 0; i < 64; i++){
			if((top-ex[i]|0)<0) continue
			let i2 = i+4096
			while(true){
				if(i2 < 64){ if(ex[i] == top) ex[i] = chunk.y<<6; break }
				const b = chunk[i2-=64], {solid} = b==65535?chunk.tileData.get(i2):BlockIDs[b]
				if(solid){ ex[i] = (chunk.y<<6|i2>>6)+1; break }
			}
		}
	}
	const l = map.get((x-1&0x3FFFFFF)+ky)
	if(l){
		l.right = chunk, chunk.left = l
		const {light,lightI} = l
		if(lightI>-2) for(let i = 63; i < 4096; i+=64) if(light[i]) _add(l, i)
	}
	const r = map.get((x+1&0x3FFFFFF)+ky)
	if(r){
		r.left = chunk, chunk.right = r
		const {light,lightI} = r
		if(lightI>-2) for(let i = 0; i < 4096; i+=64) if(light[i]) _add(r, i)
	}
	let chy = y<<6
	for(let x = 0; x < 64; x++){
		if((ex[x]-chy-64|0)>=0) continue
		let y = 64
		while(--y>=0){
			const b = chunk[y<<6|x], {solid} = b===65535?chunk.tileData.get(y<<6|x):BlockIDs[b]
			if(solid) break
		}
		if(y<0) continue
		ex[x] = chy+y+1|0
	}
}
function chunkDeletePacket(data){
	while(data.left){
		const cx = data.int() & 0x3FFFFFF, cy = data.int() & 0x3FFFFFF
		const ky = cy*0x4000000
		const chunk = map.get(ky+cx)
		chunk.hide()
		map.delete(ky+cx)
		if(!--chunk.exposure.ref) exposureMap.delete(cx)
		const u = map.get(cx+(cy+1&0x3FFFFFF)*0x4000000)
		if(u) u.down = null
		const d = map.get(cx+(cy-1&0x3FFFFFF)*0x4000000)
		if(d) d.up = null
		const l = map.get((cx-1&0x3FFFFFF)+ky)
		if(l) l.right = null
		const r = map.get((cx+1&0x3FFFFFF)+ky)
		if(r) r.left = null
		for(const v of gridEventMap.values()){
			if(v.x>>>6 == cx && v.y>>>6 == cy) gridEventMap.delete(v.i)
		}
	}
}
function blockSetPacket(buf){
	while(buf.left){
		const type = buf.byte()
		if(type == 255){
			const type2 = buf.byte()
			if(type2 == 255){
				gridEventMap.delete(buf.uint32())
				continue
			}else if(type2 > 0){
				const x = buf.int(), y = buf.int()
				const id = buf.uint32()
				if(!gridEvents[type2]) continue
				goto(x, y)
				const v = gridEvents[type2](buf, x, y)
				if(v){
					v.x = x; v.y = y; v.i = id
					gridEventMap.set(id, v)
				}
				continue
			}
		}
		if(type > 0){
			const x = buf.int(), y = buf.int()
			const bl = getblock()
			goto(x, y)
			if(type in bl) bl[type](buf, x, y)
		}else{
			goto(buf.int(), buf.int())
			const block = place(BlockIDs[buf.short()])
			if(block.savedata) buf.read(block.savedata, block)
		}
	}
}
const recentlyDeleted = new Map
function entityPacket(buf){
	recentlyDeleted.clear()
	while(buf.left){
		let mv = buf.byte()
		const id = buf.uint32() + buf.uint16() * 4294967296
		let e = entityMap.get(id)
		if(!mv){ if(e) e.remove(),recentlyDeleted.set(id, e); else gotId(id); continue }
		if(!e){
			if(mv & 64){
				mv |= 256
				e = new EntityIDs[buf.short()]()
				e.netId = id
				e.age = buf.double()
				buf.read(e.savedata, e)
			}else if(Entity.meid === id) e = me
			else throw 'Update on unrecognised entity '+id
		}else if(mv & 64) Object.setPrototypeOf(e, EntityIDs[buf.short()].prototype), e.age = buf.double(), buf.read(e.savedata, e)
		if(mv & 1) if(abs(e.x - (e.x = buf.double()||0)) > 16 || e == me) e.ix = e.x
		if(mv & 2) if(abs(e.y - (e.y = buf.double()||0)) > 16 || e == me) e.iy = e.y
		if(mv & 4) e.dx = buf.float(), e.dy = buf.float()
		if(mv & 8) e.f = buf.float(), e.state = buf.int()
		if(mv & 16) e.name = buf.string()
		if(mv & 32){
			let id
			while(id = buf.byte())
				e[id](buf)
		}
		if(mv & 256) e.place()
		moveEntity(e)
	}
}

function serverPacket(buf){
	server.title = buf.string()
	server.sub = buf.string()
	if(!buf.left) return
	let l = buf.flint()
	server.players.length = 0
	const skins = Texture(8, 8, l, 0, Formats.RGB)
	let i = 0
	while(l--){
		const name = buf.string()
		const skinBuf = buf.uint8array(192)
		const health = buf.byte(), ping = buf.short()
		skins.pasteData(skinBuf, 0, 0, i, 8, 8, 1)
		server.players.push({name, health, ping, skin: skins.sub(0, 0, 1, 1, i++)})
	}
}

function worldPacket(buf){
	let id
	while(id = buf.byte())
		worldEvents[id]?.(buf)
}

worldEvents(new Array(256))
export { worldEvents }
worldEvents[10] = buf => {
	world.weather = buf.uint32()
	world.weatherFade = 40
}


function setBigintOffset(buf){
	let n = 0n
	for(const v of buf.uint8array())
		n <<= 8n, n |= BigInt(v)
	n <<= 16n
	const offx = Number(bigintOffset.x - n & 0xFFFF0000n) | 0
	bigintOffset.x = n
	n = 0n
	for(const v of buf.uint8array())
		n <<= 8n, n |= BigInt(v)
	n <<= 16n
	const offy = Number(bigintOffset.y - n & 0xFFFF0000n) | 0
	bigintOffset.y = n

	const chunks = [...map.values()]
	map.clear()
	for(const c of chunks){
		c.x += offx >> 6; c.y += offx >> 6
		map.set(c.x+c.y*0x4000000, c)
	}
	for(const e of entityMap.values()){
		e.x += offx; e.y += offy
	}
	for(const g of gridEventMap.values()){
		g.x += offx; g.y += offy
	}
}

function configPacket(buf){
	CONFIG.proximity_chat = buf.float()
	for(const f of configLoaded.listeners) try{f(CONFIG)}catch(e){Promise.reject(e)}
}

function chunkInfoPacket(buf){
	const ch = map.get((buf.int()&0x3FFFFFF)+(buf.int()&0x3FFFFFF)*0x4000000)
	if(!ch) return
	const type = buf.byte()
	if(type != 0) return
	ch.flags = buf.byte()
}

function cameraPacket(buf){
	let flags = buf.byte()
	if((flags & 3) == 1) cam.staticX = buf.double()
	else if((flags & 3) == 2) cam.baseX = buf.float() || 0, cam.staticX = NaN
	if((flags & 12) == 4) cam.staticY = buf.double()
	else if((flags & 12) == 8) cam.baseY = buf.float() || 0, cam.staticY = NaN
	if(flags&16) cam.baseF = ((cam.baseF = buf.float())%PI2+(cam.baseF<0)*PI2)||0, cam.f<cam.baseF-PI?cam.f+=PI2:cam.f>cam.baseF+PI?cam.f-=PI2:0
	if(flags&32) cam.baseZ = buf.float()||0
}

Object.assign(codes, {
	1: rubberPacket,
	2: dimensionPacket,
	3: clockPacket,
	4: serverPacket,
	5: configPacket,
	8: blockSetPacket,
	16: chunkPacket,
	17: chunkDeletePacket,
	18: chunkInfoPacket,
	19: worldPacket,
	20: entityPacket,
	21: cameraPacket,
	64: setBigintOffset
})