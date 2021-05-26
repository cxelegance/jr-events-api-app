import Schema from '../../schemas/Schema';
import EventsSchema from '../../schemas/EventsSchema';
import {eventRecsValid, eventRecsInvalid} from '../fixtures/eventRecords';
import SchemaValidationTypeError from '../../errors/SchemaValidationTypeError';

let eventsSchema;
beforeEach(() => {
	eventsSchema = new EventsSchema();
});

test('can construct EventsSchema and get an EventsSchema instance', () => {
	expect(eventsSchema instanceof EventsSchema).toBe(true);
	expect(eventsSchema instanceof Schema).toBe(true);
	expect(typeof eventsSchema.rules).toBe('object');
	expect(eventsSchema.getShell()).toEqual(eventRecsValid.get('shell'));
});

test('datatypes property is correctly built', () => {
	expect(eventsSchema.datatypes).toEqual(['number','string','array']);
});

test('isDefinedRec() has correct logic', () => {
	expect(eventsSchema.isDefinedRec( undefined )).toBe(false);
	expect(eventsSchema.isDefinedRec( 1/0 )).toBe(false);
	expect(eventsSchema.isDefinedRec( NaN )).toBe(false);
	expect(eventsSchema.isDefinedRec( Infinity )).toBe(false);
	expect(eventsSchema.isDefinedRec( false )).toBe(false);
	expect(eventsSchema.isDefinedRec( true )).toBe(false);
	expect(eventsSchema.isDefinedRec( {} )).toBe(false);
	expect(eventsSchema.isDefinedRec( {ten: 10} )).toBe(false);
	expect(eventsSchema.isDefinedRec( new Map() )).toBe(false);

	expect(eventsSchema.isDefinedRec( null )).toBe(true);
	expect(eventsSchema.isDefinedRec( 0 )).toBe(true);
	expect(eventsSchema.isDefinedRec( -0 )).toBe(true);
	expect(eventsSchema.isDefinedRec( [] )).toBe(true);
	expect(eventsSchema.isDefinedRec( '' )).toBe(true);
	expect(eventsSchema.isDefinedRec( 10 )).toBe(true);
});

test('can quietly validate records', () => {
	for( const [id, validRec] of eventRecsValid ){
		if(id === 'shell') continue;
		// console.log(`testing id ${id}`);
		expect(() => {
			eventsSchema.validateRecord(validRec)
		}).not.toThrow();
		expect(eventsSchema.validateRecord(validRec)).toBeUndefined();
	}
});

test('invalid records throw errors', () => {
	for( const [id, invalidRec] of eventRecsInvalid ){
		if(id === 'shell') continue;
		// console.log(`testing id ${id}`);
		expect(() => {
			eventsSchema.validateRecord(invalidRec)
		}).toThrow(SchemaValidationTypeError);
	}
});

describe('validatePrimary() functions as expected when', () => {

	test('no primary is defined', () => {
		delete eventsSchema.rules.eventID.isPrimary;
		expect(() => {
			eventsSchema.validatePrimary()
		}).toThrow(SchemaValidationTypeError);
	});

	test('more than one primary is defined', () => {
		eventsSchema.rules.eventType.isPrimary = true;
		expect(() => {
			eventsSchema.validatePrimary()
		}).toThrow(SchemaValidationTypeError);
	});

	test('no isRequired is defined', () => {
		delete eventsSchema.rules.eventID.isRequired;
		expect(() => {
			eventsSchema.validatePrimary()
		}).toThrow(SchemaValidationTypeError);
	});

	test('primary type is not number', () => {
		eventsSchema.rules.eventID.type = 'string';
		expect(() => {
			eventsSchema.validatePrimary()
		}).toThrow(SchemaValidationTypeError);
	});

	test('there is one primary properly defined', () => {
		expect(() => {
			eventsSchema.validatePrimary()
		}).not.toThrow();
	});

});