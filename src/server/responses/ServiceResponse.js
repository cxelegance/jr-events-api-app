import Response from './Response';

/**
 * Responsible for creating a new ServiceResponse.
 *
 * @class
 * @classdesc A ServiceResponse carries data resulting from a service request.
 * @abstract
 * @extends Response
 */
export default class ServiceResponse extends Response{

	/** @type {Error} An Error when the service request fails. */
	error;

	/** @type {*} Data when the service request succeeds. */
	data;

	/** @type {Object} Original params sent along with the service request, minus any sensitive credentials. */
	params;

	/** @type {String} The service route/type that was asked to satisfy the service request. */
	serviceRoute;

	/** @type {String} The service method that was called to satisfy the service request. */
	serviceMethod;

	/** @type {String[]} All service methods available to be called. */
	options;

	/**
	 * @param {String}   serviceRoute       For setting the internal property of the same name.
	 * @param {String}   serviceMethod      For setting the internal property of the same name.
	 * @param {Error}    [error=undefined]  For setting the internal property of the same name.
	 * @param {*}        [data=undefined]   For setting the internal property of the same name.
	 * @param {Object}   [params={}]        For setting the internal property of the same name.
	 * @param {String[]} [options=[]]       For setting the internal property of the same name.
	 */
	constructor(serviceRoute, serviceMethod, error = undefined, data = undefined, params = {}, options = []){
		super();
		if(this.constructor === ServiceResponse){
			throw new Error('ServiceResponse is an abstract class and must be extended.');
		}
		this.serviceRoute = serviceRoute;
		this.serviceMethod = serviceMethod;
		this.error = error;
		this.data = data;
		this.params = params;
		this.options = options;
	}

	/**
	 * Responsible for getting all internal properties, plus a message built from the error.
	 *
	 * @return {Object} {serviceRoute, serviceMethod, error, data, params, message, options}
	 */
	get(){
		const serviceRoute = this.serviceRoute;
		const serviceMethod = this.serviceMethod;
		const error = this.error;
		const data = this.data;
		const params = this.params;
		const message = error && `${error.toString()}`;
		const options = this.options;
		return {serviceRoute, serviceMethod, error, data, params, message, options};
	}
}