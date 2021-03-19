import AuthSchema from '../../schemas/AuthSchema';
import AuthModel from '../../models/AuthModel';
import AuthRecord from '../../records/AuthRecord';
import Model from '../../models/Model';
import {authRecsValid, authRecsInvalid} from '../fixtures/authRecords';
import db from './__mocks__/db';

import SchemaValidationTypeError from '../../errors/SchemaValidationTypeError';
import RecordExistsError from '../../errors/RecordExistsError';
import NoRecordsFoundError from '../../errors/NoRecordsFoundError';


// jest.mock('./__mocks__/db');

let authModel, schema;

beforeEach(() => {
	schema = new AuthSchema();
	authModel = new AuthModel(schema, db);
});

test('new authModel is an instance of AuthModel and Model', () => {
	expect(authModel instanceof AuthModel).toBe(true);
	expect(authModel instanceof Model).toBe(true);
});

describe('create method', () => {

	test('throws TypeError', () => {
		expect(
			() => authModel.create()
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => authModel.create({})
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => authModel.create({authID: 1})
		).toThrow(TypeError);
	});

});

describe('update method', () => {

	test('throws TypeError', () => {
		expect(
			() => authModel.update()
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => authModel.update({})
		).toThrow(TypeError);
	});

	test('throws TypeError', () => {
		expect(
			() => authModel.update({authID: 1})
		).toThrow(TypeError);
	});

});

describe('validation errors: ', () => {

	test('create method lets SchemaValidationTypeError through', () => {
		for( const [id, invalidRec] of authRecsInvalid ){
			if(id === 'shell') continue;
			// console.log(`testing id ${id}`);
			expect(() => {
				authModel.create(invalidRec)
			}).toThrow(SchemaValidationTypeError);
		}
	});

	test('update method lets SchemaValidationTypeError through', () => {
		for( const [id, invalidRec] of authRecsInvalid ){
			if(id === 'shell') continue;
			// console.log(`testing id ${id}`);
			expect(() => {
				authModel.update(invalidRec)
			}).toThrow(SchemaValidationTypeError);
		}
	});
});