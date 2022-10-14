const dict = {}
function playfn(url){
	const arr = dict[url] = [new Audio(url)]
	return async () => {
		let a = arr.length > 1 ? arr.pop() : arr[0].cloneNode(true)
		await a.play()
		if(arr.length<3)arr.push(a)
	}
}
export const sounds = {
	click: playfn('./img/click.mp3')
}
export default sounds