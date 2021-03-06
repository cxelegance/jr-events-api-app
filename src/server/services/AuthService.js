import Service from './Service';
import {isMatch} from '../lib/Hashword';
import AuthenticationFailedError from '../errors/AuthenticationFailedError';
import ReauthenticationRequiredError from '../errors/ReauthenticationRequiredError';
import AuthRecord from '../records/AuthRecord';
import NoRecordsFoundError from '../errors/NoRecordsFoundError';
import ParameterTypeError from '../errors/ParameterTypeError';

/**
 * Responsible for defining the AuthService.
 *
 * @class
 * @classdesc The AuthService provides Auth operations to a consumer.
 */
export default class AuthService extends Service { // FINAL

	/** @type {Number} Number of milliseconds that an AuthRecord is valid for. */
	#freshLimit;

	/** @type {String} The userID for the master user. */
	#masterUserID;

	/** @type {String} The hashword for the master user. */
	#masterHashword;

	/** @type {*} Exists solely for testing purposes without compromising the system. */
	testingOnlyPropOnTheService;

	/**
	 * @param {ModelFactory}  modelFactory   See Service.
	 * @param {Object}        db             See Service.
	 * @param {Boolean}       isSecure       See Service.
	 * @param {Number}        freshLimit     For setting the internal property of the same name.
	 * @param {String}        masterUserID   For setting the internal property of the same name.
	 * @param {String}        masterHashword For setting the internal property of the same name.
	 */
	constructor(modelFactory, db, isSecure, freshLimit, masterUserID, masterHashword){
		super(modelFactory, db, isSecure);
		this.modelType = 'Auth';
		this.serviceName = 'Auth';
		if(this.constructor !== AuthService){
			throw new Error('AuthService is a final class and cannot be extended.');
		}
		this.#freshLimit = freshLimit; // final
		this.#masterUserID = masterUserID; // final
		this.#masterHashword = masterHashword; // final
		this.secureMethods.push('post');
		this.allMethods.push('get', 'post');
		// delete is not here because get calls it, and these are simple auth records, not real data
	}

	/**
	 * Responsible for getting an AuthRecord that's still fresh.
	 *
	 * @see AuthRecord
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 * @see Service#throwIfInsecure
	 * @see #isFresh
	 * @see ReauthenticationRequiredError
	 *
	 * @param  {Object} p           Params are wrapped in this object.
	 * @param  {Number} p.id        The ID of a specific record to obtain; this is third priority.
	 * @param  {String} p.userID    The userID of a specific user to obtain record for; this is second priority.
	 * @param  {String} p.authToken The authToken of a specific record to obtain; this is first priority.
	 *
	 *
	 * @return {Promise} The promise resolves with AuthRecord[] in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	get({id, authToken, userID}){
		let fieldName, fieldVal;
		return this.throwIfInsecure('get').then(
			() => {
				if(authToken){
					if(typeof authToken != 'string'){
						throw new ParameterTypeError('authToken was provided but was not a string.');
					}
					fieldName = 'authToken';
					fieldVal = authToken;
				}else if(userID){
					if(typeof userID != 'string' || !isFinite(userID) || parseInt(userID, 10) + '' != userID){
						throw new ParameterTypeError('userID was provided but was not a string-wrapped integer.');
					}
					fieldName = 'userID';
					fieldVal = userID;
				}else{
					if(typeof id != 'number' || !isFinite(id) || parseInt(id, 10) + '' != id){
						throw new ParameterTypeError('id was provided but was not an integer.');
					}
					fieldName = 'authID'
					fieldVal = id;
				}
				return this.getModel();
			}
		).then(
			model => model.read(1)
		).then(
			recs => recs.filter( rec => rec[fieldName] === fieldVal )
		).then(
			([rec]) => {
				if(!rec) throw new NoRecordsFoundError();
				if(this.#isFresh(rec)){
					return [rec];
				}else{
					return this.delete(rec.authID).then(
						() => {
							throw new ReauthenticationRequiredError(`Reauthentication is required; the time limit is ${this.#freshLimit} ms.`);
						}
					);
				}
			}
		).then(
			data => this.generateSuccess('get', data, {id, authToken, userID})
		).catch(
			e => this.generateError('get', e, {id, authToken, userID})
		);
	}

	/**
	 * Responsible for creating an AuthRecord; you should #get first to be sure one doesn't exist!
	 *
	 * @see AuthRecord
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 * @see Service#throwIfInsecure
	 * @see #isMatch
	 * @see #generateAuthToken
	 * @see #masterUserID
	 * @see #masterHashword
	 *
	 * @param  {Object} p           Params are wrapped in this object.
	 * @param  {String} p.plainword A plaintext password.
	 *
	 * @return {Promise} The promise resolves with {id, token} in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	post({plainword}){
		const rec = new AuthRecord();
		return this.throwIfInsecure('post').then(
			() => {
				if(typeof plainword != 'string') throw new ParameterTypeError('expecting password to be a string.');
			}
		).then(
			() => this.#isMatch(plainword, this.#masterHashword)
		).then(
			isMatch => {
				if(isMatch){
					rec.createdAt = Date.now();
					rec.userID = this.#masterUserID;
				}else{
					throw new AuthenticationFailedError('Authentication has failed.');
				}
			}
		).then(
			() => this.getNextId('authID')
		).then(
			id => rec.authID = id
		).then(
			() => this.#generateAuthToken()
		).then(
			token => rec.authToken = token
		).then(
			() => this.getModel()
		).then(
			model => model.create(rec)
		).then(
			id => {
				this.setNextId(id + 1);
				return this.generateSuccess('post', {id, authToken: rec.authToken}); // do NOT return the params.plainword sent as it is sensitive
			}
		).catch(
			e => this.generateError('post', e) // do NOT return the params.plainword sent as it is sensitive
		);
	}

	/**
	 * Responsible for deleting an AuthRecord.
	 *
	 * @see AuthRecord
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 * @see Service#throwIfInsecure
	 *
	 * @param  {Object} p    Params are wrapped in this object.
	 * @param  {Number} p.id The ID of the record to delete.
	 *
	 * @return {Promise} The promise resolves with the ID of the deleted record in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	delete({id}){
		return this.throwIfInsecure('delete').then(
			() => this.getModel()
		).then(
			model => model.delete(id)
		).then(
			data => this.generateSuccess('delete', data, {id})
		).catch(
			e => this.generateError('delete', e, {id})
		);
	}

	/**
	 * Responsible for determining whether an AuthRecord is still fresh.
	 *
	 * @see #freshLimit
	 *
	 * @param  {AuthRecord} rec The AuthRecord to investigate.
	 *
	 * @return {Boolean}
	 */
	#isFresh(rec){
		return rec.createdAt > Date.now() - this.#freshLimit;
	}

	/**
	 * Responsible for generating a unique authToken.
	 *
	 * @see {@link https://www.npmjs.com/package/uid}
	 *
	 * @return {Promise} The promise resolves to a unique authToken (string).
	 */
	#generateAuthToken(){
		// uniqueness is not guaranteed but currently this is a one-user system: one token is required only!
		return import(
			'uid'
		).then(
			imported => imported.default
		).then(
			uid => uid(20)
		);
	}

	/**
	 * Responsible for determining if a proposed password matches a master one; internal use only.
	 *
	 * @param  {String}  proposed A proposed plaintext password.
	 * @param  {String}  master   The master hashword.
	 *
	 * @return {Promise}          The promise resolves with a Boolean; rejects with CryptographyError.
	 */
	#isMatch(proposed, master){
		return isMatch(proposed, master);
	}

}