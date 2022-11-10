Math.fclamp = (a, b = 1) => a < 0 ? 0 : (a > b ? b : a)
Math.ifloat = x => {
	let f = Math.floor(x)
	return (f >> 0) + (x - f)
}

HTMLElement.prototype.attr = function(a, b){this.setAttribute(a, b); return this}

for(const n of [HTMLCollection, NodeList])Object.setPrototypeOf(n.prototype, Array.prototype)


//Unreasonably performant
const events = {}
export const on = (e, f) => {(events[e]||(events[e]=[])).push(f)}, fire = (e,d) => {let arr = events[e];if(arr)for(const f of arr)f(d)}