import { download } from '../js/iframe.js'
import { encoder } from '../server/modules/dataproto.js'

export const defaultConfig = {
	name: "New world",
	icon: "/img/end_portal.png",
	banner: '',
	motd: [ "Last played: Never" ],
	world: {
		get seed(){return Math.floor(Math.random()*4294967296)},
		nether_scale: 16,
		chunk_loading_range: 2
	},
	components: [ "/vanilla/index.js" ],
	generators: {
		overworld: "default",
		nether: "default",
		end: "default",
		void: "void"
	},
	permissions: {
		suicide: true,
		chat: true,
		green_text: true,
		mod_cheat: true,
		max_fill: 16777216,
		default: 2,
		join_as_spectator: false
	},
	proximity_chat: 32,
	magic_word: "hi",
	socket: {
		movement_checks: true,
		movement_check_mercy: 10,
	}
}

export function fallback(o, f){
	if(o == null && typeof f == 'object') o = {}
	else if(Array.isArray(o)) return o
	for(const k in f){
		if(k in o){
			if(typeof f[k] == 'object') fallback(o[k], f[k])
		}else o[k] = f[k]
	}
	return o
}

export function exportWorld(id, name = 'external-world'){
	const db = indexedDB.open(id,1)
	db.onupgradeneeded = () => (db.result.createObjectStore('db'),db.result.createObjectStore('meta'))
	db.onsuccess = () => {
		const def = new pako.Deflate()
		def.onData = ch => {
			res.push(ch)
			if((tot+=ch.byteLength) > 67108864) blobs.push(new Blob(res)), res.length = 0
		}
		const blobs = [], res = []; let tot = 0
		const o = db.result.transaction(['db'], 'readonly').objectStore('db'), done = () => {
			def.push('', true)
			for(const a of res) blobs.push(a); res.length = 0
			download(new File(blobs, name+'.map', {type: '@file'}))
		}
		let L = 1
		let r = o.getAllKeys(null, 1e6); r.onsuccess = function writeKeys(){
			for(const k of r.result){
				L++
				const r = o.get(k); r.onsuccess = () => {
					let l = k.length+r.result.byteLength+1, o = l>63?l>16383?4:2:1, arr = new Uint8Array(l+o)
					const {read, written} = encoder.encodeInto(k, arr.subarray(o))
					if(read<k.length||written>k.length){
						const a2 = encoder.encode(k); l = a2.length+r.result.byteLength+1
						arr = new Uint8Array(l+(o=l>63?l>16383?4:2:1))
						arr.set(a2, o); arr[o+=a2.length] = 255
					}else arr[o+=k.length] = 255
					arr.set(new Uint8Array(r.result), o+1)
					if(l<64) arr[0] = l
					else if(l<16384) arr[0]=l>>8|64,arr[1]=l
					else arr[0]=l>>24|128,arr[1]=l>>16,arr[2]=l>>8,arr[3]=l
					def.push(arr)
					--L||done()
				}
			}
			if(r.result.length == 1e6){
				L++
				r = o.getAllKeys(IDBKeyRange.lowerBound(r.result[999999], true), 1e6)
				r.onsuccess = writeKeys
			}
			--L||done()
		}
	}
}