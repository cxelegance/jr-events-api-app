import Controller from './Controller';

/**
 * Responsible for defining the AuthController.
 *
 * @class
 * @classdesc The AuthController routes requests on the Auth route to the AuthService.
 */
export default class AuthController extends Controller { // FINAL

	constructor(serviceFactory, serviceToAPIResponseMap){
		super(serviceFactory, serviceToAPIResponseMap);
		this.serviceRoute = 'Auth';
		if(this.constructor !== AuthController){
			throw new Error('AuthController is a final class and cannot be extended.');
		}
	}

}