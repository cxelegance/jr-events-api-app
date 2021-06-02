import dotenv from 'dotenv';
import {open} from 'lmdb-store';

const { exec } = require('child_process');

import HTTPServer from '../HTTPServer';
import {modelFactory} from '../factories/ModelFactory';
import ServiceFactory from '../factories/ServiceFactory';
import ControllerFactory from '../factories/ControllerFactory';
import ServiceToAPIResponseMap from '../maps/ServiceToAPIResponseMap';
import routes from '../apiRoutes';

const dotenvResult = dotenv.config();
if(dotenvResult.error && process.env.NODE_ENV !== 'production') throw dotenvResult.error;

if(!process.env.TEST_CLEARPASS) throw 'missing TEST_CLEARPASS in ENV';

const db = {
	path: process.env.DB_PATH,
	options: {
		compression: process.env.DB_COMPRESSION
	},
	open: (path, options) => open({path, ...options})
};

const port = process.env.PORT || process.env.DEV_PORT;

const serviceFactory = new ServiceFactory(
	modelFactory,
	db,
	parseInt(process.env.FRESHLIMIT, 10),
	process.env.MASTERUSER,
	process.env.TEST_MASTERPASS
);

const serviceToAPIResponseMap = new ServiceToAPIResponseMap();
const controllerFactory = new ControllerFactory(serviceFactory, serviceToAPIResponseMap);
const httpServer = new HTTPServer(port, routes, controllerFactory);

/*
 * Do NOT leave the log level on 'debug' or 'trace'! Request params will be logged! Think: passwords exposed.
 * Leave it on 'info'.
 */
httpServer.log.level(process.env.LOGGER_LEVEL);

// Do NOT leave these in!
httpServer.setFakeSecure(true);
// httpServer.setFakeAuthorized(true);

let server;

import frisby from 'frisby';
const Joi = frisby.Joi;

frisby.globalSetup({
	request: {
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
			'Accept': 'application/json'
		}
	}
});

import {eventRecsValid} from './fixtures/eventRecords';

const masterUserID = process.env.MASTERUSER;
const basicString = btoa(`${masterUserID}:${process.env.TEST_CLEARPASS}`);
const baseURI = `http://localhost:${port}`;

afterAll(() => {
	const proc = exec('rm -fR database/');
	return new Promise(
		(resolve, reject) => {
			proc.on('close', code => {
				try{
					server.close();
					console.log('test server is closed now');
					if(code !== 0) throw `received error code ${code}`;
					resolve();
				}catch(e){
					console.log('caught error: ', e);
					resolve();
				}
			});
		}
	);
});

describe('basic process for authenticating and getting/modifying/deleting events works', () => {

	let authToken, bearerString;

	test('first start the server', () => {
		return httpServer.listen().then(
			nodeServer => {
				server = nodeServer;
				return Promise.resolve();
			}
		)
	});

	test('GET events returns 200 empty', () => {
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', []
		);
	});

	test('POST auth returns 201 with an auth token', () => {
		return frisby.setup({
			request: {
				headers: {
					'Authorization': `Basic ${basicString}`
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
		).expectNot(
			'json', 'message', Joi.any()
		).then(
			res => {
				const json = res.json;
				authToken = json.data.authToken;
				bearerString = btoa(`${masterUserID}:${authToken}`);
				return Promise.resolve(res);
			}
		).catch(
			e => {
				server.close()
				throw e;
			}
		);
	});

	test('POST event returns 201 with a new event ID', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)}
		];
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).post(
			`${baseURI}/api/event`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 201
		).expect(
			'json', 'code', 201
		).expect(
			'json', 'status', 'Created'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', 1
		);
	});

	test('GET events returns 200 with the new event', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)}
		];
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect('jsonTypes', 'data[0]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[0].eventID', 1
		).expect(
			'json', 'data[0].displayName', recs[0].value.displayName
		);
	});

	test('GET event/1 returns 200 with the new event', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)}
		];
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
			'json', 'message', Joi.any()
		).expect('jsonTypes', 'data[0]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[0].eventID', 1
		).expect(
			'json', 'data[0].displayName', recs[0].value.displayName
		);
	});

	test('POST event returns 201 with another new event ID', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(2)}
		];
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).post(
			`${baseURI}/api/event`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 201
		).expect(
			'json', 'code', 201
		).expect(
			'json', 'status', 'Created'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', 2
		);
	});

	test('GET events returns 200 with the two new events', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)}
		];
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect('jsonTypes', 'data[0]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect('jsonTypes', 'data[1]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[0].eventID', 1
		).expect(
			'json', 'data[1].eventID', 2
		).expect(
			'json', 'data[0].displayName', recs[0].value.displayName
		).expect(
			'json', 'data[1].displayName', recs[1].value.displayName
		);
	});

	test('GET event/2 returns 200 with the latest new event', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(2)}
		];
		return frisby.get(`${baseURI}/api/event/2`).expect(
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
			'json', 'message', Joi.any()
		).expect('jsonTypes', 'data[0]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[0].eventID', 2
		).expect(
			'json', 'data[0].displayName', recs[0].value.displayName
		);
	});

	test('PUT event/2 returns 200 OK with updated event ID', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).put(
			`${baseURI}/api/event/2`,
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
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', 2
		);
	});

	test('GET event/2 returns 200 with the latest updates', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(4)}
		];
		return frisby.get(`${baseURI}/api/event/2`).expect(
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
			'json', 'message', Joi.any()
		).expect('jsonTypes', 'data[0]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[0].eventID', 2
		).expect(
			'json', 'data[0].displayName', recs[0].value.displayName
		);
	});

	test('DELETE event/2 returns 204 No Content', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).delete(
			`${baseURI}/api/event/2`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expect(
			'status', 204
		);
	});

	test('DELETE event/1 returns 204 No Content', () => {
		return frisby.delete(
			`${baseURI}/api/event/1`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expect(
			'status', 204
		);
	});

	test('GET events returns 200 empty after deleting', () => {
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', []
		);
	});

	test('POST event to preload for upcoming test of PUT (overwrite) events/', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)}
		];
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).post(
			`${baseURI}/api/event`,
			[recs[0].value]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 201
		).expect(
			'json', 'code', 201
		).expect(
			'json', 'status', 'Created'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data', 3 // 1 and 2 were soft deleted
		);
	});

	test('GET events confirm the new event', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)}
		];
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect('jsonTypes', 'data[0]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[0].eventID', 3
		).expect(
			'json', 'data[0].displayName', recs[0].value.displayName
		).expectNot(
			'jsonTypes', 'data[1]', Joi.any()
		);
	});

	test('PUT events returns an exact array of event IDs as expected', () => {
		const recs = [
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)},
			{key: 4, value: eventRecsValid.get(4)},
		];
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).put(
			`${baseURI}/api/events`,
			recs.map(rec => rec.value)
		).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data[0]', 1
		).expect(
			'json', 'data[1]', recs[0].value.eventID
		).expect(
			'json', 'data[2]', recs[1].value.eventID
		).expect(
			'json', 'data[3]', 4
		).expect(
			'json', 'data[4]', 5
		).expect(
			'json', 'data[5]', 6
		).expect(
			'json', 'data[6]', 7
		).expect(
			'json', 'data[7]', 8
		).expect(
			'json', 'data[8]', 9
		).expect(
			'json', 'data[9]', recs[2].value.eventID
		).expectNot(
			'jsonTypes', 'data[10]', Joi.any()
		);
	});

	test('GET events confirm the new events', () => {
		const recs = [ // must be same as previous test!
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)},
			{key: 4, value: eventRecsValid.get(4)},
		];
		return frisby.get(`${baseURI}/api/events`).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect('jsonTypes', 'data[0]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[0].eventID', recs[0].value.eventID
		).expect(
			'json', 'data[0].displayName', recs[0].value.displayName
		).expect('jsonTypes', 'data[1]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[1].eventID', recs[1].value.eventID
		).expect(
			'json', 'data[1].displayName', recs[1].value.displayName
		).expect('jsonTypes', 'data[2]',
			{
				"eventID": Joi.number(),
				"displayName": Joi.string()
			}
		).expect(
			'json', 'data[2].eventID', recs[2].value.eventID
		).expect(
			'json', 'data[2].displayName', recs[2].value.displayName
		).expectNot(
			'json', 'data[3]', Joi.any()
		);
	});

	test('PUT events to init for the next tests regarding deletions', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)},
			{key: 4, value: eventRecsValid.get(4)},
		];
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).put(
			`${baseURI}/api/events`,
			recs.map(rec => rec.value)
		).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data[0]', recs[0].value.eventID
		).expect(
			'json', 'data[1]', recs[1].value.eventID
		).expect(
			'json', 'data[2]', recs[2].value.eventID
		).expect(
			'json', 'data[3]', 4
		).expect(
			'json', 'data[4]', 5
		).expect(
			'json', 'data[5]', 6
		).expect(
			'json', 'data[6]', 7
		).expect(
			'json', 'data[7]', 8
		).expect(
			'json', 'data[8]', 9
		).expect(
			'json', 'data[9]', recs[3].value.eventID
		).expectNot(
			'jsonTypes', 'data[10]', Joi.any()
		);
	});

	test('GET /event/11 returns 404', () => {
		return frisby.get(`${baseURI}/api/event/11`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		);
	});

	test('GET /event/9 returns 410', () => {
		return frisby.get(`${baseURI}/api/event/9`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 410
		).expect(
			'json', 'code', 410
		).expect(
			'json', 'status', 'Gone'
		).expectNot(
			'json', 'message', Joi.any()
		);
	});

	test('GET /event/4 returns 410', () => {
		return frisby.get(`${baseURI}/api/event/4`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 410
		).expect(
			'json', 'code', 410
		).expect(
			'json', 'status', 'Gone'
		).expectNot(
			'json', 'message', Joi.any()
		);
	});

	test('PUT /event/4 returns 404', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).put(
			`${baseURI}/api/event/4`,
			[eventRecsValid.get(1)]
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
		);
	});

	test('GET /events/ returns exactly what we PUT to init the db', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)},
			{key: 4, value: eventRecsValid.get(4)},
		];
		return frisby.get(
			`${baseURI}/api/events`
		).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data[0].eventID', recs[0].value.eventID
		).expect(
			'json', 'data[1].eventID', recs[1].value.eventID
		).expect(
			'json', 'data[2].eventID', recs[2].value.eventID
		).expect(
			'json', 'data[3].eventID', recs[3].value.eventID
		).expectNot(
			'jsonTypes', 'data[4]', Joi.any()
		);
	});

	test('DELETE event/2 returns 204 No Content; will try a GET afterward', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).delete(
			`${baseURI}/api/event/2`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expect(
			'status', 204
		);
	});

	test('GET /event/2 returns 410', () => {
		return frisby.get(`${baseURI}/api/event/2`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 410
		).expect(
			'json', 'code', 410
		).expect(
			'json', 'status', 'Gone'
		).expectNot(
			'json', 'message', Joi.any()
		);
	});

	test('DELETE event/3 for the next tests', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).delete(
			`${baseURI}/api/event/3`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expect(
			'status', 204
		);
	});

	test('DELETE event/10 for the next tests', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).delete(
			`${baseURI}/api/event/10`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expect(
			'status', 204
		);
	});

	test('GET /event/10 returns 410', () => {
		return frisby.get(`${baseURI}/api/event/10`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 410
		).expect(
			'json', 'code', 410
		).expect(
			'json', 'status', 'Gone'
		).expectNot(
			'json', 'message', Joi.any()
		);
	});

	test('POST /event/ returns 201, a new event which we will next delete', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).post(
			`${baseURI}/api/event/`,
			[eventRecsValid.get(1)]
		).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 201
		).expect(
			'json', 'code', 201
		).expect(
			'json', 'status', 'Created'
		).expect(
			'json', 'data', 11
		);
	});

	test('GET /event/11 returns 200 to confirm previous POST', () => {
		const rec = {...eventRecsValid.get(1)};
		rec.eventID = 11;
		return frisby.get(`${baseURI}/api/event/11`).expect(
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
			'json', 'data[0].eventID', rec.eventID
		).expect(
			'json', 'data[0].displayName', rec.displayName
		).expect(
			'json', 'data[0].description', rec.description
		);
	});

	test('DELETE event/11 for the next tests', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).delete(
			`${baseURI}/api/event/11`
		).expect(
			'header', 'URI', '/api/event'
		).expectNot(
			'header', 'Content-Type', Joi.any()
		).expect(
			'status', 204
		);
	});

	test('PUT /event/11 returns 404, it has been deleted', () => {
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).put(
			`${baseURI}/api/event/11`,
			[eventRecsValid.get(1)]
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
		).expectNot(
			'json', 'data', Joi.any()
		);
	});

	test('PUT events with NULL records to init for the next tests', () => {
		const rec5 = {...eventRecsValid.get(4)};
		rec5.eventID = 5;
		const recs = [
			eventRecsValid.get(1),
			eventRecsValid.get(2),
			eventRecsValid.get(3),
			null,
			rec5,
			null
		];
		return frisby.setup({
			request: {
				headers: {
					"Authorization": `Bearer ${bearerString}`,
					"Content-Type": 'application/json; charset=utf-8'
				}
			}
		}).put(
			`${baseURI}/api/events`,
			recs.map(rec => rec)
		).expect(
			'header', 'URI', '/api/events'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 200
		).expect(
			'json', 'code', 200
		).expect(
			'json', 'status', 'OK'
		).expectNot(
			'json', 'message', Joi.any()
		).expect(
			'json', 'data[0]', recs[0].eventID
		).expect(
			'json', 'data[1]', recs[1].eventID
		).expect(
			'json', 'data[2]', recs[2].eventID
		).expect(
			'json', 'data[3]', 4
		).expect(
			'json', 'data[4]', recs[4].eventID
		).expect(
			'json', 'data[5]', 6
		).expectNot(
			'jsonTypes', 'data[6]', Joi.any()
		);
	});

	test('GET /event/4 returns 410 because it was input as a NULL', () => {
		return frisby.get(`${baseURI}/api/event/4`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 410
		).expect(
			'json', 'code', 410
		).expect(
			'json', 'status', 'Gone'
		).expectNot(
			'json', 'message', Joi.any()
		);
	});

	test('GET /event/6 returns 410 because it was input as a NULL', () => {
		return frisby.get(`${baseURI}/api/event/6`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 410
		).expect(
			'json', 'code', 410
		).expect(
			'json', 'status', 'Gone'
		).expectNot(
			'json', 'message', Joi.any()
		);
	});

	test('GET /event/7 returns 404 because it the last NULL was 6', () => {
		return frisby.get(`${baseURI}/api/event/7`).expect(
			'header', 'URI', '/api/event'
		).expect(
			'header', 'Content-Type', 'application/json; charset=UTF-8'
		).expect(
			'status', 404
		).expect(
			'json', 'code', 404
		).expect(
			'json', 'status', 'Not Found'
		);
	});

});