/**
 * Responsible for creating a new BadRangeError.
 *
 * @class
 * @classdesc Throw BadRangeError when a parameter is out of range, or if a range is impossible or in reverse.
 */
export default class BadRangeError extends RangeError {
	name = 'BadRangeError';
}