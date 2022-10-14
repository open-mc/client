const music = {
	overworld: [
		"calm1.mp3",
		"calm2.mp3",
		"calm3.mp3",
		"hal1.mp3",
		"hal2.mp3",
		"hal3.mp3",
		"hal4.mp3",
		"nuance1.mp3",
		"nuance2.mp3",
		"piano1.mp3",
		"piano2.mp3",
		"piano3.mp3"
	]
}
for(const k in music)for(let i = music[k].length - 1; i >= 0; i--)music[k][i] = new Audio('./music/'+music[k][i])
function choose(theme){
	if(!theme)return null
	return music[theme][Math.floor(Math.random() * music[theme].length)]
}

let currentTheme = '', current = null
export function queue(theme, skip = false){
	currentTheme = theme
	if(skip && current)current.pause(), next()
	else if(!current)next()
}
function next(){
	if(current){
		current.onended = null
		current.currentTime = 0
	}
	let wait = Math.random()
	if(wait > 0.5){
		setTimeout(next, wait * 120e3) //1-2 min
		return
	}
	current = choose(currentTheme)
	if(current){
		current.onended = next
		current.play()
	}
}