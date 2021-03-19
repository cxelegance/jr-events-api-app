import APIResponse from './APIResponse';
import mixin from '../lib/mixin';

class SuccessCommon {

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
SuccessCommon.prototype.common = {
	authLinks: 'auth/',
	eventLinks: 'event/1',
	eventsLinks: 'events/'
};

/**
 * Responsible for creating a new SuccessAPIResponse.
 *
 * @class
 * @classdesc A SuccessAPIResponse carries data resulting from a successful API request.
 * @extends APIResponse
 */
export default class SuccessAPIResponse extends APIResponse {

	get(){
		const response = super.get();
		delete response.message;
		if(!response.data) response.data = [];
		return response;
	}

}

/**
 * Responsible for creating a new S200SuccessAPIResponse.
 *
 * @class
 * @classdesc A S200SuccessAPIResponse carries data resulting from a successful API request.
 * @extends SuccessAPIResponse
 */
export class S200SuccessAPIResponse extends (mixin(SuccessCommon, SuccessAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 200;
		this.status = 'OK';
		const {options} = serviceResponse.get();
		this.addCommonAllowHeader(options, 'post');
	}

}

/**
 * Responsible for creating a new EventsS200SuccessAPIResponse.
 *
 * @class
 * @classdesc An EventsS200SuccessAPIResponse carries data resulting from a successful API request.
 * @extends S200SuccessAPIResponse
 */
export class EventsS200SuccessAPIResponse extends S200SuccessAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.headers.push(
			{name: 'Allow', value: 'GET'}
		);
		if(!this.links.includes(`event/1`)){
			this.links.push(`event/1`);
		}
	}

}

/**
 * Responsible for creating a new S201SuccessAPIResponse.
 *
 * @class
 * @classdesc A S201SuccessAPIResponse carries data resulting from a successful API request.
 * @extends SuccessAPIResponse
 */
export class S201SuccessAPIResponse extends (mixin(SuccessCommon, SuccessAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 201;
		this.status = 'Created';
		const {serviceRoute, data, options} = serviceResponse.get();
		this.addCommonAllowHeader(options, 'post');
		this.addCommonLinks(serviceRoute);
		if(!this.links.includes(`${serviceRoute.toLowerCase()}/${data}`)){
			this.links.push(`${serviceRoute.toLowerCase()}/${data}`);
		}
		this.headers.push(
			{name: 'Location', value: `${serviceRoute.toLowerCase()}/${data}`}
		);
	}

}

/**
 * Responsible for creating a new AuthS201SuccessAPIResponse.
 *
 * @class
 * @classdesc A AuthS201SuccessAPIResponse carries data resulting from a successful API request.
 * @extends SuccessAPIResponse
 */
export class AuthS201SuccessAPIResponse extends S201SuccessAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.headers.push(
			{name: 'Allow', value: 'POST'},
			{name: 'Location', value: `auth/${this.data.id}`}
		);
		if(!this.links.includes(`auth/${this.data.token}`)){
			this.links.push(`auth/${this.data.token}`);
		}
		if(!this.links.includes(`auth/${this.data.id}`)){
			this.links.push(`auth/${this.data.id}`);
		}
	}

}

/**
 * Responsible for creating a new S204SuccessAPIResponse.
 *
 * @class
 * @classdesc A S204SuccessAPIResponse carries data resulting from a successful API request.
 * @extends SuccessAPIResponse
 */
export class S204SuccessAPIResponse extends (mixin(SuccessCommon, SuccessAPIResponse)) {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 204;
		this.status = 'No Content';
		const {options} = serviceResponse.get();
		this.addCommonAllowHeader(options);
	}

}

/**
 * Responsible for creating a new S206SuccessAPIResponse.
 *
 * @class
 * @classdesc A S206SuccessAPIResponse carries data resulting from a successful API request.
 * @extends SuccessAPIResponse
 */
export class S206SuccessAPIResponse extends SuccessAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.code = 206;
		this.status = 'Partial Content';
		let {start, end} = serviceResponse.get().params;
		if(!start) start = '1';
		if(!end) end = '';
		this.headers.push(
			{name: 'Content-Range', value: `ids ${start}-${end}/*`}
		);
		if(!this.links.includes(`event/${start}`)){
			this.links.push(`event/${start}`);
		}
		if(end && start !== end && !this.links.includes(`event/${end}`)){
			this.links.push(`event/${end}`);
		}
	}

}

/**
 * Responsible for creating a new EventsS206SuccessAPIResponse.
 *
 * @class
 * @classdesc An EventsS206SuccessAPIResponse carries data resulting from a successful API request.
 * @extends S206SuccessAPIResponse
 */
export class EventsS206SuccessAPIResponse extends S206SuccessAPIResponse {

	constructor(serviceResponse){
		super(serviceResponse);
		this.headers.push(
			{name: 'Allow', value: 'GET'}
		);
	}

}

/**
 * Responsible for differentiating between and creating either an EventsS200SuccessAPIResponse or an EventsS206SuccessAPIResponse.
 *
 * @class
 * @classdesc EventsS200Or206SuccessAPIResponse looks at the ServiceResponse and decides which class to return an instance of.
 * @see EventsS200SuccessAPIResponse
 * @see EventsS206SuccessAPIResponse
 * @extends SuccessAPIResponse
 */
export class EventsS200Or206SuccessAPIResponse extends SuccessAPIResponse {

	constructor(serviceResponse){
		const {start, end} = serviceResponse.get().params;
		if(start || end) return new EventsS206SuccessAPIResponse(serviceResponse);
		else return new EventsS200SuccessAPIResponse(serviceResponse);
	}

}