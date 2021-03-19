import UnauthorizedError from './UnauthorizedError';

/**
 * Responsible for creating a new ReauthenticationRequiredError.
 *
 * @class
 * @classdesc Throw ReauthenticationRequiredError when new authentication is required for a given request.
 */
export default class ReauthenticationRequiredError extends UnauthorizedError {
	name = 'ReauthenticationRequiredError';
}