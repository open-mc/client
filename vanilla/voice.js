import { send, onpacket, voice, stopVoice, drawPhase, button } from 'api'
import { entityMap, CONFIG } from 'world'

onpacket(96, buf => {
	if(!pako) return
	const e = entityMap.get(buf.uint32() + buf.uint16()*4294967296)
	if(!e) return
	const sampleRate = buf.uint32()
	const arr = pako.inflateRaw(new Uint8Array(buf.buffer, buf.byteOffset + buf.i, buf.left))
	queuePlay(e, sampleRate, arr)
})

let bufferEnds = new Map()
function queuePlay(e, sampleRate, data){
	if(!e) return
	const f32 = new Float32Array(data.length)
	const b = actx.createBuffer(1, f32.length, sampleRate)
	for(let i = 0; i < f32.length; i++) f32[i] = data[i]/128-1
	b.copyToChannel(f32, 0)
	const n = actx.createBufferSource()
	n.buffer = b
	let obj = bufferEnds.get(e)
	if(!obj){
		const gain = actx.createGain(), pan = gain.connect(actx.createStereoPanner())
		pan.connect(actx.destination)
		bufferEnds.set(e, obj = { ends: 0, gain, pan })
	}
	n.connect(obj.gain)
	if(obj.ends < actx.currentTime || actx.state != 'running' || obj.ends > actx.currentTime + 10) obj.ends = actx.currentTime
	n.start(obj.ends)
	if(obj.ends - actx.currentTime > 0.5) n.playbackRate.value = 1.25
	obj.ends += (f32.length/sampleRate) / n.playbackRate.value
	setVol(e, obj)
}

function setVol(e, obj){
	const dx = e.x-me.x, dy = e.y-me.y
	// TODO
	obj.gain.gain.value = 1-sqrt(dx*dx+dy*dy)/CONFIG.proximitychat
	obj.pan.pan.value = tanh(dx/sqrt(CONFIG.proximitychat)/4)
}

drawPhase(-10000, () => {
	for(const [e, obj] of bufferEnds){
		if(obj.ends < actx.currentTime - 10000){ bufferEnds.delete(e); continue }
		setVol(e, obj)
	}
	if(voice.active && (!buttons.has(KEYS.ENTER)^voiceToggle)) stopVoice(), me.state &= ~0x100
	else if(voice.active && (buttons.has(KEYS.ENTER)^voiceToggle)) voice(sendVoice), me.state |= 0x100
})
let voiceToggle = false
button(KEYS.P, () => voiceToggle = !voiceToggle)
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