/**
 * Responsible for creating a new ParameterTypeError.
 *
 * @class
 * @classdesc Throw ParameterTypeError when a Service receives a parameter that is not of the correct type.
 */
export default class ParameterTypeError extends TypeError {
	name = 'ParameterTypeError';
}