import { BlockIDs, Blocks, ItemIDs, Items, Entities, EntityIDs } from "./lib/definitions.js";
import { hideUI, showUI } from "./ui/ui.js";

Object.assign(globalThis, {BlockIDs, Blocks, ItemIDs, Items, Entities, EntityIDs, showUI, hideUI})