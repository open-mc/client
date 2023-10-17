import { getblock, setblock, gridEventMap, gridEvents, map, entityMap, server, world } from 'world'
import { Chunk } from './chunk.js'
import { queue } from './sounds.js'
import { moveEntity } from './entity.js'
import { BlockIDs, EntityIDs, foundMe } from 'definitions'
import { codes } from 'api'
import { Classes } from './definitions.js'
import { bigintOffset } from './world.js'

function rubberPacket(data){
	meid = data.uint32() + data.uint16() * 4294967296
	const e = entityMap.get(meid)
	if(e && (e != me)) foundMe(e)
	r = data.byte()
	TPS = data.float()
	perms = data.byte()
}
function dimensionPacket(data){
	queue(world.id = data.string())
	world.gx = data.float()
	world.gy = data.float()
	data.read(Classes[0].savedata, world)
}
function clockPacket(data){
	world.tick = data.double()
}
function chunkPacket(buf){
	const chunk = new Chunk(buf)
	const k = (chunk.x&0x3FFFFFF)+(chunk.y&0x3FFFFFF)*0x4000000
	const {ref} = map.get(k) || chunk
	chunk.ref = ref + 1
	map.set(k, chunk)
}
function chunkDeletePacket(data){
	while(data.left){
		const cx = data.int() & 0x3FFFFFF, cy = data.int() & 0x3FFFFFF
		const k = cx+cy*0x4000000
		const chunk = map.get(k)
		if(!--chunk.ref){
			chunk.hide()
			map.delete(k)
			for(const v of gridEventMap.values()){
				if(v.x>>>6 == cx && v.y>>>6 == cy) gridEventMap.delete(v.i)
			}
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
			const bl = getblock(x, y)
			if(type in bl)bl[type](buf, x, y)
		}else{
			const x = buf.int(), y = buf.int()
			const id = buf.short()
			const block = setblock(x, y, BlockIDs[id])
			if(block.savedata) buf.read(block.savedata, block)
		}
	}
}
function entityPacket(buf){
	while(buf.left){
		let mv = buf.byte()
		const id = buf.uint32() + buf.uint16() * 4294967296
		let e = entityMap.get(id)
		if(!mv){e?.remove();continue}
		if(!e){
			if(mv & 64){
				mv |= 256
				e = new EntityIDs[buf.short()]()
				e.netId = id
				e.age = buf.double()
				buf.read(e.savedata, e)
			}else throw 'Not supposed to happen!'
		}else if(mv & 64)Object.setPrototypeOf(e, EntityIDs[buf.short()].prototype), e.age = buf.double(), buf.read(e.savedata, e)
		if(mv & 1)if(abs(e.x - (e.x = buf.double())) > 16 || e == me)e.ix = e.x
		if(mv & 2)if(abs(e.y - (e.y = buf.double())) > 16 || e == me)e.iy = e.y
		if(mv & 4)e.dx = buf.float(), e.dy = buf.float()
		if(mv & 8)e.f = buf.float(), e.state = buf.int()
		if(mv & 16)e.name = buf.string()
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
	const pr = []
	while(l--){
		const name = buf.string()
		const skinBuf = buf.uint8array(192)
		const health = buf.byte(), ping = buf.short()
		const d = new ImageData(8, 8), {data} = d
		for(let i = 0, j = 0; i < 256; i+=4, j+=3){
			data[i] = skinBuf[j]
			data[i|1] = skinBuf[j+1]
			data[i|2] = skinBuf[j+2]
			data[i|3] = 255
		}
		pr.push(createImageBitmap(d).then(img => ({name, health, ping, skin: createTexture(img)})))
	}
	Promise.all(pr).then(a => server.players = a)
}

function worldPacket(buf){
	let id
	while(id = buf.byte())
		worldEvents[id]?.(buf)
}

export const worldEvents = new Array(256)
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

Object.assign(codes, {
	1: rubberPacket,
	2: dimensionPacket,
	3: clockPacket,
	4: serverPacket,
	8: blockSetPacket,
	15: worldPacket,
	16: chunkPacket,
	17: chunkDeletePacket,
	20: entityPacket,
	64: setBigintOffset
})