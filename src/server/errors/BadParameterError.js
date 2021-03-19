/**
 * Responsible for creating a new BadParameterError.
 *
 * @class
 * @classdesc Throw BadParameterError when a parameter is received that is not allowed with a specific service request;
 *            the receipt of such a parameter indicates a possible misunderstanding of the service by the client.
 */
export default class BadParameterError extends TypeError {
	name = 'BadParameterError';
}