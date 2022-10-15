const dict = {}
let soundVolume = 1
function playfn(url){
	const arr = dict[url] = [new Audio(url)]
	return () => {
		let a = arr.length > 1 ? arr.pop() : arr[0].cloneNode(true)
		a.volume = soundVolume
		a.onended = () => {
			a.onended = null
			if(arr.length<3)arr.push(a)
		}
		a.play().catch(a.onended)
	}
}
export const sounds = {
	click: playfn('./img/click.mp3')
}
export default sounds

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

let currentTheme = '', current = null, musicVolume = 1
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
	if(current == (current = choose(currentTheme)))current = choose(currentTheme)
	if(current){
		current.onended = next
		current.volume = musicVolume
		current.play().catch(() => {
			//interaction required
			console.debug('Failed to play audio node: interaction required')
			onclick = () => {onclick = null; current.play()}
		})
	}
}

export function musicVol(a){
	musicVolume = a
	if(current)current.volume = musicVolume
}
export function soundVol(a){
	soundVolume = a
}