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
		return expect(eventsService instanceof Service).toBe(true);
	});

	test('modelType property is built correctly', () => {
		return expect(eventsService.modelType).toBe('Events');
	});

	test('modelFactory property is built correctly', () => {
		return eventsService.getModel().then(
			model => {
				expect(model.getSoftDelete()).toBe(true);
				return model;
			}
		).then(
			model => model instanceof EventsModel
		).then(
			isEventsModel => expect(isEventsModel).toBe(true)
		);
	});

	test('generateError returns ErrorServiceResponse', () => {
		return expect(eventsService.generateError() instanceof ErrorServiceResponse).toBe(true);
	});

	test('generateSuccess returns SuccessServiceResponse', () => {
		return expect(eventsService.generateSuccess() instanceof SuccessServiceResponse).toBe(true);
	});

});

describe('nullStuffRecords inherited method', () => {

	test('throws Error when soft deletion is not enabled', () => {
		eventsService.isSoftDelete = false;
		return expect(() => {
			eventsService.nullStuffRecords([], 'eventID')
		}).toThrow(Error);
	});

	test('returns just nullStuffed objects when receiving just nulls', () => {
		const isNullStuffed = true;
		return expect(
			eventsService.nullStuffRecords([null, null, null], 'eventID')
		).toEqual([
			{isNullStuffed, eventID: 1},
			{isNullStuffed, eventID: 2},
			{isNullStuffed, eventID: 3}
		]);
	});

	test('returns just real records when receiving just real consecutive records', () => {
		const isNullStuffed = true;
		return expect(
			eventsService.nullStuffRecords([eventRecsValid.get(1), eventRecsValid.get(2), eventRecsValid.get(3)], 'eventID')
		).toEqual([
			eventRecsValid.get(1),
			eventRecsValid.get(2),
			eventRecsValid.get(3)
		]);
	});

	test('returns real records with nulls in between', () => {
		const isNullStuffed = true;
		return expect(
			eventsService.nullStuffRecords(
				[
					eventRecsValid.get(1),
					eventRecsValid.get(2),
					eventRecsValid.get(3),
					eventRecsValid.get(4) // eventID is 10
				], 'eventID'
			)
		).toEqual([
			eventRecsValid.get(1),
			eventRecsValid.get(2),
			eventRecsValid.get(3),
			{isNullStuffed, eventID: 4},
			{isNullStuffed, eventID: 5},
			{isNullStuffed, eventID: 6},
			{isNullStuffed, eventID: 7},
			{isNullStuffed, eventID: 8},
			{isNullStuffed, eventID: 9},
			eventRecsValid.get(4) // eventID is 10
		]);
	});

	test('returns real records with nulls on outside', () => {
		const isNullStuffed = true;
		expect(
			eventsService.nullStuffRecords(
				[
					null,
					eventRecsValid.get(2),
					eventRecsValid.get(3),
					null
				], 'eventID'
			)
		).toEqual([
			{isNullStuffed, eventID: 1},
			eventRecsValid.get(2),
			eventRecsValid.get(3),
			{isNullStuffed, eventID: 4}
		]);
		expect(
			eventsService.nullStuffRecords(
				[
					eventRecsValid.get(1),
					eventRecsValid.get(2),
					eventRecsValid.get(3),
					null
				], 'eventID'
			)
		).toEqual([
			eventRecsValid.get(1),
			eventRecsValid.get(2),
			eventRecsValid.get(3),
			{isNullStuffed, eventID: 4}
		]);
		return expect(
			eventsService.nullStuffRecords(
				[
					eventRecsValid.get(2),
					eventRecsValid.get(3),
					null
				], 'eventID'
			)
		).toEqual([
			{isNullStuffed, eventID: 1},
			eventRecsValid.get(2),
			eventRecsValid.get(3),
			{isNullStuffed, eventID: 4}
		]);
	});

	test('returns real records with nulls inside and outside', () => {
		const isNullStuffed = true;
		expect(
			eventsService.nullStuffRecords(
				[
					null,
					eventRecsValid.get(2),
					null,
					eventRecsValid.get(4),
					null
				], 'eventID'
			)
		).toEqual([
			{isNullStuffed, eventID: 1},
			eventRecsValid.get(2),
			{isNullStuffed, eventID: 3},
			{isNullStuffed, eventID: 4},
			{isNullStuffed, eventID: 5},
			{isNullStuffed, eventID: 6},
			{isNullStuffed, eventID: 7},
			{isNullStuffed, eventID: 8},
			{isNullStuffed, eventID: 9},
			eventRecsValid.get(4),
			{isNullStuffed, eventID: 11}
		]);
		return expect(
			eventsService.nullStuffRecords(
				[
					eventRecsValid.get(2),
					null,
					eventRecsValid.get(4),
					null
				], 'eventID'
			)
		).toEqual([
			{isNullStuffed, eventID: 1},
			eventRecsValid.get(2),
			{isNullStuffed, eventID: 3},
			{isNullStuffed, eventID: 4},
			{isNullStuffed, eventID: 5},
			{isNullStuffed, eventID: 6},
			{isNullStuffed, eventID: 7},
			{isNullStuffed, eventID: 8},
			{isNullStuffed, eventID: 9},
			eventRecsValid.get(4),
			{isNullStuffed, eventID: 11}
		]);
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
		return eventsServiceInsecure.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.putResolves(true);
					resolve(eventsModel);
				}
			)
		).then(
			eventsModel => expect(eventsModel.getSoftDelete()).toBe(true)
		)
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
		eventsService.isSoftDelete = false;
		eventsServiceInsecure.isSoftDelete = false;
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)},
			{key: 4, value: eventRecsValid.get(4)}
		];
		return eventsServiceInsecure.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.putResolves(true);
					eventsModel.db.getReturns(undefined);
					resolve(eventsModel);
				}
			)
		).then(
			eventsModel => expect(eventsModel.getSoftDelete()).toBe(false)
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

	test('returns an array of ids plus null-stuffed ids when given some records', () => {
		const recs = [
			{key: 1, value: eventRecsValid.get(1)},
			{key: 2, value: eventRecsValid.get(2)},
			{key: 3, value: eventRecsValid.get(3)},
			{key: 4, value: eventRecsValid.get(4)}
		];
		return eventsServiceInsecure.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.putResolves(true);
					eventsModel.db.getReturns(undefined);
					resolve(eventsModel);
				}
			)
		).then(
			eventsModel => expect(eventsModel.getSoftDelete()).toBe(true)
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
				return expect(response.data).toEqual([
					recs[0].value.eventID,
					recs[1].value.eventID,
					recs[2].value.eventID,
					4,5,6,7,8,9,
					recs[3].value.eventID
				]);
			}
		);
	});

});