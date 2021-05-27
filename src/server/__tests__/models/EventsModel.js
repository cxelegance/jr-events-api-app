import EventsSchema from '../../schemas/EventsSchema';
import EventsModel from '../../models/EventsModel';
import EventsRecord from '../../records/EventsRecord';
import Model from '../../models/Model';
import {eventRecsValid, eventRecsInvalid} from '../fixtures/eventRecords';
import db from './__mocks__/db';

import SchemaValidationTypeError from '../../errors/SchemaValidationTypeError';
import RecordExistsError from '../../errors/RecordExistsError';
import RecordDeletedError from '../../errors/RecordDeletedError';
import NoRecordsFoundError from '../../errors/NoRecordsFoundError';


// jest.mock('./__mocks__/db');

let eventsModel, schema;

beforeEach(() => {
	schema = new EventsSchema();
	eventsModel = new EventsModel(schema, db);
});

test('new eventsModel is an instance of EventsModel and Model', () => {
	expect(eventsModel instanceof EventsModel).toBe(true);
	expect(eventsModel instanceof Model).toBe(true);
});

describe('create method', () => {

	test('throws TypeError', () => {
		expect(
			() => eventsModel.create()
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => eventsModel.create({})
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => eventsModel.create({eventID: 1})
		).toThrow(TypeError);
	});

	test('throws RecordExistsError', () => {
		eventsModel.db.getReturns(true);
		expect(eventsModel.create(eventRecsValid.get(1))).rejects.toThrow(RecordExistsError);
		eventsModel.setSoftDelete(true);
		return expect(eventsModel.create(null, 1)).rejects.toThrow(RecordExistsError);
	});

	test('throws RecordDeletedError as expected', () => {
		eventsModel.db.getReturns(null);
		eventsModel.setSoftDelete(true);
		expect(eventsModel.create(null, 1)).rejects.toThrow(RecordDeletedError);
		return expect(eventsModel.create(eventRecsValid.get(1))).rejects.toThrow(RecordDeletedError);
	});

	test('throws Error', () => {
		eventsModel.db.getReturns(undefined);
		eventsModel.db.putResolves(false);
		return expect(eventsModel.create(eventRecsValid.get(2))).rejects.toThrow(Error);
	});

	test('resolves with new id', () => {
		eventsModel.db.getReturns(undefined);
		eventsModel.db.putResolves(true);
		const goodRec = eventRecsValid.get(3);
		const id = 111666;
		goodRec.eventID = id;
		return expect(eventsModel.create(goodRec)).resolves.toBe(id);
	});

});

describe('update method', () => {

	test('throws TypeError', () => {
		expect(
			() => eventsModel.update()
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => eventsModel.update({})
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => eventsModel.update({eventID: 1})
		).toThrow(TypeError);
	});

	test('throws NoRecordsFoundError', () => {
		eventsModel.db.getReturns(undefined);
		return expect(eventsModel.update(eventRecsValid.get(3))).rejects.toThrow(NoRecordsFoundError);
	});

	test('throws RecordDeletedError as expected', () => {
		eventsModel.db.getReturns(null);
		eventsModel.setSoftDelete(true);
		return expect(eventsModel.update(eventRecsValid.get(1))).rejects.toThrow(RecordDeletedError);
	});

	test('throws Error', () => {
		eventsModel.db.getReturns(true);
		eventsModel.db.putResolves(false);
		return expect(eventsModel.update(eventRecsValid.get(4))).rejects.toThrow(Error);
	});

	test('resolves with id of updated record', () => {
		eventsModel.db.getReturns(true);
		eventsModel.db.putResolves(true);
		const goodRec = eventRecsValid.get(1);
		const id = 111666777;
		goodRec.eventID = id;
		return expect(eventsModel.update(goodRec)).resolves.toBe(id);
	});

});

describe('read method', () => {

	test('throws NoRecordsFoundError', () => {
		eventsModel.db.getRangeReturns([]);
		const start = 0;
		const end = 100;
		return expect(eventsModel.read(start, end)).rejects.toThrow(NoRecordsFoundError);
	});

	test('resolves with a record', () => {
		const goodRec = eventRecsValid.get(2);
		eventsModel.db.getRangeReturns([{key: 2, value: goodRec}]);
		return expect(eventsModel.read(1)).resolves.toEqual([goodRec]);
	});

	test('resolves with no nulls when soft deleting', () => {
		eventsModel.setSoftDelete(true);
		eventsModel.db.getRangeReturns([{key: 2, value: eventRecsValid.get(2)}, {key: 3, value: null}, {key: 1, value: eventRecsValid.get(1)}]);
		return expect(eventsModel.read(1, 10000)).resolves.toEqual([eventRecsValid.get(2), eventRecsValid.get(1)]);
	});

});

describe('delete method', () => {

	test('throws NoRecordsFoundError', () => {
		eventsModel.db.getReturns(undefined);
		return expect(eventsModel.delete(0)).rejects.toThrow(NoRecordsFoundError);
	});

	test('throws RecordDeletedError as expected', () => {
		eventsModel.db.getReturns(null);
		eventsModel.setSoftDelete(true);
		return expect(eventsModel.delete(eventRecsValid.get(1).eventID)).rejects.toThrow(RecordDeletedError);
	});

	test('throws Error', () => {
		eventsModel.db.getReturns(true);
		eventsModel.db.removeResolves(false);
		return expect(eventsModel.delete(0)).rejects.toThrow(Error);
	});

	test('resolves with ID of deleted record', () => {
		const id = 1;
		eventsModel.db.getReturns(true);
		eventsModel.db.removeResolves(true);
		return expect(eventsModel.delete(id)).resolves.toBe(id);
	});

});

describe('validation errors: ', () => {

	test('create method lets SchemaValidationTypeError through', () => {
		for( const [id, invalidRec] of eventRecsInvalid ){
			if(id === 'shell') continue;
			// console.log(`testing id ${id}`);
			expect(() => {
				eventsModel.create(invalidRec)
			}).toThrow(SchemaValidationTypeError);
		}
	});

	test('update method lets SchemaValidationTypeError through', () => {
		for( const [id, invalidRec] of eventRecsInvalid ){
			if(id === 'shell') continue;
			// console.log(`testing id ${id}`);
			expect(() => {
				eventsModel.update(invalidRec)
			}).toThrow(SchemaValidationTypeError);
		}
	});
});