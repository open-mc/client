// Smi Contiguous Array
export class BitField extends Array{
	set(int){
		while((int >> 5) >= this.length)this.push(0)
		this[int >> 5] |= 1 << (int & 31)
	}
	unset(int){
		let i = this.length
		if((int >> 5) >= i)return
		this[int >> 5] &= ~(1 << (int & 31))
		while(i && !this[--i])this.pop()
	}
	toggle(int){
		let i = this.length
		while((int >> 5) >= i)this.push(0)
		this[int >> 5] ^= 1 << (int & 31)
		while(i && !this[--i])this.pop()
	}
	has(int){
		if((int >> 5) >= this.length)return false
		return !!(this[int >> 5] & (1 << (int & 31)))
	}
	xor(other){
		let l = this.length
		if(l == other.length){
			while(l && this[--l] == other[l])this.pop()
		}else{
			let l2 = l; l--
			while(l2 < other.length) this.push(other[l2++])
		}
		for(let i = l; i >= 0; i--){
			this[i] ^= other[i]
		}
	}
	and(other){
		let l
		if(this.length > other.length) l = this.length = other.length
		else l = this.length
		while(l && !(this[--l] & other[l])) this.pop()
		while(l > 0)this[--l] &= other[l]
	}
	or(other){
		let l = this.length - 1, l2 = l
		while(++l2 < other.length) this.push(other[l2])
		for(let i = l; i >= 0; i--){
			this[i] |= other[i]
		}
	}
	clear(){ this.length = 0 }
}