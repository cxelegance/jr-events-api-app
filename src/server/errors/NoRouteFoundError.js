/**
 * Responsible for creating a new NoRouteFoundError.
 *
 * @class
 * @classdesc Throw NoRouteFoundError when no service route exists.
 */
export default class NoRouteFoundError extends Error {
	name = 'NoRouteFoundError';
}