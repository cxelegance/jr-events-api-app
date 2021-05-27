/**
 * Responsible for creating a new RecordDeletedError.
 *
 * @class
 * @classdesc Throw RecordDeletedError when an attempt is made to reference a deleted record.
 */
export default class RecordDeletedError extends Error {
	name = 'RecordDeletedError';
}