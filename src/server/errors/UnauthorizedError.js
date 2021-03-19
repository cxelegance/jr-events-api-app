/**
 * Responsible for creating a new UnauthorizedError.
 *
 * @class
 * @classdesc Throw UnauthorizedError when a user is not authorized to have a request fulfilled.
 */
export default class UnauthorizedError extends Error {
	name = 'UnauthorizedError';
}