import express from 'express';
import bunyan from 'bunyan';
import atob from 'atob';

import ConfirmAuthorizationError from './errors/ConfirmAuthorizationError';
import UnauthorizedError from './errors/UnauthorizedError';
import ReauthenticationRequiredError from './errors/ReauthenticationRequiredError';
import NoRouteFoundError from './errors/NoRouteFoundError';
import SuccessServiceResponse from './responses/SuccessServiceResponse';
import ErrorServiceResponse from './responses/ErrorServiceResponse';
import {DiscoverableF404ErrorAPIResponse} from './responses/ErrorAPIResponse';

/**
 * Responsible for creating a new HTTPServer.
 *
 * @class
 * @classdesc An HTTPServer listens for and routes incoming HTTP requests.
 *            An HTTPServer is responsible for recognizing a ConfirmAuthorizationError coming from a Service via a Controller;
 *            it is responsible for determining whether or not the requestor is authorized to make the request, and then
 *            proceeding with routing the results of the request to the requestor if authorized.
 *            An HTTPServer requires a defined AuthService route in order to determine authorization of a requestor.
 * @see ConfirmAuthorizationError
 * @see Controller
 * @see #authServiceRoute
 */
export default class HTTPServer{
	/** @type {Number} The HTTP port to listen on. */
	port;

	/** @type {Route[]} The Service Routes on offer for satisfying incoming requests. */
	routes;

	/** @type {ControllerFactory} To build a controller as needed for responding to requests. */
	controllerFactory;

	/** @type {Object} An Express application returned by Express.createApplication(). */
	app;

	/** @type {String} The HTTPServer needs to check for authorization for some requests, using this service route. */
	authServiceRoute;

	/** @type {Boolean} The HTTPServer will complain to the developer if no auth service route is registered. */
	existsAuthServiceRoute;

	/** @type {Boolean} Set to true to fake a secure environment (TLS, SSL). */
	#isFakeSecure;

	/** @type {Boolean} Set to true to fake authorized access (request is authorized). */
	#isFakeAuthorized;

	/** @type {Object} A Bunyan logger; see https://www.npmjs.com/package/bunyan. */
	log;

	/**
	 * @param {Number}            port              For setting the internal property of the same name.
	 * @param {Object[]}          routes            For setting the internal property of the same name.
	 * @param {ControllerFactory} controllerFactory For setting the internal property of the same name.
	 */
	constructor(port, routes, controllerFactory){
		this.port = port;
		this.routes = routes;
		this.controllerFactory = controllerFactory;
		this.app = express();
		this.app.use(express.json());
		this.app.enable('trust proxy');
		this.authServiceRoute = 'Auth';
		this.log = bunyan.createLogger({name: 'HTTPServer'});
		this.parseParams();
		this.parseAuthorization();
		this.registerRoutes();
	}

	/**
	 * Responsible for starting the HTTPServer listening service.
	 *
	 * @return {Promise} The promise resolves with a Node http.Server instance or rejects with an Error.
	 */
	listen(){
		return new Promise(
			(resolve, reject) => {
				try{
					const server = this.app.listen(
						this.port,
						() => {
							const result = server.address();
							if(typeof result == 'string'){
								this.log.info(`Application running: ${result}`);
							}else{
								const {address, family, port} = result;
								this.log.info(`Application running on address ${address}, family ${family}, and port: ${port}`);
							}
							resolve(server);
						}
					);
				}catch(e){
					reject(e)
				}
			}
		);
	}

	/**
	 * Responsible for responding to the HTTP Request with an expected response.
	 *
	 * @param  {Object}      response     An Express response object.
	 * @param  {APIResponse} apiResponse  The response generated by this API.
	 * @param  {String}      serviceRoute Which API service is being requested.
	 *
	 * @return void
	 */
	respondExpectedResponse(response, apiResponse, serviceRoute){
		const msg = 'respondExpectedResponse has been called';
		const {code: httpStatus, headers, serviceResponse} = apiResponse.get();
		const {error: err, msg: message, params, serviceMethod} = serviceResponse;

		this.log.trace({httpStatus, err, serviceMethod, message}, msg);
		this.log.debug({params}, msg);
		if(err) this.log.trace(err);

		response.type('json');
		response.status(httpStatus);
		response.set('URI', `/api/${serviceRoute.toLowerCase()}`);
		if(Array.isArray(headers)) headers.forEach(
			({name, value}) => response.set(`${name}`, `${value}`)
		);
		const out = apiResponse.get();
		delete out.headers;
		delete out.serviceResponse;
		response.json(out);
	}

	/**
	 * Responsible for responding to the HTTP Request with an unexpected error.
	 *
	 * @return void
	 */
	respondUnexpectedError(response, error){
		const msg = 'respondUnexpectedError has been called';
		const err = error;

		this.log.trace(err, msg);

		response.type('json');
		response.status(500);
		response.json({
			code: 500,
			status: 'Internal Server Error',
			message: error.toString()
		});
	}

	/**
	 * Responsible for parsing authorization credentials from the request headers.
	 *
	 * @return void
	 */
	parseAuthorization(){
		this.app.use(
			(req, res, next) => {
				const b64Auth = req.get('Authorization');
				if(typeof b64Auth == 'string'){
					let {user: userID, pass: plainword, authToken} = this.decipherCredentials(b64Auth);
					this.log.debug(`Authorization: user=${userID}, pass=${plainword}, authToken=${authToken}, b64Auth=${b64Auth}`);
					req.parsedParams = {
						...req.parsedParams,
						plainword,
						authToken,
						userID
					};
				}
				next();
			}
		);
	}

	/**
	 * Responsible for parsing non-auth parameters from the header; ensures there is a parsedParams property in the request.
	 *
	 * @return void
	 */
	parseParams(){
		this.app.use(
			(req, res, next) => {
				req.parsedParams = {};

				const records = req.body;
				this.log.debug({records}, 'parseParams() getting records');
				if(records || records === '' || records === 0){
					req.parsedParams = {
						...req.parsedParms,
						records
					};
				}

				const rangeMatch = ( req.get('Range') || '' ).match(/=(\d*)[-???](\d*)$/);
				if(Array.isArray(rangeMatch) && typeof rangeMatch[1] == 'string' && typeof rangeMatch[2] == 'string'){
					let end = parseInt(rangeMatch[2], 10);
					end = isNaN(end) ? undefined : end;
					req.parsedParams = {
						...req.parsedParams,
						start: parseInt(rangeMatch[1], 10),
						end
					};
				}

				const idMatch = req.originalUrl.match(/\/(?<id>\d+)\/*$/);
				if(Array.isArray(idMatch) && typeof idMatch[1] == 'string'){
					req.parsedParams = {
						...req.parsedParams,
						start: parseInt(idMatch[1], 10), // yes, let this start override the range start above
						id: parseInt(idMatch[1], 10)
					};
				}

				next();
			}
		);
	}

	/**
	 * Responsible for registering routes for incoming reqs.
	 *
	 * @return void
	 */
	registerRoutes(){
		this.routes.forEach(
			({match, serviceRoute}) => {
				this.existsAuthServiceRoute = serviceRoute === this.authServiceRoute || !!this.existsAuthServiceRoute;
				this.log.debug(`registerRoutes processes ${match}`);
				this.app.use(
					match,
					(req, res, next) => {
						let controller;
						this.log.debug(`route recognized: registerRoutes gathers details for ${match}`)
						const method = req.method;
						const isSecure = req.secure;
						const protocol = this.#isFakeSecure ? 'https' : req.protocol;
						const xfProtocol = req.get('X-Forwarded-Proto');
						const serviceVersion = req.serviceVersion;
						const params = req.params;
						const parsedParams = req.parsedParams;
						this.log.debug(`method: ${method}`);
						this.log.debug(`isSecure: ${isSecure}`);
						this.log.debug(`protocol: ${protocol}`);
						this.log.debug(`x-forwarded-protocol: ${xfProtocol}`);
						this.log.debug(`serviceRoute: ${serviceRoute}`);
						this.log.debug(`serviceVersion: ${serviceVersion}`);
						this.log.debug({params}, 'params');
						this.log.debug({parsedParams}, 'parsedParams');
						this.log.debug({together: {...params, ...parsedParams}}, 'params and parsedParams');
						new Promise(
							(resolve, reject) => {
								if(!this.existsAuthServiceRoute){
									reject(
										new Error('An auth service route has not been defined.')
									);
								}else{
									resolve();
								}
							}
						).then(
							() => {
								if(!serviceRoute){
									throw new NoRouteFoundError('Please see the links property to learn which routes are available.');
								}
							}
						).then(
							() => this.controllerFactory.get(serviceRoute, serviceVersion)
						).then(
							controllerBuilt => {
								controller = controllerBuilt;
								return controller.handleRequest(
									method, protocol, serviceVersion, {...params, ...parsedParams}
								);
							}
						).then(
							apiResponse => {
								if(apiResponse.serviceResponse.error instanceof ConfirmAuthorizationError){
									return Promise.resolve(
									).then(
										() => this.getUnauthorizedError(
											method, protocol, serviceVersion, {...params, ...parsedParams}
										)
									).then(
										unAuthorizedError => {
											if(unAuthorizedError && !this.#isFakeAuthorized){
												return apiResponse.serviceResponse.error.fail(unAuthorizedError);
											}else{
												return apiResponse.serviceResponse.error.proceed();
											}
										}
									).then(
										serviceResponse => controller.serviceToAPIResponseMap.get(serviceResponse)
									);
								}else{
									return apiResponse;
								}
							}
						).catch(
							e => {
								if(e instanceof NoRouteFoundError){
									serviceRoute = '';
									return new DiscoverableF404ErrorAPIResponse(
										new ErrorServiceResponse(
											serviceRoute, method, e, undefined, {...params, ...parsedParams}
										)
									);
								}else{
									throw e;
								}
							}
						).then(
							apiResponse => this.respondExpectedResponse(res, apiResponse, serviceRoute)
						).catch(
							e => this.respondUnexpectedError(res, e)
						);
					}
				);
			}
		);
	};

	/**
	 * Responsible for decrypting authorization credentials as found in a request.
	 * Note that this method should not throw nor otherwise reveal its parameters!
	 *
	 * @param  {String} encString The encoded credentials.
	 *
	 * @return {Object}           The decoded credentials: {user=String|undefined, pass=String|undefined, authToken=String|undefined}.
	 */
	decipherCredentials(encString){
		let clearString, base64String;
		let user, pass, authToken;
		let iFirstColon, iSpace;
		const isBasic = /^Basic\s\S/.test(encString);
		const isBearer = /^Bearer\s\S/.test(encString);
		try{
			if(!isBasic && !isBearer){
				throw new TypeError(`encString should begin with "Basic" or "Bearer", then a space, then some base64 text; encString: ${encString}`);
			}
			iSpace = encString.indexOf(' ');
			base64String = encString.slice(iSpace);
			clearString = atob(base64String); // this will throw if atob is missing and, depending on implementation, if encString isn't nice base64
			iFirstColon = clearString.indexOf(':');
			if(iFirstColon == -1) throw new TypeError(`clearString is missing colon separating username from password; clearString: ${clearString}`);
			if(isBasic) pass = clearString.slice(iFirstColon + 1);
			else authToken = clearString.slice(iFirstColon + 1);
			user = clearString.slice(0, iFirstColon);
		}catch(e){
			this.log.debug(`decipherCredentials() ${e.toString()}`);
			user = undefined;
			pass = undefined;
			authToken = undefined;
			return {user, pass, authToken};
		}
		return {user, pass, authToken};
	}

	/**
	 * Responsible for setting private property #isFakeSecure.
	 *
	 * @param {Boolean} isOn Set to TRUE to fake a secure environment (for testing).
	 *
	 * @return void
	 */
	setFakeSecure(isOn){
		this.#isFakeSecure = !!isOn;
	}

	/**
	 * Responsible for setting private property #isFakeAuthorized.
	 *
	 * @param {Boolean} isOn Set to TRUE to fake authorization for a request (for testing).
	 *
	 * @return void
	 */
	setFakeAuthorized(isOn){
		this.#isFakeAuthorized = !!isOn;
	}

	/**
	 * Responsible for consulting with an authority and, if applicable, returning with an UnauthorizedError
	 * for a request.
	 *
	 * @param  {String} method         The service method in the request; to be implemented.
	 * @param  {String} protocol       The HTTP protocol for the request.
	 * @param  {String} serviceVersion The service version string provided in the request.
	 * @param  {Object} params         The params sent in the request.
	 *
	 * @return {Promise} The promise resolves with UnauthorizedError (or child class) or void; it does not reject and consumption should have a catch block after it.
	 */
	getUnauthorizedError(method, protocol, serviceVersion, params){
		this.log.debug({method, protocol, serviceVersion, params}, 'getUnauthorizedError() called');
		return Promise.resolve(
		).then(
			() => this.controllerFactory.get(this.authServiceRoute, serviceVersion)
		).then(
			authController => authController.handleRequest(
				'get', protocol, serviceVersion, params
			)
		).then(
			({serviceResponse}) => {
				if(serviceResponse instanceof SuccessServiceResponse){
					return;
				}else{
					const {error} = serviceResponse;
					this.log.debug({errorString: error.toString()}, 'serviceResponse is not instanceof SuccessServiceResponse');
					if(error instanceof UnauthorizedError) return error;
					if(error instanceof ReauthenticationRequiredError) return error;
					else return new UnauthorizedError('Recommend authenticating first.');
				}
			}
		);
	}

}