import Schema from '../../schemas/Schema';
import AuthSchema from '../../schemas/AuthSchema';
import {authRecsValid, authRecsInvalid} from '../fixtures/authRecords';
import SchemaValidationTypeError from '../../errors/SchemaValidationTypeError';

let authSchema;
beforeEach(() => {
	authSchema = new AuthSchema();
});

test('can construct AuthSchema and get an AuthSchema instance', () => {
	expect(authSchema instanceof AuthSchema).toBe(true);
	expect(authSchema instanceof Schema).toBe(true);
	expect(typeof authSchema.rules).toBe('object');
	expect(authSchema.getShell()).toEqual(authRecsValid.get('shell'));
	expect(authSchema.validateRecord(authRecsValid.get(1))).toBeUndefined();
});

test('datatypes property is correctly built', () => {
	expect(authSchema.datatypes).toEqual(['number','string']);
});

test('can quietly validate records', () => {
	for( const [id, validRec] of authRecsValid ){
		if(id === 'shell') continue;
		expect(authSchema.validateRecord(validRec)).toBeUndefined();
	}
});

test('invalid records throw errors', () => {
	for( const [id, invalidRec] of authRecsInvalid ){
		if(id === 'shell') continue;
		expect(() => {
			authSchema.validateRecord(invalidRec)
		}).toThrow(SchemaValidationTypeError);
	}
});