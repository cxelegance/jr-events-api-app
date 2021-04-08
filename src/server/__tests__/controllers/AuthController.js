import Controller from '../../controllers/Controller';
import AuthController from '../../controllers/AuthController';
import AuthRecord from '../../records/AuthRecord';
import ServiceFactory from '../../factories/ServiceFactory';
import {modelFactory} from '../../factories/ModelFactory';
import ServiceToAPIResponseMap from '../../maps/ServiceToAPIResponseMap';
import SuccessAPIResponse from '../../responses/SuccessAPIResponse';
import ErrorAPIResponse from '../../responses/ErrorAPIResponse';
import db from '../models/__mocks__/db';
import {authRecsValid} from '../fixtures/authRecords.js';

const freshLimit = 5 * 60 * 1000; // 5 minutes
const masterUserID = "100";
const masterHashword = 'hey testing';
let serviceFactory;
let authController;
let serviceToAPIResponseMap;

beforeEach(() => {
	serviceFactory = new ServiceFactory(modelFactory, db, freshLimit, masterUserID, masterHashword);
	serviceToAPIResponseMap = new ServiceToAPIResponseMap();
	authController = new AuthController(serviceFactory, serviceToAPIResponseMap);
});

test('AuthController is instantiated correctly', () => {
	expect(authController).toBeInstanceOf(AuthController);
	expect(authController).toBeInstanceOf(Controller);
	expect(authController.serviceRoute).toBe('Auth');
	expect(authController.serviceFactory).toBeInstanceOf(ServiceFactory);
	expect(authController.serviceToAPIResponseMap).toBeInstanceOf(ServiceToAPIResponseMap);
});

describe('AuthController: ', () => {

	test('handleRequest() basically functions', () => {
		const rec = authRecsValid.get(1);
		rec.createdAt = Date.now();

		authController.serviceFactory.db.getRangeReturns(
			[{key: 1, value: rec}]
		);

		return authController.handleRequest(
			'GET', 'http', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 403);
				expect(apiResponse.get()).toHaveProperty('status', 'Forbidden');
				expect(apiResponse.get()).toHaveProperty('message', undefined);
				return expect(apiResponse.get()).toHaveProperty('data', undefined);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() rejects with ErrorAPIResponse and 404 for bad http methods: put', () => {
		return authController.handleRequest(
			'PUT', 'https', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 405);
				expect(apiResponse.get()).toHaveProperty('status', 'Method Not Allowed');
				expect(apiResponse.get()).toHaveProperty('message', 'NoSuchMethodTypeError: Service "Auth" has no method "put".');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() rejects with ErrorAPIResponse and 404 for bad http methods: _privatemethod', () => {
		return authController.handleRequest(
			'_privatemethod', 'https', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 405);
				expect(apiResponse.get()).toHaveProperty('status', 'Method Not Allowed');
				expect(apiResponse.get()).toHaveProperty('message', 'NoSuchMethodTypeError: Service "Auth" has no method "_privatemethod".');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() rejects with ErrorAPIResponse and 404 for bad http methods: constructor', () => {
		return authController.handleRequest(
			'constructor', 'https', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 405);
				expect(apiResponse.get()).toHaveProperty('status', 'Method Not Allowed');
				expect(apiResponse.get()).toHaveProperty('message', 'NoSuchMethodTypeError: Service "Auth" has no method "constructor".');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() handles non-public methods defined on the service correctly', () => {
		return authController.handleRequest(
			'isFresh', 'http', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 405);
				expect(apiResponse.get()).toHaveProperty('status', 'Method Not Allowed');
				expect(apiResponse.get()).toHaveProperty('message', 'NoSuchMethodTypeError: Service "Auth" has no method "isfresh".');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() handles properties defined on the service correctly', () => {
		return authController.handleRequest(
			'testingOnlyPropOnTheService', 'http', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 405);
				expect(apiResponse.get()).toHaveProperty('status', 'Method Not Allowed');
				expect(apiResponse.get()).toHaveProperty('message', 'NoSuchMethodTypeError: Service "Auth" has no method "testingonlypropontheservice".');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() handles methods inherited (rather than defined on the service) correctly', () => {
		return authController.handleRequest(
			'testingOnlyMethodOnTheParentService', 'http', undefined, undefined, {serviceRoute: 'Auth'}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 405);
				expect(apiResponse.get()).toHaveProperty('status', 'Method Not Allowed');
				expect(apiResponse.get()).toHaveProperty('message', 'NoSuchMethodTypeError: Service "Auth" has no method "testingonlymethodontheparentservice".');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() handles unexpected errors: Error class', () => {
		authController.serviceToAPIResponseMap.get = function(){
			throw new ReferenceError('Man, you are out of range!');
		}
		return authController.handleRequest(
			'get', 'http', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 500);
				expect(apiResponse.get()).toHaveProperty('status', 'Internal Server Error');
				expect(apiResponse.get()).toHaveProperty('message', 'ReferenceError: Man, you are out of range!');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() handles unexpected errors: just a number', () => {
		authController.serviceToAPIResponseMap.get = function(){
			throw 1;
		}
		return authController.handleRequest(
			'get', 'http', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 500);
				expect(apiResponse.get()).toHaveProperty('status', 'Internal Server Error');
				expect(apiResponse.get()).toHaveProperty('message', '<no error name>: 1');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

	test('handleRequest() handles unexpected errors: just a string', () => {
		authController.serviceToAPIResponseMap.get = function(){
			throw 'yo';
		}
		return authController.handleRequest(
			'get', 'http', undefined, undefined, {id: 1}
		).then(
			apiResponse => {
				expect(apiResponse).toBeInstanceOf(ErrorAPIResponse);
				expect(apiResponse.get()).toHaveProperty('code', 500);
				expect(apiResponse.get()).toHaveProperty('status', 'Internal Server Error');
				expect(apiResponse.get()).toHaveProperty('message', '<no error name>: yo');
				expect(apiResponse.get().data).toBe(undefined);
				return expect(apiResponse.get().links).toBeInstanceOf(Array);
			}
		).catch(
			e => expect(e).toEqual('no errors thrown')
		);
	});

});