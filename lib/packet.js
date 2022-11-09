import { DataWriter } from './data.js'
const packet = (type, c) => data => {
	const d = new DataWriter()
	d.byte(c)
	d.write(type, data)
	d.pipe(ws)
}

export const SetBlock = packet({
	x: Int,
	y: Int,
	id: Short
}, 8)