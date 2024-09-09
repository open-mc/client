import { Btn, Div, Label, Row, setDefaultUI, showUI, UI } from '../js/ui.js'
import { controlsScreen } from './controlsScreen.js'
import { optionsScreen } from './options.js'
import { serverlist } from './serverlist.js'
import texts from '../js/lang.js'
import { worldoptions } from './worldoptions.js'
import { iframe } from '../js/iframe.js'
import { creditsUI } from './credits.js'


const spage = Btn(texts.pause.server_page(), () => {
	if(ws.opts) return worldoptions(ws)
	const { protocol, host } = new URL(ws.url)
	open(protocol.replace('ws','http')+'//'+host,'_blank')
}, 'small')
const pointerDivCss = {pointerEvents: 'all', display: 'flex', flexFlow: 'column', gap: '4rem', padding: '4rem 0', width: '100%', alignItems: 'center', flex: '1 1 auto'}
const pointerDivCss2 = {pointerEvents: 'all', flex: 1}
let resumeBtn
const pauseui = UI('menu',
	Div('', Label(texts.pause.name())).css(pointerDivCss).css({justifyContent: 'flex-end'}),
	Row(Div('').css(pointerDivCss2), resumeBtn = Btn(texts.pause.resume(), () => (showUI(null), iframe.contentWindow.focus())), Div('').css(pointerDivCss2)).css({gap:0}),
	Div('',
		Row(Btn(texts.options.general(), optionsScreen, 'small'), spage),
		Row(Btn(texts.options.controls(), controlsScreen, 'small'), Btn(texts.keybinds(), null, 'small disabled')),
		Btn(texts.connection.disconnect(), serverlist),
		Div('',
			Label(texts.pause.credits()).css({height:'unset',cursor:'pointer',lineHeight:'unset'}).on('click', () => showUI(creditsUI)),
			Label(' / ').css({height:'unset',lineHeight:'unset'}),
			Label(texts.pause.changelog()).css({height:'unset',cursor:'pointer',lineHeight:'unset'}).attr('onclick', "window.open('https://github.com/open-mc/client/blob/main/CHANGELOG.md','_blank')")
		).css({position: 'absolute', bottom: '2rem', display: 'flex', right: '2rem', opacity: '0.4', fontSize: '8rem', cursor: 'pointer'})
	).css(pointerDivCss)
).css({pointerEvents: 'none', gap: 0}).on('pointerover', () => (resumeBtn.style.pointerEvents = 'all', resumeBtn.classList.remove('highlighted')))
pauseui.esc = () => showUI(null)
resumeBtn.style.pointerEvents = 'all'
resumeBtn.on('pointerover', e => (e.stopPropagation(),resumeBtn.style.pointerEvents = 'none',resumeBtn.classList.add('highlighted')))
export function pause(){
	spage.text = ws?.opts ? texts.worldoptions() : texts.pause.server_page()
	showUI(pauseui)
}
setDefaultUI(pause)