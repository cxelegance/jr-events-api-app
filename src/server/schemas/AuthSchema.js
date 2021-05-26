import Schema from './Schema';

/**
 * Responsible for defining AuthSchema.
 *
 * @class
 * @classdesc AuthSchema defines AuthRecords in the database.
 */
export default class AuthSchema extends Schema {

	rules = {
		authID: {
			type: 'number',
			isRequired: true,
			isPrimary: true
		},
		authToken: {
			type: 'string',
			isRequired: true,
			note: 'this is a hash-style unique string'
		},
		userID: {
			type: 'string',
			isRequired: true,
		},
		createdAt: {
			type: 'number',
			isRequired: true,
			note: 'milliseconds since the Unix Epoch.'
		}
	};

	constructor(){
		super();
		this.validatePrimary();
		this.datatypes = [];
		this.populateDatatypes();
	}

}