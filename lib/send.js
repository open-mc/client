import { DataWriter } from "./data.js";
export const send = () => {
	let buf = new DataWriter()
	buf.byte(4)
	buf.byte(r)
	buf.double(me.x)
	buf.double(me.y)
	buf.float(me.dx)
	buf.float(me.dy)
	buf.float(me.f)
	buf.pipe(ws)
}