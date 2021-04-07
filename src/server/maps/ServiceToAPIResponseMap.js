import ServiceResponse from '../responses/ServiceResponse';
import {
	S200SuccessAPIResponse,
	S201SuccessAPIResponse,
	AuthS201SuccessAPIResponse,
	S204SuccessAPIResponse,
	EventsS200Or206SuccessAPIResponse,
} from '../responses/SuccessAPIResponse';
import {
	F204ErrorAPIResponse,
	F400ErrorAPIResponse,
	F401ErrorAPIResponse,
	AuthF403ErrorAPIResponse,
	AuthTLSF403ErrorAPIResponse,
	EventTLSF403ErrorAPIResponse,
	EventF404ErrorAPIResponse,
	AuthF405ErrorAPIResponse,
	EventsF405ErrorAPIResponse,
	EventF405ErrorAPIResponse,
	F416ErrorAPIResponse,
	F422ErrorAPIResponse,
	AuthF500ErrorAPIResponse,
	EventF500ErrorAPIResponse,
	EventsF500ErrorAPIResponse
} from '../responses/ErrorAPIResponse';

/**
 * Responsible for creating a new ServiceToAPIResponseMap.
 *
 * @class
 * @classdesc A map for mapping ServiceResponse instances to APIResponse instances.
 * @see APIResponse
 * @see ServiceResponse
 * @see Service
 * @example myAPIResponse = serviceToAPIResponseMap.get(myServiceResponse)
 * @extends Map
 */
export default class ServiceToAPIResponseMap extends Map{

	constructor(){
		super();

		/*
		 * set( formKey(
		 *         <serviceRoute>, or '*' for any serviceRoute combined with the following methodName and errorClassName,
		 *         <methodName, or '*' for any method combined with the following errorClassName
		 *         <errorClassName>, or '*' for any error, or undefined for any success (i.e., no error)
		 *      )
		 * )
		 * NOTE: there are no catch-alls. If a key is missed here, then it will go out as
		 *       new Error(`ServiceToAPIResponseMap is missing key: ${key}.`)
		 */

		/*
		 * We route any NoSuchMethodTypeError coming from the service to the correct response.
		 */
		this.set(this.formKey( 'Auth', '*', 'NoSuchMethodTypeError' ), AuthF405ErrorAPIResponse);
		this.set(this.formKey( 'Event', '*', 'NoSuchMethodTypeError' ), EventF405ErrorAPIResponse);
		this.set(this.formKey( 'Events', '*', 'NoSuchMethodTypeError' ), EventsF405ErrorAPIResponse);

		/*
		 * We route any OPTIONS responses coming from the service to the correct response.
		 */
		this.set(this.formKey( '*', 'options' ), S204SuccessAPIResponse);

		/*
		 * We route all RecordTypeError/SchemaValidationTypeError to one 422 response, which is capable of determining serviceRoute internally.
		 */
		this.set(this.formKey( '*', '*', 'RecordTypeError' ), F422ErrorAPIResponse);
		this.set(this.formKey( '*', '*', 'SchemaValidationTypeError' ), F422ErrorAPIResponse);

		/*
		 * Special handling for ConfirmAuthorizationError: which should not go out to the consumer.
		 */
		this.set(this.formKey( '*', '*', 'ConfirmAuthorizationError' ), F401ErrorAPIResponse);

		/*
		 * Route all requirements for authentication to one 401 response, which is capable of determining serviceRoute internally.
		 */
		this.set(this.formKey( '*', '*', 'UnauthorizedError' ), F401ErrorAPIResponse);
		this.set(this.formKey( '*', '*', 'AuthenticationFailedError' ), F401ErrorAPIResponse);
		this.set(this.formKey( '*', '*', 'ReauthenticationRequiredError' ), F401ErrorAPIResponse);

		/*
		 * Range Not Satisfiable
		 */
		this.set(this.formKey( '*', '*', 'BadRangeError' ), F416ErrorAPIResponse);

		/*
		 * Auth Service
		 */
		this.set(this.formKey( 'Auth', 'get' ), AuthF403ErrorAPIResponse);

		this.set(this.formKey( 'Auth', '*', 'Error' ), AuthF500ErrorAPIResponse);
		this.set(this.formKey( 'Auth', '*', 'TypeError' ), AuthF500ErrorAPIResponse);
		this.set(this.formKey( 'Auth', '*', 'ReferenceError' ), AuthF500ErrorAPIResponse);
		this.set(this.formKey( 'Auth', '*', 'AggregateError' ), AuthF500ErrorAPIResponse);
		this.set(this.formKey( 'Auth', '*', 'SyntaxError' ), AuthF500ErrorAPIResponse);
		this.set(this.formKey( 'Auth', '*', 'RangeError' ), AuthF500ErrorAPIResponse);

		this.set(this.formKey( 'Auth', 'get', '*' ), AuthF403ErrorAPIResponse);
		this.set(this.formKey( 'Auth', 'delete' ), AuthF403ErrorAPIResponse);
		this.set(this.formKey( 'Auth', 'delete', '*' ), AuthF403ErrorAPIResponse);
		this.set(this.formKey( 'Auth', 'post' ), AuthS201SuccessAPIResponse);
		this.set(this.formKey( 'Auth', 'post', 'RecordExistsError' ), F204ErrorAPIResponse);
		this.set(this.formKey( 'Auth', 'post', 'InsecureOperationError' ), AuthTLSF403ErrorAPIResponse);
		this.set(this.formKey( 'Auth', 'post', 'CryptographyError' ), AuthF500ErrorAPIResponse);
		this.set(this.formKey( 'Auth', 'post', 'ParameterTypeError' ), F400ErrorAPIResponse);

		/*
		 * Events Service
		 */
		this.set(this.formKey( 'Events', 'get' ), EventsS200Or206SuccessAPIResponse);

		this.set(this.formKey( 'Events', '*', 'Error'), EventsF500ErrorAPIResponse);
		this.set(this.formKey( 'Events', '*', 'TypeError'), EventsF500ErrorAPIResponse);
		this.set(this.formKey( 'Events', '*', 'ReferenceError'), EventsF500ErrorAPIResponse);
		this.set(this.formKey( 'Events', '*', 'AggregateError'), EventsF500ErrorAPIResponse);
		this.set(this.formKey( 'Events', '*', 'SyntaxError'), EventsF500ErrorAPIResponse);
		this.set(this.formKey( 'Events', '*', 'RangeError'), EventsF500ErrorAPIResponse);

		this.set(this.formKey( 'Events', 'get', 'NoRecordsFoundError' ), EventsS200Or206SuccessAPIResponse);

		/*
		 * Event Service
		 */
		this.set(this.formKey( 'Event', 'get' ), S200SuccessAPIResponse);
		this.set(this.formKey( 'Event', 'put' ), S200SuccessAPIResponse);
		this.set(this.formKey( 'Event', 'post' ), S201SuccessAPIResponse);
		this.set(this.formKey( 'Event', 'delete' ), S204SuccessAPIResponse);

		this.set(this.formKey( 'Event', '*', 'Error'), EventF500ErrorAPIResponse);
		this.set(this.formKey( 'Event', '*', 'TypeError'), EventF500ErrorAPIResponse);
		this.set(this.formKey( 'Event', '*', 'ReferenceError'), EventF500ErrorAPIResponse);
		this.set(this.formKey( 'Event', '*', 'AggregateError'), EventF500ErrorAPIResponse);
		this.set(this.formKey( 'Event', '*', 'SyntaxError'), EventF500ErrorAPIResponse);
		this.set(this.formKey( 'Event', '*', 'RangeError'), EventF500ErrorAPIResponse);

		this.set(this.formKey( 'Event', 'get',   'NoRecordsFoundError'), EventF404ErrorAPIResponse);
		this.set(this.formKey( 'Event', 'put',   'NoRecordsFoundError'), EventF404ErrorAPIResponse);
		this.set(this.formKey( 'Event', 'delete','NoRecordsFoundError' ), EventF404ErrorAPIResponse);
		this.set(this.formKey( 'Event', 'post',  'RecordExistsError'), EventF500ErrorAPIResponse);
		this.set(this.formKey( 'Event', 'post',  'BadParameterError'), EventF405ErrorAPIResponse);
		this.set(this.formKey( 'Event', '*',     'InsecureOperationError' ), EventTLSF403ErrorAPIResponse);

	}

	/**
	 * Responsible for getting a mapped APIResponse from a ServiceResponse.
	 *
	 * @param  {ServiceResponse} serviceResponse The response received from a service during a request.
	 *
	 * @return {Promise} The promise resolves to an APIResponse; it rejects TypeError and Error.
	 */
	get(serviceResponse){
		let message, data;

		return new Promise(
			(resolve, reject) => {
				let key, serviceRoute, serviceMethod, message, data, error;

				if(serviceResponse instanceof ServiceResponse){
					({serviceRoute, serviceMethod, error} = serviceResponse.get());
				}else{
					reject(new TypeError('expected a ServiceResponse as the parameter.'));
					return;
				}

				if(
					this.has(key = this.formKey('*', '*', '*')) ||
					this.has(key = this.formKey('*', '*', error && error.name)) ||
					this.has(key = this.formKey('*', serviceMethod, '*')) ||
					this.has(key = this.formKey('*', serviceMethod, error && error.name)) ||
					this.has(key = this.formKey(serviceRoute, '*', '*')) ||
					this.has(key = this.formKey(serviceRoute, serviceMethod, '*')) ||
					this.has(key = this.formKey(serviceRoute, '*', error && error.name)) ||
					this.has(key = this.formKey(serviceRoute, serviceMethod, '*'))
				){
					resolve([super.get(key), serviceResponse]);
					return;
				}else{
					if(!this.has(key = this.formKey(serviceRoute, serviceMethod, error && error.name))){
						reject(new Error(`ServiceToAPIResponseMap is missing key: ${key}.`));
					}else{
						resolve([super.get(key), serviceResponse]);
					}
				}
			}
		).then(
			([classOfAPIResponse, serviceResponse]) => new classOfAPIResponse(serviceResponse)
		);
	}

	/**
	 * Responsible for forming a key for this map.
	 *
	 * @param  {String} serviceRoute          E.g. Auth, Event, Events, etc.
	 * @param  {String} serviceMethod         E.g. put, get, delete, post, etc.
	 * @param  {String} [errorName=undefined] E.g. TypeError, NoSuchMethodTypeError, etc.
	 *
	 * @return {String}
	 */
	formKey(serviceRoute, serviceMethod, errorName = undefined){
		return `${serviceRoute}:${serviceMethod}:${errorName}`;
	}

}