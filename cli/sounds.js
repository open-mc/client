const blockaudioset = (name) => {
	const placeArr = [1,2,3,4,5,6].map(a=>Audio('/music/'+name+'/place'+a+'.mp3'))
	const stepArr = [1,2,3,4,5,6].map(a=>Audio('/music/'+name+'/step'+a+'.mp3'))
	return {
		place(){placeArr[Math.floor(Math.random() * 6)](1, 0.8)},
		break(){placeArr[Math.floor(Math.random() * 6)](1, 0.8)},
		punch(){stepArr[Math.floor(Math.random() * 6)](0.1375, 0.5)},
		walk(){stepArr[Math.floor(Math.random() * 6)](0.15, 1)},
		fall(){stepArr[Math.floor(Math.random() * 6)](0.5, 0.75)}
	}
}

export const netherrack = blockaudioset('netherrack')

music('overworld',
	"/music/calm1.mp3",
	"/music/calm2.mp3",
	"/music/calm3.mp3",
	"/music/hal1.mp3",
	"/music/hal2.mp3",
	"/music/hal3.mp3",
	"/music/hal4.mp3",
	"/music/nuance1.mp3",
	"/music/nuance2.mp3",
	"/music/piano1.mp3",
	"/music/piano2.mp3",
	"/music/piano3.mp3"
)
music('nether',
	'/music/nether1.mp3',
	'/music/nether2.mp3',
	'/music/nether3.mp3',
	'/music/nether4.mp3'
)