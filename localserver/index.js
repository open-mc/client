[
	globalThis.CONFIG,
	{version: globalThis.version}
] = await Promise.all([
	new Promise(r => addEventListener('message', ({data}) => r(data), {once: true})),
	fetch('/server/package.json').then(a=>a.json())
])
globalThis.DB = new Level(CONFIG.path)
await DB.open()