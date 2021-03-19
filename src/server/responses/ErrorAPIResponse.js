import APIResponse from './APIResponse';
import mixin from '../lib/mixin';

class ErrorCommon {

	addCommonAllowHeader(options, except = ''){
		const value = options.filter(method => method.toUpperCase() !== except.toUpperCase()).reduce(
			(accString, method) => (accString ? `${accString}, ${method.toUpperCase()}` : method.toUpperCase()),
			''
		);
		this.headers.push({name: 'Allow', value});
	}

	addCommonLinks(serviceRoute){
		const links = this.common[`${serviceRoute.toLowerCase()}Links`];
		if(!this.links.includes(links)){
			this.links.push(links);
		}
	}

}
// Object.getOwnPropertyNames() was not picking this up using TC39 field declarations within the class
ErrorCommon.prototype.common = {
	authLinks: 'auth/',
	eventLinks: 'event/1',
	eventsLinks: 'events/'
};

/**
 * Responsible for creating a new ErrorAPIResponse.
 *
 * @class
 * @classdesc An ErrorAPIResponse carries data resulting from an unsuccessful successful API request.
 * @extends APIResponse
 */
export default class ErrorAPIResponse extends APIResponse {

	get(){
		const response = super.get();
		delete response.data;
		return response;
	}

}

/**
 * Responsible for creating a new F204ErrorAPIResponse.
 *
 * @class
 * @classdesc An F204ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F204ErrorAPIResponse extends ErrorAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 204;
		this.status = 'No Content';
	}

}

/**
 * Responsible for creating a new F400ErrorAPIResponse.
 *
 * @class
 * @classdesc An F400ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F400ErrorAPIResponse extends ErrorAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 400;
		this.status = 'FAIL';
	}

}

/**
 * Responsible for creating a new F401ErrorAPIResponse.
 *
 * @class
 * @classdesc An F401ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F401ErrorAPIResponse extends (mixin(ErrorCommon, ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 401;
		this.status = 'Unauthorized';
		this.headers.push({
			name: 'WWW-Authenticate',
			value: 'Basic realm="Access to secure operations", charset="UTF-8"'
		});
		if(!this.links.includes('auth/')){
			this.links.push('auth/');
		}
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new F403ErrorAPIResponse.
 *
 * @class
 * @classdesc An F403ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F403ErrorAPIResponse extends ErrorAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 403;
		this.status = 'Forbidden';
	}

}

/**
 * Responsible for creating a new TLSF403ErrorAPIResponse.
 *
 * @class
 * @classdesc A TLSF403ErrorAPIResponse carries data resulting from a forbidden API request.
 * @extends F403ErrorAPIResponse
 */
export class TLSF403ErrorAPIResponse extends F403ErrorAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.headers.push(
			{name: 'Strict-Transport-Security', value: 'max-age=0'}
		);
	}

}

/**
 * Responsible for creating a new AuthF403ErrorAPIResponse.
 *
 * @class
 * @classdesc An AuthF403ErrorAPIResponse carries data resulting from a forbidden API request.
 * @extends F403ErrorAPIResponse
 */
export class AuthF403ErrorAPIResponse extends (mixin(ErrorCommon, F403ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
		if(/NoRecordsFoundError/.test(this.message)){
			delete this.message;
		}
	}

}

/**
 * Responsible for creating a new AuthTLSF403ErrorAPIResponse.
 *
 * @class
 * @classdesc An AuthTLSF403ErrorAPIResponse carries data resulting from a forbidden API request.
 * @extends TLSF403ErrorAPIResponse
 */
export class AuthTLSF403ErrorAPIResponse extends (mixin(ErrorCommon, TLSF403ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new EventTLSF403ErrorAPIResponse.
 *
 * @class
 * @classdesc An EventTLSF403ErrorAPIResponse carries data resulting from a forbidden API request.
 * @extends TLSF403ErrorAPIResponse
 */
export class EventTLSF403ErrorAPIResponse extends (mixin(ErrorCommon, TLSF403ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new F404ErrorAPIResponse.
 *
 * @class
 * @classdesc An F404ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F404ErrorAPIResponse extends ErrorAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		const {params, serviceRoute, serviceMethod} = serviceResponse.get();
		this.code = 404;
		this.status = 'Not Found';
		this.data = null;
		const {id} = params;
		if(!/NoRecordsFoundError/.test(this.message)){
			this.message = `NoRecordsFoundError: Service route "${serviceRoute}" has no record at ${serviceRoute}/${id}.`;
		}
	}

}

/**
 * Responsible for creating a new EventF404ErrorAPIResponse.
 *
 * @class
 * @classdesc An EventF404ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class EventF404ErrorAPIResponse extends (mixin(ErrorCommon, F404ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new F405ErrorAPIResponse.
 *
 * @class
 * @classdesc An F405ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F405ErrorAPIResponse extends ErrorAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, serviceMethod} = serviceResponse.get();
		this.code = 405;
		this.status = 'Method Not Allowed';
		this.data = null;
	}

}

/**
 * Responsible for creating a new AuthF405ErrorAPIResponse.
 *
 * @class
 * @classdesc An AuthF405ErrorAPIResponse carries data resulting from a failed API request for the Auth service route.
 * @extends F405ErrorAPIResponse
 */
export class AuthF405ErrorAPIResponse extends (mixin(ErrorCommon, F405ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new EventsF405ErrorAPIResponse.
 *
 * @class
 * @classdesc An EventsF405ErrorAPIResponse carries data resulting from a failed API request for the Events service route.
 * @extends F405ErrorAPIResponse
 */
export class EventsF405ErrorAPIResponse extends (mixin(ErrorCommon, F405ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new EventF405ErrorAPIResponse.
 *
 * @class
 * @classdesc An EventF405ErrorAPIResponse carries data resulting from a failed API request for the Event service route.
 * @extends F405ErrorAPIResponse
 */
export class EventF405ErrorAPIResponse extends (mixin(ErrorCommon, F405ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new F416ErrorAPIResponse.
 *
 * @class
 * @classdesc An F416ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F416ErrorAPIResponse extends (mixin(ErrorCommon, ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 416;
		this.status = 'Range Not Satisfiable';
		this.data = null;
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
		this.headers.push(
			{name: 'Content-Range', value: 'ids */*'}
		);
	}

}

/**
 * Responsible for creating a new F422ErrorAPIResponse.
 *
 * @class
 * @classdesc An F422ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F422ErrorAPIResponse extends (mixin(ErrorCommon, ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 422;
		this.status = 'Unprocessable Entity';
		this.data = null;
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new F500ErrorAPIResponse.
 *
 * @class
 * @classdesc An F500ErrorAPIResponse carries data resulting from a failed API request.
 * @extends ErrorAPIResponse
 */
export class F500ErrorAPIResponse extends ErrorAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 500;
		this.status = 'Internal Server Error';
	}

}

/**
 * Responsible for creating a new AuthF500ErrorAPIResponse.
 *
 * @class
 * @classdesc An AuthF500ErrorAPIResponse carries data resulting from a failed API request for the Auth service route.
 * @extends F500ErrorAPIResponse
 */
export class AuthF500ErrorAPIResponse extends (mixin(ErrorCommon, F500ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new EventsF500ErrorAPIResponse.
 *
 * @class
 * @classdesc An EventsF500ErrorAPIResponse carries data resulting from a failed API request for the Events service route.
 * @extends F500ErrorAPIResponse
 */
export class EventsF500ErrorAPIResponse extends (mixin(ErrorCommon, F500ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new EventF500ErrorAPIResponse.
 *
 * @class
 * @classdesc An EventF500ErrorAPIResponse carries data resulting from a failed API request for the Event service route.
 * @extends F500ErrorAPIResponse
 */
export class EventF500ErrorAPIResponse extends (mixin(ErrorCommon, F500ErrorAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		const {serviceRoute, options} = serviceResponse.get();
		this.addCommonLinks(serviceRoute);
		this.addCommonAllowHeader(options);
	}

}