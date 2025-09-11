export const storage = globalThis.localStorage
Object.defineProperty(globalThis, 'localStorage', {get(){return sessionStorage}})

export const options = {}
const defaults = {
	guiScale: 1,
	zoom: 0.625,
	supersample: .5,
	sound: 0.5,
	music: 0.3,
	sensitivity: 0.5,
	controllerSensitivity: 0.5,
	camera: 0,
	fsc: 0,
	speed: 1,
	click: false,
	ffx: 1,
	autof3: 1,
	notifs: 1,
	maxParticles: 1000,
	joy: 0,
	lang: '',
	fps: 0,
	gamma: .5,
}
const optionListeners = {}
for(const k in defaults){
	let v = defaults[k], sto = storage[k]
	if(typeof v == 'string' && sto !== undefined) v = sto
	else if(typeof v == 'number' && sto !== undefined) v = +sto
	else if(typeof v == 'boolean' && sto !== undefined) v = sto == 'true'
	Object.defineProperty(options, k, {enumerable:true, get: () => v, set(a){
		storage[k] = v = a
		if(optionListeners[k]) for(const f of optionListeners[k]) f(k,a)
	}})
}

export function reset(){
	for(const k in defaults){ options[k] = defaults[k] }
}

export function listen(...keys){
	const cb = keys.pop()
	if(!keys.length)
		for(const key in defaults)
			(optionListeners[key] || (optionListeners[key] = [])).push(cb), cb(key, options[key])
	else for(const key of keys)
		(optionListeners[key] || (optionListeners[key] = [])).push(cb), cb(key, options[key])
}