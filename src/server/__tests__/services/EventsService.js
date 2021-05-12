import EventsService from '../../services/EventsService';
import Service from '../../services/Service';
import EventsModel from '../../models/EventsModel';
import {modelFactory} from '../../factories/ModelFactory';
import db from '../models/__mocks__/db';
import {eventRecsValid} from '../fixtures/eventRecords';

import ErrorServiceResponse from '../../responses/ErrorServiceResponse';
import SuccessServiceResponse from '../../responses/SuccessServiceResponse';

import NoRecordsFoundError from '../../errors/NoRecordsFoundError';
import ConfirmAuthorizationError from '../../errors/ConfirmAuthorizationError';

let eventsService, eventsServiceInsecure;

beforeEach(() => {
	eventsService = new EventsService(modelFactory, db, true);
	eventsServiceInsecure = new EventsService(modelFactory, db, false);
});

describe('eventsService instantiation is correct:', () => {

	test('is an instance of EventService and Service', () => {
		expect(eventsService instanceof EventsService).toBe(true);
		expect(eventsService instanceof Service).toBe(true);
	});

	test('modelType property is built correctly', () => {
		expect(eventsService.modelType).toBe('Events');
	});

	test('modelFactory property is built correctly', () => {
		return eventsService.getModel().then(
			model => model instanceof EventsModel
		).then(
			isEventsModel => expect(isEventsModel).toBe(true)
		);
	});

	test('generateError returns ErrorServiceResponse', () => {
		expect(eventsService.generateError() instanceof ErrorServiceResponse).toBe(true);
	});

	test('generateSuccess returns SuccessServiceResponse', () => {
		expect(eventsService.generateSuccess() instanceof SuccessServiceResponse).toBe(true);
	});

});

describe('get method', () => {

	test('returns ErrorServiceResponse with NoRecordsFoundError', () => {
		return eventsServiceInsecure.getModel().then(
			eventsModel => new Promise( resolve => resolve(eventsModel.db.getRangeReturns([])) )
		).then(
			() => eventsServiceInsecure.get({})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(NoRecordsFoundError);
			}
		);
	});

	test('returns SuccessServiceResponse with records', () => {
		const recs = [{key: 1, value: eventRecsValid.get(1)}, {key: 2, value: eventRecsValid.get(2)}];
		return eventsServiceInsecure.getModel().then(
			eventsModel => new Promise(
				resolve => resolve(eventsModel.db.getRangeReturns(recs))
			)
		).then(
			() => eventsServiceInsecure.get({})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([eventRecsValid.get(1), eventRecsValid.get(2)]);
			}
		);
	});

});

describe('put method', () => {

	test('returns an empty array when given no records, and a get() afterward return no records', () => {
		return eventsService.put({records: []}).then(
			response => {
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				if(response instanceof ErrorServiceResponse) console.log(response);
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([]);
			}
		).then(
			() => eventsService.get({})
		).then(
			response => {
				if(response instanceof SuccessServiceResponse) console.log(response);
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(NoRecordsFoundError);
			}
		);
	});

	test('returns an array of ids when given some records', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)},
			{key: 4, value: eventRecsValid.get(4)} // this one has eventID == 1000
		];
		return eventsServiceInsecure.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.putResolves(true);
					eventsModel.db.getReturns(undefined);
					resolve();
				}
			)
		).then(
			() => eventsService.put({records: recs.map( rec => rec.value )})
		).then(
			response => {
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				if(response instanceof ErrorServiceResponse) console.log(response);
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual(recs.map(
					rec => rec.value.eventID
				));
			}
		);
	});

});