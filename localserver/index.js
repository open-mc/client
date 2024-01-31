globalThis.CONFIG = await new Promise(r => addEventListener('message', ({data}) => r(data), {once: true})),
globalThis.DB = new Level(CONFIG.path)
await DB.open()