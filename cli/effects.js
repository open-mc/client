export const audioSet = (name, variant, count) => Array.from({length: count}, (_, i) => Audio('/music/'+name+'/'+variant+(i+1)+'.mp3'))

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