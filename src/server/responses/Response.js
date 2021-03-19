/**
 * Responsible for creating a new Response.
 *
 * @class
 * @classdesc A Response carries information from a request-actioning service to a requesting service.
 * @abstract
 */
export default class Response {

	constructor(){
		if(this.constructor === Response){
			throw new Error('Response is an abstract class and must be extended.');
		}
	}

}