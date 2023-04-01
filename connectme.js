import { DataReader, decoder } from "./data.js"
import "./uis/chat.js"
import { msg, pendingConnection, reconn } from "./uis/dirtscreen.js"
import { Btn, click, Div, Img, Label, ping, Row } from "./ui.js"
import { servers, saveServers, storage, options } from "./save.js"
import { destroyIframe, fwPacket, gameIframe } from "./iframe.js"
let lastIp = null
globalThis.ws = null


export const skin = new Uint8Array(1008)

async function makeSign(challenge){
	const a = atob(storage.privKey)
	const b = new Uint8Array(a.length)
	for(let i = 0; i < a.length; i++)b[i] = a.charCodeAt(i)
	const k = await crypto.subtle.importKey('pkcs8', b.buffer, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign'])
	return new Uint8Array(await crypto.subtle.sign(k.algorithm.name, k, challenge))
}
const onerror = function(str){
	finished()
	const code = parseInt(str.slice(0,2), 16)
	reconn(str.slice(2), code)
}
const onpending = function(str){
	const code = parseInt(str.slice(0,2), 16)
	pendingConnection(str.slice(2), code)
}
let blurred = false, notifs = 0

function notif(){
	if(!blurred || !ws) return
	document.title = '(🔴' + (++notifs) + ') ' + ws.name + ' | pMC'
	ping()
}

onfocus = () => {
	blurred = false
	notifs = 0
	document.title = ws ? ws.name + ' | pMC' : 'Paper Minecraft'
}
onblur = () => blurred = true

const unencrypted = /^(localhost|127.0.0.1|0.0.0.0|\[::1\])$/i

const pingRegex = new RegExp('@' + storage.name + '(?!\\w)', 'i')

export function preconnect(ip, cb = Function.prototype){
	const displayIp = ip
	if(!/\w+:\/\//y.test(ip))ip = (location.protocol == 'http:' || unencrypted.test(ip) ? 'ws://' : 'wss://') + ip
	if(!/:\d+$/.test(ip))ip += ':27277'
	let ws
	try{
		ws = new WebSocket(`${ip}/${storage.name}/${encodeURIComponent(storage.pubKey)}/${encodeURIComponent(storage.authSig)}`)
	}catch(e){ws = {close(){this.onclose&&this.onclose()}}}
	ws.challenge = null
	ws.binaryType = 'arraybuffer'
	let timeout = setTimeout(ws.close.bind(ws), 5000)
	ws.onmessage = function({data}){
		if(ws != globalThis.ws){
			const packet = new DataReader(data)
			name.textContent = ws.name = packet.string()
			motd.textContent = packet.string()
			icon.src = packet.string()
			ws.packs = decoder.decode(pako.inflate(packet.uint8array())).split('\0')
			ws.challenge = packet.uint8array()
			cb(ws)
			return
		}
		ws.challenge = null
		if(typeof data == 'string'){
			const style = parseInt(data.slice(0,2), 16)
			if(style == -1)return onerror(data.slice(2))
			else if(style == -2)return onpending(data.slice(2))
			if(style != style)return
			const box = chat.children[9] || document.createElement('div')
			box.textContent = data.slice(2)
			chat.insertAdjacentElement('afterbegin', box)
			box.classList = `c${style&15} s${style>>4}`
			if(options.notifs == 2 || (options.notifs == 1 && pingRegex.test(box.textContent))) notif()
		}else fwPacket(data)
	}
	ws.onclose = () => {
		if(ws == globalThis.ws){
			const msg = timeout >= 0 ? 'Connection refused' : 'Connection lost'
			finished()
			reconn(msg)
			return
		}
		icon.src = './img/no.png'
		motd.textContent = ws instanceof WebSocket ? 'Failed to connect' : 'Invalid IP'
		motd.style.color = '#d22'
		name.textContent = displayIp
	}
	ws.onopen = () => (clearTimeout(timeout), timeout = -1)
	let name, motd, icon
	const node = Row(
		icon = Img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAAXNSR0IArs4c6QAAACZJREFUKFNjZCACMBKhhoEGijo6Ov5XVFQwotMg59DAOny+JMo6AMVLDArhBOpkAAAAAElFTkSuQmCC'),
		Div('',
			Row(name = Label(displayIp),Btn('x', () => {
				servers.splice(node.parentElement.children.indexOf(node), 1)
				node.remove()
				saveServers()
			},'tiny')),
			motd = Label('connecting...').attr('style', 'opacity: 0.5')
		)
	)
	node.onclick = () => {click(); play(ws)}
	node.end = () => {if(ws != globalThis.ws) ws.close(); node.remove()}
	if(!(ws instanceof WebSocket))ws.onclose()
	return node
}
export async function play(ws){
	lastIp = ws.url
	if(!ws.challenge)return
	const signature = await makeSign(ws.challenge)
	const packet = new Uint8Array(signature.length + skin.length)
	packet.set(skin, 0)
	packet.set(signature, skin.length)

	ws.close()
	pendingConnection('Authenticating...')
	setTimeout(() => reconn(`# Fatal error in , line 0
# Check failed: v8_flags.fuzzing.
#FailureMessage Object: 0x16f0d3c08
	1: 0x100e3c884 node::NodePlatform::GetStackTracePrinter()::$_3::__invoke()
	2: 0x101e1b26c V8_Fatal(char const*, ...)
	3: 0x1014a8a54 v8::internal::Runtime_EnsureFeedbackVectorForFunction(int, unsigned long*, v8::internal::Isolate*)
	4: 0x10181f524 Builtins_CEntry_Return1_DontSaveFPRegs_ArgvInRegister_NoBuiltinExit
	5: 0x1018c449c Builtins_CallRuntimeHandler
	6: 0x10179c064 Builtins_InterpreterEntryTrampoline
	7: 0x10179a4f0 Builtins_JSEntryTrampoline
	8: 0x10179a184 Builtins_JSEntry
	9: 0x10106f984 v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams const&)
10: 0x10106fb58 v8::internal::Execution::CallScript(v8::internal::Isolate*, v8::internal::Handle<v8::internal::JSFunction>, v8::internal::Handle<v8::internal::Object>, v8::internal::Handle<v8::internal::Object>)
11: 0x10101f05c v8::internal::DebugEvaluate::Global(v8::internal::Isolate*, v8::internal::Handle<v8::internal::JSFunction>, v8::debug::EvaluateGlobalMode, v8::internal::REPLMode)
12: 0x10101eeb4 v8::internal::DebugEvaluate::Global(v8::internal::Isolate*, v8::internal::Handle<v8::internal::String>, v8::debug::EvaluateGlobalMode, v8::internal::REPLMode)
13: 0x101024de4 v8::debug::EvaluateGlobal(v8::Isolate*, v8::Local<v8::String>, v8::debug::EvaluateGlobalMode, bool)
14: 0x1015417d8 v8_inspector::V8RuntimeAgentImpl::evaluate(v8_inspector::String16 const&, v8_crdtp::detail::ValueMaybe<v8_inspector::String16>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<int>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<double>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<bool>, v8_crdtp::detail::ValueMaybe<v8_inspector::String16>, v8_crdtp::detail::ValueMaybe<bool>, std::__1::unique_ptr<v8_inspector::protocol::Runtime::Backend::EvaluateCallback, std::__1::default_delete<v8_inspector::protocol::Runtime::Backend::EvaluateCallback> >)
15: 0x1017623d4 v8_inspector::protocol::Runtime::DomainDispatcherImpl::evaluate(v8_crdtp::Dispatchable const&)
16: 0x10155e338 v8_crdtp::UberDispatcher::DispatchResult::Run()
17: 0x10153c260 v8_inspector::V8InspectorSessionImpl::dispatchProtocolMessage(v8_inspector::StringView)
18: 0x100eb2204 node::inspector::NodeInspectorClient::dispatchMessageFromFrontend(int, v8_inspector::StringView const&)
19: 0x100eb1e1c node::inspector::(anonymous namespace)::SameThreadInspectorSession::Dispatch(v8_inspector::StringView const&)
20: 0x100eb8e28 node::inspector::(anonymous namespace)::JSBindingsConnection<node::inspector::(anonymous namespace)::LocalConnection>::Dispatch(v8::FunctionCallbackInfo<v8::Value> const&)
21: 0x100fa25a0 v8::internal::MaybeHandle<v8::internal::Object> v8::internal::(anonymous namespace)::HandleApiCallHelper<false>(v8::internal::Isolate*, v8::internal::Handle<v8::internal::HeapObject>, v8::internal::Handle<v8::internal::FunctionTemplateInfo>, v8::internal::Handle<v8::internal::Object>, unsigned long*, int)
22: 0x100fa1d10 v8::internal::Builtin_HandleApiCall(int, unsigned long*, v8::internal::Isolate*)
23: 0x10181f3ec Builtins_CEntry_Return1_DontSaveFPRegs_ArgvOnStack_BuiltinExit`), Math.random() * 3000)
	return

	ws.send(packet)
	globalThis.ws = ws
	onfocus()
	pendingConnection('Authenticating...')
	gameIframe(ws.packs)
}
export function reconnect(){
	if(!lastIp)return
	preconnect(lastIp, play)
}
export function finished(){
	if(!ws)return
	chat.innerHTML = ''
	ws.onclose = Function.prototype
	ws.close()
	ws = null
	notifs = 0
	onfocus()
	destroyIframe()
}