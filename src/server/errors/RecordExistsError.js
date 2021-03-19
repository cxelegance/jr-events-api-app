/**
 * Responsible for creating a new RecordExistsError.
 *
 * @class
 * @classdesc Throw RecordExistsError when an attempt to create a record would unintentionally overwrite an existing record.
 */
export default class RecordExistsError extends Error {
	name = 'RecordExistsError';
}