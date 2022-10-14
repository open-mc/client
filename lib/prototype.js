Math.fclamp = (a, b = 1) => a < 0 ? 0 : (a > b ? b : a)
Math.ifloat = x => {
	let f = Math.floor(x)
	return (f >> 0) + (x - f)
}