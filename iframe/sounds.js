export const musicdict = {}

function choose(theme){
	if(!theme || !(theme in musicdict)) return null
	return musicdict[theme][Math.floor(Math.random() * musicdict[theme].length)]
}

let currentTheme = '', current = null, currentStop = null
export function queue(theme){
	if(currentTheme == (currentTheme = theme)) return
	next()
}
function next(){
	if(current){ currentStop() }
	if(Math.random() > 0.75){
		setTimeout(next, 120e3) //1 min
		return
	}
	//try choosing twice
	if(current == (current = choose(currentTheme)))current = choose(currentTheme)
	if(current) currentStop = current(1, 1, 0, 0, undefined, next)
}