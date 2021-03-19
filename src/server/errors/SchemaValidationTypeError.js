/**
 * Responsible for creating a new SchemaValidationTypeError.
 *
 * @class
 * @classdesc Throw SchemaValidationTypeError when a record does not pass validation.
 */
export default class SchemaValidationTypeError extends TypeError {
	name = 'SchemaValidationTypeError';
}