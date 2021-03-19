/**
 * Responsible for creating a new NoSuchMethodTypeError.
 *
 * @class
 * @classdesc Throw NoSuchMethodTypeError when an operation/service is requested that doesn't exist.
 */
export default class NoSuchMethodTypeError extends TypeError {
	name = 'NoSuchMethodTypeError';
}