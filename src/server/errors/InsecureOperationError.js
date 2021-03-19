/**
 * Responsible for creating a new InsecureOperationError.
 *
 * @class
 * @classdesc Throw InsecureOperationError when a secure operation is being attempted in an insecure environment.
 */
export default class InsecureOperationError extends Error {
	name = 'InsecureOperationError';
}