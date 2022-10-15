import { BlockIDs, Blocks, ItemIDs, Items, Entities, EntityIDs } from "./lib/definitions.js";
import { hideUI, showUI } from "./ui/ui.js";
import { pause } from "./uis/pauseui.js";

Object.assign(globalThis, {BlockIDs, Blocks, ItemIDs, Items, Entities, EntityIDs, pause, hideUI})