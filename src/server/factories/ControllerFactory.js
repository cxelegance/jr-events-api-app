/**
 * Responsible for defining a ControllerFactory.
 *
 * @class
 * @classdesc A ControllerFactory builds controllers to handle API Requests.
 */
export default class ControllerFactory { // FINAL

	/** @type {ServiceFactory} Allows the Controller to build services. */
	serviceFactory;

	/** @type {ServiceToAPIResponseMap} Allows the Controller to map ServiceResponses to APIResponses. */
	serviceToAPIResponseMap;

	/**
	 * @param {ServiceFactory}          serviceFactory          For setting the internal property of the same name.
	 * @param {ServiceToAPIResponseMap} serviceToAPIResponseMap For setting the internal property of the same name.
	 */
	constructor(serviceFactory, serviceToAPIResponseMap){
		if(this.constructor !== ControllerFactory){
			throw new Error('ControllerFactory is a final class and cannot be extended.');
		}
		this.serviceFactory = serviceFactory;
		this.serviceToAPIResponseMap = serviceToAPIResponseMap;
	}

	/**
	 * Responsible for getting a newly built Controller of a specified type.
	 *
	 * @see Controller
	 *
	 * @param  {String}       type           E.g. Auth, Events; prefixes for AuthController, EventsController, EventController, etc.
	 * @param  {String}       version        E.g. v2, v3, v4; must match the class naming structure for Controllers, Services, Models, Schema, etc.
	 *
	 * @return {Promise}                     Resolves with a newly built controller.
	 */
	get(type, version){
		const typeControllerVersion = `${type}Controller` + ( version ? (`_v_${version}`) : '' );
		let controllerClass;
		return import(
			`../controllers/${typeControllerVersion}`
		).then(
			imported => controllerClass = imported.default
		).then(
			() => new controllerClass(
				this.serviceFactory, this.serviceToAPIResponseMap
			)
		);
	}

}