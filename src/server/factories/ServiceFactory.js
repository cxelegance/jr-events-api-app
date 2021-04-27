/**
 * Responsible for defining a ServiceFactory.
 *
 * @class
 * @classdesc A ServiceFactory builds services for consumers.
 */
export default class ServiceFactory { // FINAL

	/** @type {ModelFactory} A ModelFactory so that the Service can build models. */
	modelFactory;

	/** @type {Object} A database object. Update this? */
	db;

	/** @type {Number} How many milliseconds can transpire before an Authentication record goes stale? */
	freshLimit;

	/** @type {String} The master admin userID. */
	#masterUserID;

	/** @type {String} The master admin password (should be hashed). */
	#masterHashword;

	/**
	 * @param {ModelFactory} modelFactory   For setting the internal property of the same name.
	 * @param {Object}       db             For setting the internal property of the same name.
	 * @param {Number}       freshLimit     For setting the internal property of the same name.
	 * @param {String}       masterUserID   For setting the internal property of the same name.
	 * @param {String}       masterHashword For setting the internal property of the same name.
	 */
	constructor(modelFactory, db, freshLimit, masterUserID, masterHashword){
		if(this.constructor !== ServiceFactory){
			throw new Error('ServiceFactory is a final class and cannot be extended.');
		}
		this.modelFactory = modelFactory;
		this.db = db;
		this.freshLimit = freshLimit;
		this.#masterUserID = masterUserID;
		this.#masterHashword = masterHashword;
	}

	/**
	 * Responsible for getting a newly built Service of a specified type.
	 *
	 * @see Service
	 *
	 * @param  {String}       type           E.g. Auth, Events; prefixes for AuthService, EventsService, EventService, etc.
	 * @param  {String}       version        E.g. v2, v3, v4; must match the class naming structure for Services, Models, Schema, etc.
	 * @param  {Boolean}      isSecure       Will the Service will be operating in a secure environment?
	 *
	 * @return {Promise}                     Resolves with a newly built service.
	 */
	get(type, version, isSecure){
		const typeServiceVersion = `${type}Service` + ( version ? (`_v_${version}`) : '' );
		const db = {...this.db};
		db.path += `-${type}`;
		let serviceClass;
		return import(
			`../services/${typeServiceVersion}`
		).then(
			imported => serviceClass = imported.default
		).then(
			() => new serviceClass(
				this.modelFactory, db.open(db.path, db.options), isSecure, this.freshLimit, this.#masterUserID, this.#masterHashword
			)
		);
	}

}