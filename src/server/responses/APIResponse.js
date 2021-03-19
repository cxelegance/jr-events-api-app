import Response from './Response';

/**
 * Responsible for creating a new APIResponse.
 *
 * @class
 * @classdesc An APIResponse carries data resulting from an API request.
 * @abstract
 * @extends Response
 */
export default class APIResponse extends Response {

	/** @type {Number} An HTTP status code. */
	code;

	/** @type {String} An HTTP status string. */
	status;

	/** @type {String} A message, in the case of an error. */
	message;

	/** @type {*} The requested data, in the case of a successful request. */
	data;

	/** @type {Object[]} Optional links to assist the consumer. */
	links;

	/** @type {Object[]} Optional headers to include in an API response: {prop, val} */
	headers;

	/** @type {ServiceResponse} The original ServiceResponse that the APIResponse is created from. */
	serviceResponse;

	/**
	 * @param {ServiceResponse} serviceResponse For setting the internal property of the same name.
	 */
	constructor(serviceResponse){
		super();
		if(this.constructor === APIResponse){
			throw new Error('APIResponse is an abstract class and must be extended.');
		}
		this.serviceResponse = serviceResponse;
		const {message, data} = this.serviceResponse.get();
		this.message = message;
		this.data = data;
		this.links = [];
		this.headers = [];
	}

	/**
	 * Responsible for getting all internal properties.
	 *
	 * @throws Error
	 *
	 * @return {Object} {code, status, message, data, links}
	 */
	get(){
		if(!this.code) throw new Error('code should be set in inheriting class.');
		if(!this.status) throw new Error('status should be set in inheriting class.');
		const code = this.code;
		const status = this.status;
		const message = this.message;
		const data = this.data;
		const links = this.links;
		const headers = this.headers;
		const serviceResponse = this.serviceResponse;
		return {code, status, message, data, links, headers, serviceResponse};
	}
}