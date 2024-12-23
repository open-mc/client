export const musicdict = {__proto__: null}

function choose(theme){
	if(theme === null || !(theme in musicdict)) return null
	return musicdict[theme][Math.floor(Math.random() * musicdict[theme].length)]
}

let currentTheme = -1, last = null, currentStop = null
export function queue(theme){
	if(currentTheme == (currentTheme = theme)) return
	next()
}
function next(){
	if(currentStop){ currentStop() }
	if(Math.random() < 0.25){
		last = null
		currentStop = () => clearTimeout.bind(undefined, setTimeout(next, 60e3*(Math.random()+1)))
		return
	}
	if(last == (last = choose(currentTheme))) last = choose(currentTheme)
	if(last) currentStop = last(1, 1, 0, 0, undefined, next, true)
}