/**
 * Responsible for creating a new NoRecordsFoundError.
 *
 * @class
 * @classdesc Throw NoRecordsFoundError when an operation yields no records when it potentially could reveal some.
 */
export default class NoRecordsFoundError extends Error {
	name = 'NoRecordsFoundError';
}