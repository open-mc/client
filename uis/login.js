import { storage } from '../js/save.js'
import { UI, Input, Label, showUI, Spacer } from '../js/ui.js'
import { serverlist } from './serverlist.js'

let inp
const loginEl = UI('',
	Label('This game is currently for testers only'),
	Label('Join our discord to get an account key').css({textDecoration: 'underline', color: '#5ae', cursor: 'pointer'}).on('click', () => open('https://discord.gg/ufaHZXtnab')),
	Spacer(10),
	inp = Input('text', 'Account key')
)
inp.on('input', async () => {
	const key = inp.value.toLowerCase()
	if(!/[a-f0-9]{32}$/y.test(key)){
		inp.style.color = key&&'#f88'
		return
	}
	inp.style.color = ''
	const [name, pub, priv, sig] = (await fetch('https://blobk.at:1024/' + key).then(a => a.text())).split('\n')
	if(!name || !pub || !priv || !sig){
		inp.style.color = 'red'
		return
	}
	storage.pubKey = pub
	storage.privKey = priv
	storage.authSig = sig
	storage.name = name
	inp.value = ''
	serverlist()
})

export const login = () => {
	inp.value = ''
	showUI(loginEl)
}