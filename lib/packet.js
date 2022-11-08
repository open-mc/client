import { DataWriter } from './data.js'
const packet = (type, c) => data => {
	const d = new DataWriter()
	d.byte(c)
	d.write(type, data)
	d.pipe(ws)
}
export const PlayerData = packet({
	r: Byte,
	x: Double, y: Double,
	dx: Float, dy: Float,
	f: Float
}, 4)

export const SetBlock = packet({
	x: Int,
	y: Int,
	id: Short
}, 8)