import { BlockIDs, Blocks, ItemIDs, Items, Entities, EntityIDs } from './lib/definitions.js'
import { getblock } from './me.js'
import { pause } from './uis/pauseui.js'

Object.assign(globalThis, {BlockIDs, Blocks, ItemIDs, Items, Entities, EntityIDs, pause, getblock})