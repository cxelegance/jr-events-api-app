import fetch from 'node-fetch';
import frisby from 'frisby';
const Joi = frisby.Joi;

// jest.setTimeout(5000);

frisby.globalSetup({
	request: {
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
			'Accept': 'application/json'
		}
	}
});

import HTTPServer from '../HTTPServer';
import {modelFactory} from '../factories/ModelFactory';
import ServiceFactory from '../factories/ServiceFactory';
import ControllerFactory from '../factories/ControllerFactory';
import ServiceToAPIResponseMap from '../maps/ServiceToAPIResponseMap';
import db from './models/__mocks__/db';
import {authRecsValid} from './fixtures/authRecords';
import {eventRecsValid} from './fixtures/eventRecords';
import {Server} from 'http';
import {saltAndHash} from '../lib/Hashword';
import Route from '../routes/Route';

const freshLimit = 5 * 60 * 1000; // 5 minutes
const masterUserID = 100;
const masterClearword = 'hey just testing';
const port = 3000;

// Order from top to bottom: first match to last
const routes = [
	new Route(/^\/api\/events\/?$/i, 'Events'),
	new Route(/^\/api\/event\/(?<id>[^\/]+?)\/?$/i, 'Event'),
	new Route(/^\/api\/event\/?$/i, 'Event'),
	new Route(/^\/api\/auth\/(?<id>[^\/]+?)\/?$/i, 'Auth'),
	new Route(/^\/api\/auth\/?$/i, 'Auth'),
	new Route(/^\/api\/?/i, undefined) // discoverability on bad route
];

let serviceFactory, serviceToAPIResponseMap, controllerFactory, httpServer, server, baseURI;

beforeEach(() => {
	return saltAndHash('hey just testing').then(
		hashword => {
			serviceFactory = new ServiceFactory(modelFactory, db, freshLimit, masterUserID, hashword);
			serviceToAPIResponseMap = new ServiceToAPIResponseMap();
			controllerFactory = new ControllerFactory(serviceFactory, serviceToAPIResponseMap);
			if(!(controllerFactory instanceof ControllerFactory)) throw new Error('bad controllerFactory');
			httpServer = new HTTPServer(port, routes, controllerFactory);
			// httpServer.log.level('trace');
		}
	).then(
		() => httpServer.listen()
	).then(
		nodeServer => {
			server = nodeServer;
			//const {address, family, port} = server.address();
			const {port} = server.address();
			baseURI = `http://localhost:${port}`;
			return expect(server).toBeInstanceOf(Server);
		}
	).catch(
		e => expect(e).toBe('no error should be thrown')
	);
});

afterEach(() => {
	return new Promise(
		(resolve, reject) => {
			try{
				server.close(() => resolve())
				server = undefined;
			}catch(e){
				reject(e)
			}
		}
	).catch(
		e => expect(e).toBe('no error should be thrown')
	);
});

test('HTTPServer instantiates correctly', () => {
	expect(httpServer).toBeInstanceOf(HTTPServer);
	expect(httpServer.controllerFactory).toBeInstanceOf(ControllerFactory);
	expect(httpServer.port).toBe(port);
	expect(httpServer.routes).toEqual(routes);
});

test('HTTPServer decipherCredentials() works correctly', () => {
	expect(httpServer.decipherCredentials('Basic dXNlcjpwYXNz')).toEqual({user: 'user', pass: 'pass'});
	expect(httpServer.decipherCredentials('dXNlcjpwYXNz')).toEqual({user: 'user', pass: 'pass'});
	expect(httpServer.decipherCredentials('Basic dXNlcjpwYXNz')).toEqual({user: 'user', pass: 'pass'});
	expect(httpServer.decipherCredentials('Basic anVzdFBhc3M=')).toEqual({user: undefined, pass: 'justPass'});
	expect(httpServer.decipherCredentials('anVzdFBhc3M=')).toEqual({user: undefined, pass: 'justPass'});
	expect(httpServer.decipherCredentials('Basic bXlVc2VyOm15UGFzcw==')).toEqual({user: 'myUser', pass: 'myPass'});
	expect(httpServer.decipherCredentials('Basic  bXlVc2VyOm15UGFzcw==')).toEqual({user: 'myUser', pass: 'myPass'});
	expect(httpServer.decipherCredentials('bXlVc2VyOm15UGFzcw==')).toEqual({user: 'myUser', pass: 'myPass'});
	expect(httpServer.decipherCredentials('')).toEqual({user: undefined, pass: ''});
	expect(httpServer.decipherCredentials('a')).toEqual({user: undefined, pass: undefined});
	expect(httpServer.decipherCredentials('b')).toEqual({user: undefined, pass: undefined});
	expect(httpServer.decipherCredentials('c')).toEqual({user: undefined, pass: undefined});
	expect(httpServer.decipherCredentials('Basic')).toEqual({user: undefined, pass: undefined});
	expect(httpServer.decipherCredentials('Basic  ')).toEqual({user: undefined, pass: ''});
	expect(httpServer.decipherCredentials('Basic a')).toEqual({user: undefined, pass: undefined});
	expect(httpServer.decipherCredentials('Basic b')).toEqual({user: undefined, pass: undefined});
	expect(httpServer.decipherCredentials('Basic c')).toEqual({user: undefined, pass: undefined});
});

describe('HTTPServer returns all expected APIResponses for /api/auth', () => {

	test('GET returns 403 Forbidden in general', () => {
		db.getRangeReturns([]);
		return frisby.get(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 403
		).expect(
			'json', 'code', 403
		).expect(
			'json', 'status', 'Forbidden'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['auth/']
		).expectNot(
			'json', 'message', Joi.any()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 400 Bad Request on ErrorServiceResponse with BadParameterError', () => {
		httpServer.setFakeSecure(true);
		return frisby.setup({
			request: {
				headers: {
					'Authorization': `Basic`
				}
			}
		}).post(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 400
		).expect(
			'json', 'code', 400
		).expect(
			'json', 'status', 'Bad Request'
		).expect(
			'json', 'message', 'ParameterTypeError: expecting password to be a string.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 403 Forbidden on ErrorServiceResponse with InsecureOperationError', () => {
		const encString = btoa(`${masterUserID}:${masterClearword}`);
		return frisby.setup({
			request: {
				headers: {
					'Authorization': `Basic ${encString}`
				}
			}
		}).post(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 403
		).expect(
			'json', 'code', 403
		).expect(
			'json', 'status', 'Forbidden'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'header', 'Strict-Transport-Security', 'max-age=0'
		).expect(
			'json', 'links', ['auth/']
		).expect(
			'json', 'message', 'InsecureOperationError: "post" is a secure service being invoked in an insecure environment.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 204 No Content on ErrorServiceResponse with RecordExistsError', () => {
		const encString = btoa(`${masterUserID}:${masterClearword}`);
		const recs = [{key: 1, value: authRecsValid.get(1)}, {key: 2, value: authRecsValid.get(2)}];
		db.getReturns(true);
		db.getRangeReturns(recs);
		httpServer.setFakeSecure(true);
		return frisby.setup({
			request: {
				headers: {
					'Authorization': `Basic ${encString}`
				}
			}
		}).post(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expectNot( // 204 No Content means NO MESSAGE BODY
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 204
		).expectNot(
			'json', 'code', 204
		).expectNot(
			'json', 'status', 'No Content'
		).expectNot(
			'header', 'Allow', 'POST'
		).expectNot(
			'json', 'links', []
		).expectNot(
			'json', 'message', 'RecordExistsError: A record already exists with id 3.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 500 Internal Server Error on ErrorServiceResponse with Error', () => {
		const encString = btoa(`${masterUserID}:${masterClearword}`);
		db.getReturns(true);
		db.getRangeReturns('this should mess it up');
		httpServer.setFakeSecure(true);
		return frisby.setup({
			request: {
				headers: {
					'Authorization': `Basic ${encString}`
				}
			}
		}).post(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['auth/']
		).expect(
			'jsonTypes', 'message', Joi.string().required()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 201 Created on SuccessServiceResponse', () => {
		const encString = btoa(`${masterUserID}:${masterClearword}`);
		const recs = [{key: 1, value: authRecsValid.get(1)}, {key: 2, value: authRecsValid.get(2)}];
		db.getReturns(undefined);
		db.getRangeReturns(recs);
		db.putResolves(true);
		httpServer.setFakeSecure(true);
		return frisby.setup({
			request: {
				headers: {
					'Authorization': `Basic ${encString}`
				}
			}
		}).post(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 201
		).expect(
			'json', 'code', 201
		).expect(
			'json', 'status', 'Created'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'header', 'Location', 'auth/3'
		).expect(
			'json', 'links', ['auth/3']
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data.id', 3
		).expect(
			'jsonTypes', 'data.token', Joi.string().required()
		);
	});

	test('POST returns 401 Unauthorized on ErrorServiceResponse with AuthenticationFailedError', () => {
		const encString = btoa(`${masterUserID}:wrongPassword`);
		const recs = [{key: 1, value: authRecsValid.get(1)}, {key: 2, value: authRecsValid.get(2)}];
		db.getReturns(undefined);
		db.getRangeReturns(recs);
		db.putResolves(false);
		httpServer.setFakeSecure(true);
		return frisby.setup({
			request: {
				headers: {
					'Authorization': `Basic ${encString}`
				}
			}
		}).post(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 401
		).expect(
			'json', 'code', 401
		).expect(
			'json', 'status', 'Unauthorized'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'header', 'WWW-Authenticate', 'Basic realm="Access to secure operations"'
		).expect(
			'json', 'links', []
		).expect(
			'json', 'message', 'AuthenticationFailedError: Authentication has failed.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('DELETE returns 403 Forbidden on any response', () => {
		return frisby.delete(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 403
		).expect(
			'json', 'code', 403
		).expect(
			'json', 'status', 'Forbidden'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['auth/']
		).expectNot(
			'json', 'message', Joi.any()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 405 Method Not Allowed on any response', () => {
		return frisby.put(`${baseURI}/api/auth`).expect(
			'header', 'URI', '/api/auth'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 405
		).expect(
			'json', 'code', 405
		).expect(
			'json', 'status', 'Method Not Allowed'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['auth/']
		).expect(
			'jsonTypes', 'message', Joi.string().required()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('OPTIONS returns 204 No Content on S204SuccessAPIResponse', () => {
		const myID = 1;
		return frisby.options(
			`${baseURI}/api/auth/`
		).expect(
			'header', 'URI', '/api/auth'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 204
		).expectNot(
			'json', 'code', Joi.any()
		).expectNot(
			'json', 'status', Joi.any()
		).expect(
			'header', 'Allow', 'OPTIONS'
		).expect(
			'header', 'Allow', 'GET'
		).expectNot(
			'header', 'Allow', 'PUT'
		).expectNot(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expectNot(
			'json', 'links', Joi.any()
		).expectNot(
			'json', 'message', Joi.any()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

});

describe('HTTPServer returns all expected APIResponses for /api/events', () => {

	test('GET (range) returns 206 Partial Content on ErrorServiceResponse with NoRecordsFoundError: ids=2-10', () => {
		db.getRangeReturns([]);
		return frisby.setup({
			request: {
				headers: {
					'Range': `ids=2-10`
				}
			}
		}).get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'Content-Range', 'ids 2-10/*'
		).expect(
			'status', 206
		).expect(
			'json', 'code', 206
		).expect(
			'json', 'status', 'Partial Content'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['event/2', 'event/10']
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', []
		);
	});

	test('GET (range) returns 206 Partial Content on ErrorServiceResponse with NoRecordsFoundError: ids=-10', () => {
		db.getRangeReturns([]);
		return frisby.setup({
			request: {
				headers: {
					'Range': `ids=-10`
				}
			}
		}).get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'Content-Range', 'ids 1-10/*'
		).expect(
			'status', 206
		).expect(
			'json', 'code', 206
		).expect(
			'json', 'status', 'Partial Content'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['event/1', 'event/10']
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', []
		);
	});

	test('GET (range) returns 416 Range Not Satisfiable on ErrorServiceResponse with BadParameterError: ids=2-1', () => {
		db.getRangeReturns([]);
		return frisby.setup({
			request: {
				headers: {
					'Range': `ids=2-1`
				}
			}
		}).get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'Content-Range', 'ids */*'
		).expect(
			'status', 416
		).expect(
			'json', 'code', 416
		).expect(
			'json', 'status', 'Range Not Satisfiable'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['events/']
		).expect(
			'json', 'message', 'BadRangeError: start cannot be greater than end.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('GET (range) returns 206 Partial Content on SuccessServiceResponse: ids=2-3', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)}
		];
		db.getRangeReturns(recs);
		return frisby.setup({
			request: {
				headers: {
					'Range': `ids=2-3`
				}
			}
		}).get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'Content-Range', 'ids 2-3/*'
		).expect(
			'status', 206
		).expect(
			'json', 'code', 206
		).expect(
			'json', 'status', 'Partial Content'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['event/2', 'event/3']
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', []
		);
	});

	test('GET (range) returns 206 Partial Content on SuccessServiceResponse: ids=2-', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)}
		];
		db.getRangeReturns(recs);
		return frisby.setup({
			request: {
				headers: {
					'Range': `ids=2-`
				}
			}
		}).get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'Content-Range', 'ids 2-/*'
		).expect(
			'status', 206
		).expect(
			'json', 'code', 206
		).expect(
			'json', 'status', 'Partial Content'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['event/2']
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', []
		);
	});

	test('GET (no range) returns 200 OK on ErrorServiceResponse with NoRecordsFoundError', () => {
		db.getRangeReturns([]);
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Content-Range', Joi.any()
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['event/1']
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', []
		);
	});

	test('GET (no range) returns 200 OK on SuccessServiceResponse with records', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: {...eventRecsValid.get(2)}},
			{key: 3, value: eventRecsValid.get(3)}
		];
		delete recs[1].value.otherActs; // in the way of and not imperative to a pass
		db.getRangeReturns(recs);
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Content-Range', Joi.any()
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['event/1']
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'jsonStrict', 'data', [{...recs[0].value}, {...recs[1].value}, {...recs[2].value}]
		);
	});

	test('GET (range or no range) returns 500 Internal Server Error on ErrorServiceResponse with TypeError', () => {
		db.getRangeReturns('this should mess it up');
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Content-Range', Joi.any()
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['events/']
		).expect(
			'jsonTypes', 'message', Joi.string().required()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('GET (range or no range) returns 500 Internal Server Error on ErrorServiceResponse with Error', () => {
		db.getRangeThrows(new Error('I am an internal error'));
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Content-Range', Joi.any()
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['events/']
		).expect(
			'jsonTypes', 'message', Joi.string().required()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 405 Method Not Allowed on ErrorServiceResponse', () => {
		return frisby.post(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 405
		).expect(
			'json', 'code', 405
		).expect(
			'json', 'status', 'Method Not Allowed'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['events/']
		).expect(
			'jsonTypes', 'message', Joi.string().required()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 405 Method Not Allowed on ErrorServiceResponse', () => {
		return frisby.put(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 405
		).expect(
			'json', 'code', 405
		).expect(
			'json', 'status', 'Method Not Allowed'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['events/']
		).expect(
			'jsonTypes', 'message', Joi.string().required()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('DELETE returns 405 Method Not Allowed on ErrorServiceResponse', () => {
		return frisby.delete(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 405
		).expect(
			'json', 'code', 405
		).expect(
			'json', 'status', 'Method Not Allowed'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'json', 'links', ['events/']
		).expect(
			'jsonTypes', 'message', Joi.string().required()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('OPTIONS returns 204 No Content on S204SuccessAPIResponse', () => {
		const myID = 1;
		return frisby.options(
			`${baseURI}/api/events/`
		).expect(
			'header', 'URI', '/api/events'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 204
		).expectNot(
			'json', 'code', Joi.any()
		).expectNot(
			'json', 'status', Joi.any()
		).expect(
			'header', 'Allow', 'OPTIONS'
		).expect(
			'header', 'Allow', 'GET'
		).expectNot(
			'header', 'Allow', 'PUT'
		).expectNot(
			'header', 'Allow', 'DELETE'
		).expectNot(
			'header', 'Allow', 'POST'
		).expectNot(
			'json', 'links', Joi.any()
		).expectNot(
			'json', 'message', Joi.any()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

});

describe('HTTPServer returns all expected APIResponses for /api/event', () => {

	test('GET returns 404 Not Found on ErrorServiceResponse with NoRecordsFoundError', () => {
		const id = 99;
		db.getRangeReturns([]);
		return frisby.get(`${baseURI}/api/event/${id}`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['event/1']
		).expect(
			'json', 'message', `NoRecordsFoundError: No records found for start = ${id} and end = ${id}.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('GET returns 200 OK on SuccessServiceResponse with record', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)}
		];
		db.getRangeReturns(recs);
		return frisby.get(`${baseURI}/api/event/1`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'header', 'Allow', Joi.any()
		).expectNot(
			'json', 'links', Joi.any()
		).expectNot(
			'jsonTypes', 'message', Joi.any()
		).expect(
			'json', 'data', [{...recs[0].value}]
		);
	});

	test('GET returns 500 Internal Server Error on ErrorServiceResponse with an Error', () => {
		const id = 99;
		db.getRangeThrows(new Error('This is an unexpected error.'));
		return frisby.get(`${baseURI}/api/event/${id}`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['event/1']
		).expect(
			'json', 'message', `Error: This is an unexpected error.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('GET returns 500 Internal Server Error on ErrorServiceResponse with a TypeError', () => {
		const id = 1;
		db.getRangeThrows(new TypeError('This is an unexpected type error.'));
		return frisby.get(`${baseURI}/api/event/${id}`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['event/1']
		).expect(
			'json', 'message', `TypeError: This is an unexpected type error.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 403 Forbidden on ErrorServiceResponse with InsecureOperationError', () => {
		const id = 1;
		return frisby.put(`${baseURI}/api/event/${id}`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 403
		).expect(
			'json', 'code', 403
		).expect(
			'json', 'status', 'Forbidden'
		).expect(
			'header', 'Strict-Transport-Security', 'max-age=0'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/${id}`]
		).expect(
			'json', 'message', 'InsecureOperationError: "put" is a secure service being invoked in an insecure environment.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 404 Not Found on ErrorServiceResponse with NoRecordsFoundError', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const id = recs[0].value.eventID;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getRangeReturns([]);
		return frisby.put(
			`${baseURI}/api/event/${id}`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', `NoRecordsFoundError: No record found with id ${id}.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 422 Unprocessable Entity on ErrorServiceResponse with RecordTypeError', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const id = recs[0].value.eventID;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getRangeReturns([]);
		return frisby.put(
			`${baseURI}/api/event/${id}`,
			recs[0].value // missing the array wrapper!
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 422
		).expect(
			'json', 'code', 422
		).expect(
			'json', 'status', 'Unprocessable Entity'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', 'RecordTypeError: provided records should be an array of records, even if only one record in the array.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 401 Unauthorized on ErrorServiceResponse with ReauthenticationRequiredError', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const id = recs[0].value.eventID;
		httpServer.setFakeSecure(true);
		db.getRangeReturns([]);
		return frisby.put(
			`${baseURI}/api/event/${id}`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'WWW-Authenticate', 'Basic realm="Access to secure operations"'
		).expect(
			'status', 401
		).expect(
			'json', 'code', 401
		).expect(
			'json', 'status', 'Unauthorized'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'links', [`auth/`]
		).expect(
			'json', 'message', 'UnauthorizedError: Recommend authenticating first.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 500 Internal Server Error on ErrorServiceResponse with Error', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const id = recs[0].value.eventID;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getReturns(true);
		db.putResolves(false);
		return frisby.put(
			`${baseURI}/api/event/${id}`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['event/1']
		).expect(
			'json', 'message', 'Error: Database failed to update record with id 1000.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 200 OK on SuccessServiceResponse with ID', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const id = recs[0].value.eventID;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getReturns(true);
		db.putResolves(true);
		return frisby.put(
			`${baseURI}/api/event/${id}`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expectNot(
			'header', 'Allow', 'POST'
		).expectNot(
			'json', 'links', Joi.any()
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', `${id}`
		);
	});

	test('POST returns 403 Forbidden on ErrorServiceResponse with InsecureOperationError', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const id = recs[0].value.eventID;
		httpServer.setFakeSecure(false);
		return frisby.post(
			`${baseURI}/api/event/${id}`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 403
		).expect(
			'json', 'code', 403
		).expect(
			'json', 'status', 'Forbidden'
		).expect(
			'header', 'Strict-Transport-Security', 'max-age=0'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', 'InsecureOperationError: "post" is a secure service being invoked in an insecure environment.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 405 Method Not Allowed on ErrorServiceResponse with BadParameterError: in URL', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const id = recs[0].value.eventID;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getRangeReturns(recs);
		db.getReturns(true);
		db.putResolves(false);
		return frisby.post(
			`${baseURI}/api/event/${id}`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 405
		).expect(
			'json', 'code', 405
		).expect(
			'json', 'status', 'Method Not Allowed'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', 'BadParameterError: EventService "post" cannot receive a record ID; do not specify one.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 401 Unauthorized on ErrorServiceResponse with ReauthenticationRequiredError', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		httpServer.setFakeSecure(true);
		return frisby.post(
			`${baseURI}/api/event/`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'WWW-Authenticate', 'Basic realm="Access to secure operations"'
		).expect(
			'status', 401
		).expect(
			'json', 'code', 401
		).expect(
			'json', 'status', 'Unauthorized'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`, 'auth/']
		).expect(
			'json', 'message', 'UnauthorizedError: Recommend authenticating first.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 500 Internal Server Error on ErrorServiceResponse with Error', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getRangeReturns(recs);
		db.getReturns(undefined);
		db.putResolves(false);
		return frisby.post(
			`${baseURI}/api/event/`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', `Error: Database failed to create record with id ${recs[0].value.eventID + 1}`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('POST returns 201 Created on SuccessServiceResponse with ID: eventID sent', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const nextID = 1001;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getRangeReturns(recs); // rec 4 has ID of 1000, so the next ID will be 1001
		db.getReturns(undefined);
		db.putResolves(true);
		return frisby.post(
			`${baseURI}/api/event/`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'Location', `event/${nextID}`
		).expect(
			'status', 201
		).expect(
			'json', 'code', 201
		).expect(
			'json', 'status', 'Created'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expectNot(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`, `event/${nextID}`]
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', `${nextID}`
		);
	});

	test('POST returns 201 Created on SuccessServiceResponse with ID: no eventID sent', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		const nextID = 4; // we use eventRecsValid.get(3) below
		delete recs[0].value.eventID;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getRangeReturns([{key: 1, value: eventRecsValid.get(3)}]); // 4 is missing eventID now and getNextId() needs it
		db.getReturns(undefined);
		db.putResolves(true);
		return frisby.post(
			`${baseURI}/api/event/`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'Location', `event/${nextID}`
		).expect(
			'status', 201
		).expect(
			'json', 'code', 201
		).expect(
			'json', 'status', 'Created'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expectNot(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`, `event/${nextID}`]
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', `${nextID}`
		);
	});

	test('DELETE returns 403 Forbidden on ErrorServiceResponse with InsecureOperationError', () => {
		const myID = 99;
		return frisby.delete(
			`${baseURI}/api/event/${myID}`
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'header', 'Strict-Transport-Security', 'max-age=0'
		).expect(
			'status', 403
		).expect(
			'json', 'code', 403
		).expect(
			'json', 'status', 'Forbidden'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', 'InsecureOperationError: "delete" is a secure service being invoked in an insecure environment.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('DELETE returns 404 Not Found on ErrorServiceResponse with NoRecordsFoundError', () => {
		const myID = 99;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		return frisby.delete(
			`${baseURI}/api/event/${myID}`
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', `NoRecordsFoundError: No record found with id ${myID}.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('DELETE returns 401 Unauthorized on ErrorServiceResponse with ReauthenticationRequiredError', () => {
		const myID = 1;
		httpServer.setFakeSecure(true);
		return frisby.delete(
			`${baseURI}/api/event/${myID}`
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'header', 'WWW-Authenticate', 'Basic realm="Access to secure operations"'
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 401
		).expect(
			'json', 'code', 401
		).expect(
			'json', 'status', 'Unauthorized'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', ['auth/', `event/1`]
		).expect(
			'json', 'message', 'UnauthorizedError: Recommend authenticating first.'
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('DELETE returns 500 Internal Server Error on ErrorServiceResponse with Error', () => {
		const myID = 99;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getReturns(true);
		db.removeResolves(false);
		return frisby.delete(
			`${baseURI}/api/event/${myID}`
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', `Error: Database failed to delete record with id ${myID}.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('DELETE returns 500 Internal Server Error on ErrorServiceResponse with Error', () => {
		const myID = 99;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getReturns(true);
		db.removeRejects(new Error('This is an unexpected error.'));
		return frisby.delete(
			`${baseURI}/api/event/${myID}`
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 500
		).expect(
			'json', 'code', 500
		).expect(
			'json', 'status', 'Internal Server Error'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'json', 'links', [`event/1`]
		).expect(
			'json', 'message', `Error: This is an unexpected error.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('DELETE returns 204 No Content on SuccessServiceResponse with ID', () => {
		const myID = 1;
		httpServer.setFakeSecure(true);
		httpServer.setFakeAuthorized(true);
		db.getReturns(true);
		db.removeResolves(true);
		return frisby.delete(
			`${baseURI}/api/event/${myID}`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 204
		).expectNot(
			'json', 'code', Joi.any()
		).expectNot(
			'json', 'status', Joi.any()
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expect(
			'header', 'Allow', 'OPTIONS'
		).expectNot(
			'json', 'links', Joi.any()
		).expectNot(
			'json', 'message', Joi.any()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('OPTIONS returns 204 No Content on S204SuccessAPIResponse', () => {
		const myID = 1;
		return frisby.options(
			`${baseURI}/api/event/${myID}`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expectNot(
			'header', 'Location', Joi.any()
		).expect(
			'status', 204
		).expectNot(
			'json', 'code', Joi.any()
		).expectNot(
			'json', 'status', Joi.any()
		).expect(
			'header', 'Allow', 'OPTIONS'
		).expect(
			'header', 'Allow', 'GET'
		).expect(
			'header', 'Allow', 'PUT'
		).expect(
			'header', 'Allow', 'DELETE'
		).expect(
			'header', 'Allow', 'POST'
		).expectNot(
			'json', 'links', Joi.any()
		).expectNot(
			'json', 'message', Joi.any()
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

});

describe('HTTPServer replies with discoverability for unknown routes', () => {

	test('GET returns 404 Not Found for /api/', () => {
		return frisby.get(`${baseURI}/api/`).expect(
			'header', 'URI', '/api/'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expectNot(
			'header', 'Allow', Joi.any()
		).expect(
			'json', 'links', ['event/1', 'events/', 'auth/']
		).expect(
			'json', 'message', `NoRouteFoundError: Please see the links property to learn which routes are available.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT returns 404 Not Found for /api/', () => {
		return frisby.put(`${baseURI}/api/`).expect(
			'header', 'URI', '/api/'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expectNot(
			'header', 'Allow', Joi.any()
		).expect(
			'json', 'links', ['event/1', 'events/', 'auth/']
		).expect(
			'json', 'message', `NoRouteFoundError: Please see the links property to learn which routes are available.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('OPTIONS returns 404 Not Found for /api/', () => {
		return frisby.options(`${baseURI}/api/`).expect(
			'header', 'URI', '/api/'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expectNot(
			'header', 'Allow', Joi.any()
		).expect(
			'json', 'links', ['event/1', 'events/', 'auth/']
		).expect(
			'json', 'message', `NoRouteFoundError: Please see the links property to learn which routes are available.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('GET returns 404 Not Found for /api with no trailing forward slash', () => {
		return frisby.get(`${baseURI}/api`).expect(
			'header', 'URI', '/api/'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expectNot(
			'header', 'Allow', Joi.any()
		).expect(
			'json', 'links', ['event/1', 'events/', 'auth/']
		).expect(
			'json', 'message', `NoRouteFoundError: Please see the links property to learn which routes are available.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('GET returns 404 Not Found for /apia', () => {
		return frisby.get(`${baseURI}/api/`).expect(
			'header', 'URI', '/api/'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expectNot(
			'header', 'Allow', Joi.any()
		).expect(
			'json', 'links', ['event/1', 'events/', 'auth/']
		).expect(
			'json', 'message', `NoRouteFoundError: Please see the links property to learn which routes are available.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('OPTIONS returns 404 Not Found for /api/a', () => {
		return frisby.get(`${baseURI}/api/`).expect(
			'header', 'URI', '/api/'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		).expectNot(
			'header', 'Allow', Joi.any()
		).expect(
			'json', 'links', ['event/1', 'events/', 'auth/']
		).expect(
			'json', 'message', `NoRouteFoundError: Please see the links property to learn which routes are available.`
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

});

	/*
	 * First, look at all the ServiceResponses that come from each service route.
	 *
	 * Then, see how they are mapped to APIResponses, and decide:
	 *    which status code should be present?
	 *    which headers should be in each response?
	 *       Every response should have Content-Type: application/json; charset=UTF-8
	 *    which links should be in each response?
	 * Test that we receive each one of those APIResponses and that all expected headers and links are there.
	 */