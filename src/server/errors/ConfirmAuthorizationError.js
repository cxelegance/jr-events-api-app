/**
 * Responsible for creating a new ConfirmAuthorizationError.
 *
 * @class
 * @classdesc Throw ConfirmAuthorizationError when an HTTPServer should confirm authorization before proceeding with a request.
 */
export default class ConfirmAuthorizationError extends Error{
	name = 'ConfirmAuthorizationError';
	proceed;
	fail;
}