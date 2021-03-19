/**
 * Responsible for creating a new RecordTypeError.
 *
 * @class
 * @classdesc Throw RecordTypeError when a record arriving as a parameter is not of the expected form.
 */
export default class RecordTypeError extends TypeError {
	name = 'RecordTypeError';
}