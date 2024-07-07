export const defaultConfig = () => ({
	name: "New world",
	icon: "/img/end_portal.png",
	banner: '',
	motd: [ "Singleplayer world" ],
	world: {
		seed: Math.floor(Math.random()*4294967296),
		nether_scale: 16,
		chunk_loading_range: 2
	},
	components: [ "/vanilla/index.js" ],
	generators: {
		overworld: "default",
		nether: "default",
		end: "default",
		void: "void"
	},
	permissions: {
		suicide: true,
		chat: true,
		green_text: true,
		mod_cheat: true,
		max_fill: 16777216,
		default: 2,
		join_as_spectator: false
	},
	proximity_chat: 32,
	magic_word: "hi",
	socket: {
		movement_checks: true,
		movement_check_mercy: 10,
	}
})