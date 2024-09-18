import { send, packets, voice, preframe, onkey } from 'api'
import { entityMap, CONFIG, me } from 'world'
import '../img/_pako.js'

const actx = new AudioContext({latencyHint: 'interactive', sampleRate: 22050})

packets[96] = buf => {
	if(!pako) return
	const e = CONFIG.proximity_chat == Infinity ? buf.uint32() + buf.uint16()*4294967296 : entityMap.get(buf.uint32() + buf.uint16()*4294967296)
	const sampleRate = buf.uint32()
	const arr = pako.inflateRaw(new Uint8Array(buf.buffer, buf.byteOffset + buf.i, buf.left))
	queuePlay(e, sampleRate, arr)
}

let bufferEnds = new Map()
function queuePlay(e, sampleRate, data){
	const f32 = new Float32Array(data.length)
	const b = actx.createBuffer(1, f32.length, sampleRate)
	for(let i = 0; i < f32.length; i++) f32[i] = (data[i]-128)/128
	b.copyToChannel(f32, 0)
	const n = actx.createBufferSource()
	n.buffer = b
	let obj = bufferEnds.get(e)
	if(!obj){
		if(typeof e == 'object'){
			const gain = actx.createGain(), pan = gain.connect(actx.createStereoPanner())
			pan.connect(actx.destination)
			bufferEnds.set(e, obj = { ends: 0, gain, pan })
		}else bufferEnds.set(e, obj = { ends: 0 })
	}
	if(typeof e === 'object') n.connect(obj.gain)
	else n.connect(actx.destination)
	if(obj.ends < actx.currentTime || actx.state != 'running' || obj.ends > actx.currentTime + 10) obj.ends = actx.currentTime
	n.start(obj.ends)
	if(obj.ends - actx.currentTime > 0.5) n.playbackRate.value = 1.25
	obj.ends += b.duration / n.playbackRate.value
	if(typeof e === 'object') setVol(e, obj)
}

function setVol(e, obj){
	const dx = e.x-me.x, dy = e.y-me.y
	obj.gain.gain.value = 1-hypot(dx, dy)/CONFIG.proximity_chat
	obj.pan.pan.value = tanh(dx/sqrt(CONFIG.proximity_chat)/4)
}

preframe.bind(() => {
	for(const [e, obj] of bufferEnds){
		if(obj.ends < actx.currentTime - 10000){ bufferEnds.delete(e); continue }
		if(typeof e === 'object') setVol(e, obj)
	}
	if(voice.active && (!buttons.has(KEYS.ENTER)^voiceToggle)) voice.stop(), me.state &= ~0x100
	else if(!voice.active && (buttons.has(KEYS.ENTER)^voiceToggle) && CONFIG.proximity_chat) voice(sendVoice), me.state |= 0x100
})

let voiceToggle = false
onkey(KEYS.P, () => voiceToggle = !voiceToggle)
function sendVoice(f32){
	if(!pako) return
	const arr = new Uint8ClampedArray(f32.length)
	for(let i = 0; i < f32.length; i++) arr[i] = f32[i]*128+128
	const d = pako.deflateRaw(arr)
	const a = new Uint8Array(new ArrayBuffer(d.length+5))
	a.set(d, 5)
	a[0] = 96; a[1] = voice.sampleRate>>24; a[2] = voice.sampleRate>>16; a[3] = voice.sampleRate>>8; a[4] = voice.sampleRate
	send(a)
}