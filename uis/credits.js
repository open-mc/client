import { Btn, Div, Label, Row, showUI, UI, styleToHtml, Input, Spacer } from '../js/ui.js'
import texts from '../js/lang.js'
import { credit } from '../server/version.js'
import { pause } from './pauseui.js'

let div
export const creditsUI = UI('dirtbg',
	Spacer.grow(1),
	div = Div('').css({whiteSpace: 'pre-wrap'}),
	Div('spacing'),
	Btn(texts.misc.menu_back(), pause),
	Spacer.grow(1)
).css({overflowY: 'auto', justifyContent: 'normal', padding: '8rem'})
styleToHtml(credit, div)