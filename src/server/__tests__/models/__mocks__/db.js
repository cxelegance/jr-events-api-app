class db {
	get(id){}

	remove(id){}

	put(id, record){}

	getRange({start, end}){}

	// meddle with the above methods using methods below:

	getReturns(val){
		this.get = id => val;
	}

	putResolves(val){
		this.put = (id, record) => new Promise(
			(resolve, reject) => resolve(val)
		);
	}

	putRejects(val){
		this.put = (id, record) => new Promise(
			(resolve, reject) => reject(val)
		);
	}

	getRangeReturns(val){
		this.getRange = ({start, end}) => val;
	}

	getRangeThrows(error){
		this.getRange = ({start, end}) => {throw error;}
	}

	removeResolves(val){
		this.remove = id => new Promise(
			(resolve, reject) => resolve(val)
		);
	}

	removeRejects(val){
		this.remove = id => new Promise(
			(resolve, reject) => reject(val)
		);
	}

}

export default new db();