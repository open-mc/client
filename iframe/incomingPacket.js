import { getblock, setblock, gridEventMap, gridEvents, map, entityMap, server, world, CONFIG, bigintOffset, configLoaded, me, foundMe, _setPerms, worldEvents, exposureMap } from 'world'
import { Chunk } from './chunk.js'
import { queue } from './sounds.js'
import { moveEntity } from './entity.js'
import { BlockIDs, EntityIDs, Classes, Entity } from 'definitions'
import { codes } from 'api'
import { _add, newChunks } from './lighting.js'

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
	if(world.id != (world.id = data.string())){
		queue(world.id)
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
	map.set(x, y, chunk)
	newChunks.push(chunk)
	let ex = null
	const u = map.get(x, y+1n)
	if(u){
		u.down = chunk, chunk.up = u
		const {light,lightI} = u
		if(lightI>-2) for(let i = 0; i < 64; i++) if(light[i]) _add(u, i)
	}
	const d = map.get(x, y-1n)
	if(d){
		d.up = chunk, chunk.down = d
		chunk.exposure = ex = d.exposure, ex.ref++
		const {light,lightI} = d
		if(lightI>-2) for(let i = 4032; i < 4096; i++) if(light[i]) _add(d, i)
	}else if(ex=exposureMap.get(x))(chunk.exposure=ex).ref++
	else{
		exposureMap.set(x,chunk.exposure=ex=new Array(64).fill(0n))
		ex.ref=1; ex.fill(chunk.y+1n<<6n)
	}
	const l = map.get(x-1n, y)
	if(l){
		l.right = chunk, chunk.left = l
		const {light,lightI} = l
		if(lightI>-2) for(let i = 63; i < 4096; i+=64) if(light[i]) _add(l, i)
	}
	const r = map.get(x+1n, y)
	if(r){
		r.left = chunk, chunk.right = r
		const {light,lightI} = r
		if(lightI>-2) for(let i = 0; i < 4096; i+=64) if(light[i]) _add(r, i)
	}
	let chy = y<<6n
	for(let x = 0; x < 64; x++){
		if(ex[x]-chy>=64n) continue
		let y = 64
		while(--y>=0){
			const b = chunk[y<<6|x], {solid} = b===65535?chunk.tileData.get(y<<6|x):BlockIDs[b]
			if(solid) break
		}
		if(y<0) continue
		ex[x] = chy+BigInt(y)+1n
	}
}
function chunkDeletePacket(data){
	while(data.left){
		const cx = data.bigint(), cy = data.bigint()
		const chunk = map.get(cx, cy)
		chunk.hide()
		map.delete(cx, cy)
		if(!--chunk.exposure.ref) exposureMap.delete(cx)
		const u = map.get(cx, cy+1n)
		if(u) u.down = null
		const d = map.get(cx, cy-1n)
		if(d) d.up = null
		const l = map.get(cx-1n, cy)
		if(l) l.right = null
		const r = map.get(cx+1n, cy)
		if(r) r.left = null
		for(const v of gridEventMap.values()){
			if(v.x>>>6n == cx && v.y>>>6n == cy) gridEventMap.delete(v.i)
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
				const x = buf.bigint(), y = buf.bigint()
				const id = buf.uint32()
				if(!gridEvents[type2]) continue
				const v = gridEvents[type2](buf, x, y)
				if(v){
					v.x = x; v.y = y; v.i = id
					gridEventMap.set(id, v)
				}
				continue
			}
		}
		if(type > 0){
			const x = buf.bigint(), y = buf.bigint()
			const bl = getblock(x, y)
			if(type in bl) bl[type](buf, x, y)
		}else{
			const x = buf.bigint(), y = buf.bigint()
			const id = buf.short()
			const block = setblock(x, y, BlockIDs[id])
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
		if(!mv){ if(e) e.remove(),recentlyDeleted.set(id, e); continue }
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
	while(l--){
		const name = buf.string()
		const skinBuf = buf.uint8array(192)
		const health = buf.byte(), ping = buf.short()
		const skin = Texture(8, 8, 1, 0, Formats.RGB)
		skin.pasteData(skinBuf)
		server.players.push({name, health, ping, skin})
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
	const offx = bigintOffset.x - n & -65536n
	bigintOffset.x = n
	n = 0n
	for(const v of buf.uint8array())
		n <<= 8n, n |= BigInt(v)
	n <<= 16n
	const offy = bigintOffset.y - n & -65536n
	bigintOffset.y = n

	const chunks = [...map.values()]
	map.clear()
	for(const c of chunks){
		c.x += offx; c.y += offy
		map.set(c.x, c.y, c)
	}
	let offx1 = Number(offx) * 64, offy1 = Number(offy) * 64
	for(const e of entityMap.values()){
		e.x += offx1; e.y += offy1
	}
	for(const g of gridEventMap.values()){
		g.x += offx1; g.y += offy1
	}
}

function configPacket(buf){
	CONFIG.proximity_chat = buf.float()
	for(const f of configLoaded.listeners) try{f(CONFIG)}catch(e){Promise.reject(e)}
}

function chunkInfoPacket(buf){
	const ch = map.get(buf.bigint(), buf.bigint())
	if(!ch) return
	const type = buf.byte()
	if(type != 0) return
	ch.flags = buf.byte()
}

Object.assign(codes, {
	1: rubberPacket,
	2: dimensionPacket,
	3: clockPacket,
	4: serverPacket,
	5: configPacket,
	8: blockSetPacket,
	19: worldPacket,
	16: chunkPacket,
	17: chunkDeletePacket,
	18: chunkInfoPacket,
	20: entityPacket,
	64: setBigintOffset
})