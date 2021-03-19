/**
 * Responsible for creating a new AuthenticationFailedError.
 *
 * @class
 * @classdesc Throw AuthenticationFailedError when an authentication attempt fails.
 */
export default class AuthenticationFailedError extends Error {
	name = 'AuthenticationFailedError';
}