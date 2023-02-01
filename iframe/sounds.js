const dict = {}
let soundVolume = 1
function playfn(url){
	const arr = dict[url] = [Audio(url)]
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
	click: Audio('/img/click.mp3')
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
for(const k in music)for(let i = music[k].length - 1; i >= 0; i--)music[k][i] = Audio('/music/'+music[k][i], true)
function choose(theme){
	if(!theme)return null
	return music[theme][Math.floor(Math.random() * music[theme].length)]
}

let currentTheme = '', current = null, currentStop = null
export function queue(theme, skip = false){
	currentTheme = theme
	if(skip && current)currentStop(), next()
	else if(!current)next()
}
function next(){
	if(current){ currentStop() }
	if(Math.random() > 0.99){
		setTimeout(next, 120e3) //1 min
		return
	}
	//try choosing twice
	if(current == (current = choose(currentTheme)))current = choose(currentTheme)
	if(current) currentStop = current(0, undefined, next)
}