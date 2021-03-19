import EventsService from '../../services/EventsService';
import Service from '../../services/Service';
import EventsModel from '../../models/EventsModel';
import {modelFactory} from '../../factories/ModelFactory';
import db from '../models/__mocks__/db';
import {eventRecsValid} from '../fixtures/eventRecords';

import ErrorServiceResponse from '../../responses/ErrorServiceResponse';
import SuccessServiceResponse from '../../responses/SuccessServiceResponse';

import NoRecordsFoundError from '../../errors/NoRecordsFoundError';

let eventsService;
const isSecure = false;

beforeEach(() => {
	eventsService = new EventsService(modelFactory, db, isSecure);
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
		return eventsService.getModel().then(
			eventsModel => new Promise( resolve => resolve(eventsModel.db.getRangeReturns([])) )
		).then(
			() => eventsService.get({})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(NoRecordsFoundError);
			}
		);
	});

	test('returns SuccessServiceResponse with records', () => {
		const recs = [{key: 1, value: eventRecsValid.get(1)}, {key: 2, value: eventRecsValid.get(2)}];
		return eventsService.getModel().then(
			eventsModel => new Promise(
				resolve => resolve(eventsModel.db.getRangeReturns(recs))
			)
		).then(
			() => eventsService.get({})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([eventRecsValid.get(1), eventRecsValid.get(2)]);
			}
		);
	});

});