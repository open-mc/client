const binds = {}, presses = {}, releases = {}, keysdown = new Set()
export function updateKeys(){
	if(document.activeElement != document.body)return
	const details = {
		control: keysdown.has('control'),
		meta: keysdown.has('meta'),
		shift: keysdown.has('shift'),
		alt: keysdown.has('shift'),
		ctrl: keysdown.has('meta') || keysdown.has('control')
	}
	for(let key of keysdown) {
		if(key == 'meta' || key == 'control')key = 'ctrl'
		try{binds[key] && binds[key](details)}catch(e){console.error(e)}
	}
}
onkeydown = e => {
	const key = e.key.toLowerCase()
	keysdown.add(key)
	if(document.activeElement != document.body && e.key != 'Escape')return
	const handlers = presses[key]
	if(!handlers)return
	e.preventDefault()
	if(e.repeat)return
	if(e.ctrlKey || (deviceSucks && e.metaKey)){
		if(e.altKey)handlers[3](e)
		else handlers[1](e)
	}else{
		if(e.altKey)handlers[2](e)
		else handlers[0](e)
	}
}
onkeyup = e => {
	const key = e.key.toLowerCase()
	if(key == 'control' || key == 'meta')keysdown.clear()
	keysdown.delete(key)
	if(document.activeElement != document.body && e.key != 'Escape')return
	const handlers = releases[key]
	if(!handlers)return
	e.preventDefault()
	if(e.ctrlKey || (deviceSucks && e.metaKey)){
		if(e.altKey)handlers[3](e)
		else handlers[1](e)
	}else{
		if(e.altKey)handlers[2](e)
		else handlers[0](e)
	}
}
const deviceSucks = navigator.platform.startsWith('Mac')
export function bind(key, handler){
	if(Array.isArray(key)){for(const k of key)bind(k,handler);return}
	let keyname = key.toLowerCase()
	binds[keyname] = handler
}
function attachHandler(i, key, handler, up = false){
	if(Array.isArray(key)){for(const k of key)attachHandler(i,k,handler, up);return}
	let keyname = key.toLowerCase()
	const d = up ? releases : presses
	if(!d[keyname])d[keyname] = [Function.prototype, Function.prototype, Function.prototype, Function.prototype]
	d[keyname][i] = handler
}
export const key = attachHandler.bind(undefined, 0)
export const ctrl = attachHandler.bind(undefined, 1)
export const alt = attachHandler.bind(undefined, 2)
export const ctrlalt = attachHandler.bind(undefined, 3)

window.onbeforeunload = () => location.host != '127.0.0.1' && location.host != 'localhost' ? true : undefined