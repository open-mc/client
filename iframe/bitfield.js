// Smi Contiguous Array
export class BitField extends Array{
	static parse(a){
		if(!Array.isArray(a)) return new BitField 
		return Object.setPrototypeOf(a, BitField.prototype)
	}
	static copyFrom(a){
		const b = new BitField
		if(Array.isArray(a))
			b.push(...a)
		return b
	}
	of(...n){
		const b = new BitField
		for(const i of n) b.set(i)
		return b
	}
	set(pos){
		while((pos >> 5) >= this.length) super.push(0)
		this[pos >> 5] |= 1 << (pos & 31)
	}
	unset(pos){
		let i = this.length
		if((pos >> 5) >= i)return
		this[pos >> 5] &= ~(1 << (pos & 31))
		while(i && !this[--i]) super.pop()
	}
	toggle(pos){
		let i = this.length
		while((pos >> 5) >= i) super.push(0)
		this[pos >> 5] ^= 1 << (pos & 31)
		while(i && !this[--i]) super.pop()
	}
	has(pos){
		if((pos >> 5) >= this.length)return false
		return !!(this[pos >> 5] & (1 << (pos & 31)))
	}
	pop(pos){
		if((pos >> 5) >= this.length)return false
		let i = pos >> 5
		const a = !!(this[i] ^ (this[i] &= ~(1 << (pos & 31))))
		if(i == this.length - 1) while(i >= 0 && !this[i--]) super.pop()
		return a
	}
	put(pos){
		let i = pos >> 5
		while(i >= this.length) super.push(0)
		return !!(this[i] ^ (this[i] |= 1 << (pos & 31)))
	}
	xor(other){
		let l = this.length
		if(l == other.length){
			while(l && this[--l] == other[l]) super.pop()
		}else{
			let l2 = l; l--
			while(l2 < other.length) super.push(other[l2++])
		}
		for(let i = l; i >= 0; i--) this[i] ^= other[i]
	}
	and(other){
		let l = this.length
		if(this.length > other.length) l = this.length = other.length
		while(l && !(this[--l] & other[l])) super.pop()
		while(l > 0) this[--l] &= other[l]
	}
	or(other){
		let l = this.length - 1, l2 = l
		while(++l2 < other.length) super.push(other[l2])
		for(let i = l; i >= 0; i--) this[i] |= other[i]
	}
	firstUnset(){
		let i = -1
		while(++i < this.length){
			const a = ~this[i]
			if(a) return i<<5|31-Math.clz32(a&-a)
		}
		return i<<5
	}
	firstSet(){
		let i = -1
		while(++i < this.length)
			if(this[i]) return i<<5|31-Math.clz32(this[i]&-this[i])
		return -1
	}
	lastSet(){
		let i = this.length
		while(--i >= 0)
			if(this[i]) return i<<5|31-Math.clz32(this[i])
		return -1
	}
	popFirst(){
		let i = -1
		while(++i < this.length)
			if(this[i]){
				let s = 31-Math.clz32(this[i]&-this[i])
				this[i] &= ~(1 << s)
				s = i<<5|s
				i = this.length
				while(i && !this[--i]) super.pop()
				return s
			}
		return -1
	}
	popLast(){
		let i = this.length
		while(--i >= 0)
			if(this[i]){
				let s = 31-Math.clz32(this[i])
				this[i] &= ~(1 << s)
				s = i<<5|s
				i = this.length
				while(i && !this[--i]) super.pop()
				return s
			}
		return -1
	}
	clear(){ this.length = 0 }
}
export default BitField