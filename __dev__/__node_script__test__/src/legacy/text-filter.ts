const text = `tripledeposit_img_title
  tripledeposit_img_light
tripledeposit_img_money1~3   
tripledeposit_img_done
tripledeposit_img_lock
tripledeposit_img_bonus1~6
tripledeposit_img_time
tripledeposit_img_bonus_bg
tripledeposit_img_bg`

const text2 = `
tripledeposit_img_lock
tripledeposit_img_bonus01~03
tripledeposit_img_time`

const text3 = `account_img_banner_bonus、account_img_banner_bonus_bg_pc02、account_img_banner_bonus_bg
account_img_banner_bonus_pc02、account_img_banner_bonus_pc、bonus_img_money、account_btn_go`

const text4 = `account_img_banner_bonus、account_img_banner_bonus_bg_pc02-4
、account_img_banner_bonus_bg
account_img_banner_bonus_pc02、
    ,account_img_banner_bonus_pc、bonus_img_money、account_btn_go`

filterText(text)
console.log('-------------')
filterText(text2)
console.log('-------------')
filterText(text3)
console.log('-------------')
filterText(text4)
function filterText(text: string) {
	const texts = text.split(/[\s\n、，,]+/)
	const wordList: string[] = []

	texts.forEach(e => {
		const word = e.trim()
		if (!word.length) return

		const [, name, from, to] = word.match(/^(.+[^0])(\d+)[\-~](\d+)$/) || []
		if (name) {
			const nFrom = Number(from)
			const nTo = Number(to)
			console.log(name, from, to, nFrom, nTo)
			for (let i = nFrom; i <= nTo; i++) {
				wordList.push(`${name}${String(i).padStart(from.length, '0')}`)
			}
		} else {
			wordList.push(word)
		}
	})

	console.log(texts)
	console.log(wordList)
}
