import SuccessServiceResponse from '../responses/SuccessServiceResponse';
import ErrorServiceResponse from '../responses/ErrorServiceResponse';
import InsecureOperationError from '../errors/InsecureOperationError';
import ConfirmAuthorizationError from '../errors/ConfirmAuthorizationError';
import NoSuchMethodTypeError from '../errors/NoSuchMethodTypeError';
import RecordTypeError from '../errors/RecordTypeError';
import NoRecordsFoundError from '../errors/NoRecordsFoundError';

/**
 * Responsible for abstractly defining a Service; an inheriting class must make only its public-facing methods public—all else should be private;
 * the inheriting class is expected to be final.
 *
 * @abstract
 * @class
 * @classdesc A Service provides a group of operations to a consumer, shielding the consumer from any databases or database models.
 *            A Service is responsible for specifying which of its public-facing methods are secure methods, such that they require a secure transaction environment and an authorized requestor.
 */
export default class Service {

	/** @type {String} Used for building a model, e.g., 'Events'Model; set by the inheriting class. */
	modelType;

	/** @type {ModelFactory} For building a model when required. */
	modelFactory;

	/** @type {Object} A database opener object; has a path to db, some {options}, and an open(path, options) method. */
	db;

	/** @type {String} Should be at the end of the inheriting class name, e.g. 'v_2' for ChildService_v_2; falsy for v1 of ChildService. */
	version;

	/** @type {Boolean} Is the instance of the inheriting service operating in a secure (authenticated) environment? */
	#isSecure;

	/** @type {String} The name of this service; same as the prefix in the inheriting class name, e.g., EventService. **/
	serviceName;

	/** @type {String[]} Each method that requires a secure environment and authorization should be pushed onto this list. **/
	secureMethods;

	/** @type {String[]} All methods available through the inheriting service should be pushed onto this list. */
	allMethods;

	/** @type {Model} Built by the ModelFactory and stored here. */
	#model;

	/** @type {Number} The next ID to use when creating a new record. */
	#nextId;

	/** @type {Boolean} True for soft deletion, i.e., record is NULL, or false for real deletion. */
	isSoftDelete;

	/**
	 * @param {ModelFactory}  modelFactory   For setting the internal property of the same name.
	 * @param {Object}        db             For setting the internal property of the same name.
	 * @param {Boolean}       isSecure       For setting the internal property of the same name.
	 */
	constructor(modelFactory, db, isSecure){
		if(this.constructor === Service){
			throw new Error('Service is an abstract class and must be extended.');
		}
		this.modelFactory = modelFactory;
		this.db = db;
		this.#isSecure = isSecure;
		this.secureMethods = [];
		this.allMethods = ['options'];
		this.isSoftDelete = false;
	}

	/**
	 * Responsible for getting the allMethods property; the inheriting class' services available to
	 * the consumer, i.e. what are my options?
	 *
	 * @see allMethods
	 *
	 * @param {Object} params Params that were sent as part of the service request.
	 *
	 * @return {Promise} The promise resolves with a SuccessServiceResponse with an 'options' property.
	 */
	options(params){
		return this.generateSuccess('options', undefined, {...params});
	}


	/**
	 * Responsible for getting the Model for working with the database.
	 *
	 * @see #model
	 *
	 * @return {Promise} The promise resolves with a built Model; use a final catch on your promise chain.
	 */
	getModel(){
		if(this.#model){
			return new Promise(
				(resolve, reject) => resolve(this.#model)
			);
		}else{
			return this.modelFactory.get(this.modelType, this.db, this.version).then(
				model => {
					model.setSoftDelete(this.isSoftDelete);
					return model;
				}
			).then(
				model => this.#model = model
			); // do not catch here! Let consumer catch instead.
		}
	}

	/**
	 * Responsible for getting a new ID for a new record.
	 *
	 * @param  {string} propName The name of the property that holds the index/key for records.
	 *
	 * @throws TypeError
	 *
	 * @return {Promise}         The promise resolves with a Number; use a final catch on your promise chain.
	 */
	getNextId(propName){
		if(typeof propName != 'string') throw new TypeError('getNextId() expects a string.');
		const dummyLastRec = {};
		dummyLastRec[propName] = 0;
		if(this.#nextId) return new Promise(
			resolve => resolve(this.#nextId)
		);
		else return this.getModel().then(
			model => model.read(1, undefined)
		).catch(
			e => {
				if(!(e instanceof NoRecordsFoundError)) throw e;
				else return [];
			}
		).then(
			records => records.pop() || dummyLastRec
		).then(
			lastRec => lastRec[propName] + 1
		); // do not catch here! Let consumer catch instead.
	}

	/**
	 * Responsible for setting internal property #nextId.
	 *
	 * @see #nextId
	 *
	 * @param {Number} id The nextId for creating records.
	 *
	 * @throws TypeError
	 *
	 * @return {Number} The id that was given.
	 */
	setNextId(id){
		if(typeof id != 'number' || isNaN(id)) throw new TypeError('setNextId() expects a number');
		return this.#nextId = id;
	}

	/**
	 * Responsible for transforming an array of records into an array of Records that work with the inheriting class and #modelType.
	 *
	 * @see #modelType
	 *
	 * @param  {Record}  recClass           The class of records for preparing the next parameter, 'records'.
	 * @param  {Array}   [records=null]     The records as received from the consumer.
	 * @param  {Boolean} [allowEmpty=false] Is an empty array allowed?
	 *
	 * @return {Promise} The promise resolves with an array of Records or rejects with RecordTypeError.
	 */
	prepareRecords(recClass, records = null, allowEmpty = false){
		return new Promise(
			(resolve, reject) => {
				if(!Array.isArray(records) || !allowEmpty && !records.length){
					reject(new RecordTypeError('provided records should be an array of records, even if only one record in the array.'));
				}else{
					let out;
					try{
						out = records.map(
							rec => this.isSoftDelete && rec === null ? null : new recClass(rec)
						)
					}catch(recordTypeError){
						reject(recordTypeError)
					}
					resolve(out);
				}
			}
		);

	}

	/**
	 * Responsible for generating InsecureOperationError when a secure service is being accessed in an insecure environment.
	 *
	 * @see #isSecure
	 * @see #secureMethods
	 * @see InsecureOperationError
	 * @throws TypeError
	 *
	 * @param {String} method The name of the calling method.
	 *
	 * @return {Promise} The promise resolves empty or rejects with InsecureOperationError.
	 */
	throwIfInsecure(method){
		if(!(this[method] instanceof Function)){
			throw new TypeError('throwIfInsecure() must be passed the name of the method/function you are calling from.');
		}

		const isSecureMethod = this.secureMethods.includes(method);

		return new Promise(
			(resolve, reject) => {
				if(isSecureMethod && !this.#isSecure){
					reject(new InsecureOperationError(`"${method}" is a secure service being invoked in an insecure environment.`));
				}else{
					resolve()
				}
			}
		);
	}

	/**
	 * Responsible for generating ConfirmAuthorizationError when a service is being accessed that requires authorization.
	 *
	 * @see #secureMethods
	 * @see ConfirmAuthorizationError
	 * @throws TypeError
	 *
	 * @param  {String} method The name of the calling method.
	 *
	 * @return {Promise} The promise resolves empty or rejects with ConfirmAuthorizationError.
	 */
	throwIfAuthRequired(method){
		if(!(this[method] instanceof Function)){
			throw new TypeError('throwIfAuthRequired() must be passed the name of the method/function you are calling from.');
		}

		const isSecureMethod = this.secureMethods.includes(method);

		return new Promise(
			(resolve, reject) => {
				if(isSecureMethod){
					reject(new ConfirmAuthorizationError(`"${method}" requires authorization: (re)authentication may be necessary.`));
				}else{
					resolve();
				}
			}
		);
	}

	/**
	 * Responsible for executing a service request after checking that the request passes security checks;
	 * in the case of throwing ConfirmAuthorizationError, the performService parameter is passed to the consumer
	 * as a property on the error; it is the responsibility of the consumer to deal with authorization before proceeding.
	 *
	 * @see #throwIfInsecure
	 * @see #throwIfAuthRequired
	 * @see ConfirmAuthorizationError
	 *
	 * @param  {String}   method         The name of the calling method.
	 * @param  {Object}   params         Params that were sent as part of the service request.
	 * @param  {Function} performService The work that the calling method would undertake to complete the service request.
	 *
	 * @return {Promise} The promise resolves with the result of performService or with an ErrorServiceResponse.
	 */
	performAfterSecurityChecks(method, params, performService){
		return Promise.resolve(
		).then(
			() => this.throwIfInsecure(method)
		).then(
			() => this.throwIfAuthRequired(method)
		).then(
			performService
		).catch(
			error => {
				if(error instanceof ConfirmAuthorizationError){
					error.proceed = performService;
					error.fail = unAuthorizedError => this.generateError(method, unAuthorizedError, params);
				}
				return this.generateError(method, error, params);
			}
		);
	}

	/**
	 * Responsible for generating an error when an inheriting service has no desired method; it is important that the
	 * inheriting service does not throw any errors.
	 *
	 * @param  {String} methodName   The name of the method that was not found on the inheriting service.
	 *
	 * @return {ErrorServiceResponse} Carries NoSuchMethodTypeError.
	 */
	noSuchMethod(methodName){
		return this.generateError(
			methodName,
			new NoSuchMethodTypeError(`Service "${this.serviceName}" has no method "${methodName}".`)
		);
	}

	/**
	 * Responsible for creating an instance of ErrorServiceResponse.
	 *
	 * @param  {String} method      Name of the calling method; the method that was originally called in the service request.
	 * @param  {Error}  e           Any generated error.
	 * @param  {Object} [params={}] Params that were sent as part of the service request.
	 *
	 * @return {ErrorServiceResponse}
	 */
	generateError(method, e, params = {}){
		return new ErrorServiceResponse(this.serviceName, method, e, undefined, params, this.allMethods);
	}

	/**
	 * Responsible for creating an instance of SuccessServiceResponse.
	 *
	 * @param  {String} method      Name of the calling method; the method that was originally called in the service request.
	 * @param  {*}      data        Any generated data.
	 * @param  {Object} [params={}] Params that were sent as part of the service request.
	 *
	 * @return {SuccessServiceResponse}
	 */
	generateSuccess(method, data, params = {}){
		return new SuccessServiceResponse(this.serviceName, method, undefined, data, params, this.allMethods);
	}

	/**
	 * Exists solely for testing purposes without compromising the system.
	 *
	 * @return {ErrorServiceResponse}
	 */
	testingOnlyMethodOnTheParentService({serviceRoute}){
		return noSuchMethod('testingOnlyMethodOnTheParentService');
	}

	/**
	 * Responsible for copying an array of records but filling any gaps in record IDs with NULL records;
	 * intended for soft deletion only; intended for use during replacement of all records with user-supplied
	 * records; you should call prepareRecords() first; a NULL record looks like {isNullStuffed: true, <recordID>};
	 * the consumer can replace such a record with NULL and provide the record ID.
	 *
	 * @see prepareRecords()
	 *
	 * @param  {Record[]} records  Records that may or may not have non-contiguous record IDs within them.
	 * @param  {String}   propName The name of the property that holds the index/key for records.
	 *
	 * @return {Record[]} A new array that has all records from input array plus any NULL records that were necessary.
	 */
	nullStuffRecords(records, propName){
		if(!this.isSoftDelete) throw new Error('do not nullStuffRecords() when not soft deleting.');
		const out = [];
		let lastId = 0;
		while(records.length){
			const rec = records.shift(); //rec is either NULL, or a proper record with ID
			const isNullStuffed = true;
			let extraRec;

			if(rec === null){
				rec = {isNullStuffed};
				rec[propName] = lastId + 1;
			}

			// lastId is either 0 or 1; 0 if rec is real, 1 if rec is null

			// now rec[propName] has either the current sequential ID, or one more advanced/ahead
			// lastId is either one less than rec[propName], or two/many less
			// we can loop, stuffing sequential nulls and incrementing lastId until lastId is one less than rec[propName]
			// then push rec with its current sequential ID and the outer loop is finished another iteration

			while(rec[propName] - lastId > 1){
				extraRec = {isNullStuffed};
				extraRec[propName] = ++lastId;
				out.push(extraRec);
			}

			out.push(rec);
			lastId = rec[propName];
		}
		return out;
	}

}