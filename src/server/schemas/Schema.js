import SchemaValidationTypeError from '../errors/SchemaValidationTypeError';

/**
 * Responsible for abstractly defining a Schema.
 *
 * @abstract
 * @class
 * @classdesc A Schema defines a model/table in a database.
 */
export default class Schema {
	/** @type {Object} Description of a record for the model of the same name as the implementing Schema class; note that records cannot store objects so use JSON.Stringify(). */
	rules;

	/** @type {String[]} An array of datatypes supported by the implementing Schema class; this is auto-built by #populateDatatypes(), which must be called in the implementing Schema class' constructor. */
	datatypes;

	constructor(){
		if(this.constructor === Schema){
			throw new Error('Schema is an abstract class and must be extended.');
		}
	}

	/**
	 * Responsible for validating a record, ensuring that it follows/matches the implementing Schema class.
	 *
	 * @param  {Record} rec          A Record object.
	 * @param  {Object} [rules=null] A subset of the rules during a recursive call.
	 *
	 * @throws {SchemaValidationTypeError}
	 *
	 * @return void
	 */
	validateRecord(rec, rules = null){
		if(rules === null) rules = this.rules;
		for(const [field, fieldRules] of Object.entries(rules)){
			let recVal = rec[field];
			let isDefinedRec = this.isDefinedRec(recVal);
			if(fieldRules.type == 'object' && typeof recVal == 'object'){
				this.validateRecord(recVal, rules[field].object);
				continue;
			}
			if(fieldRules.isRequired && !isDefinedRec){
				throw new SchemaValidationTypeError(`Field ${field} is required, encountered: ${recVal}.`);
			}
			if(isDefinedRec){
				if(
					(fieldRules.type == 'array' && !Array.isArray(recVal)) ||
					(fieldRules.type != 'array' && typeof recVal !== fieldRules.type)
				){
					throw new SchemaValidationTypeError(`Provided field ${field} should be of type ${fieldRules.type}; received ${recVal}.`);
				}
			}
			if(fieldRules.oneOf && (!isDefinedRec || !fieldRules.oneOf.includes(recVal))){
				throw new SchemaValidationTypeError(`Provided field ${field} should be one of: ${fieldRules.oneOf}; received ${recVal}.`);
			}
			if(fieldRules.subType && fieldRules.type == 'array' && isDefinedRec){
				recVal.forEach(
					e => {
						if(typeof e != fieldRules.subType) throw new SchemaValidationTypeError(`Provided array item ${e} is not of subtype ${fieldRules.subType}.`);
					}
				);
			}
		}
		for(const [col, ignore] of Object.entries(rec)){
			if(typeof rules[col] == 'undefined') {
				throw new SchemaValidationTypeError(`Unrecognized field encountered: ${col}.`);
			}
		}
	}

	/**
	 * Responsible for building a shell record according to the implementing Schema class.
	 *
	 * @param  {Object} [rules=null] A subset of the rules during a recursive call.
	 *
	 * @return {Record}
	 */
	getShell(rules = null){
		const rec = {};
		if(rules === null) rules = this.rules;
		for(const [field, fieldRules] of Object.entries(rules)){
			let isObject = fieldRules.type === 'object';
			rec[field] = fieldRules.defaultVal ||
						(isObject ? this.getShell(rules[field].object) : undefined);
		}
		return rec;
	}

	/**
	 * Responsible for determining whether a value is defined, for the sake of fields defined by the implementing Schema class;
	 * note that NULL is permitted for optional fields.
	 *
	 * @param  {*}  val  Any possible record value.
	 *
	 * @return {Boolean}
	 */
	isDefinedRec(val){
		if(typeof val == 'number' && this.datatypes.includes('number')){
			return !isNaN(val) && isFinite(val);
		}else if(typeof val == 'object' && Array.isArray(val)){
			return this.datatypes.includes('array');
		}
		else{
			return val === null || this.datatypes.includes(typeof val);
		}
	}

	/**
	 * Responsible for populating the datatypes property based on the existing rules property.
	 *
	 * @see #datatypes
	 * @see #rules
	 *
	 * @param  {Object} [rules=null] A subset of the rules during a recursive call.
	 */
	populateDatatypes(rules = null){
		if(rules === null) rules = this.rules;
		for(const [field, fieldRules] of Object.entries(rules)){
			let isObject = fieldRules.type === 'object';
			if(!isObject && !this.datatypes.includes(fieldRules.type)){
				this.datatypes.push(fieldRules.type);
			}
			if(isObject) this.populateDatatypes(rules[field].object);
		}
	}

	/**
	 * Responsible for scanning all root-level rules and validating/confirming that one and only one rule
	 * has isPrimary set to true; that one rule must have type set to number and isRequired also true;
	 * intended to be called in implementing class' constructor.
	 *
	 * @throws {SchemaValidationTypeError}
	 *
	 * @return void
	 */
	validatePrimary(){
		let primaryCount = 0;
		let isANumber = false;
		let isRequired = false;
		for(const [field, fieldRules] of Object.entries(this.rules)){
			if(fieldRules.isPrimary){
				primaryCount++;
				isANumber = fieldRules.type === 'number';
				isRequired = fieldRules.isRequired || isRequired;
			}
		}
		if(primaryCount !== 1){
			throw new SchemaValidationTypeError('one and only one root-level field should have isPrimary set to true.');
		}
		if(!isANumber){
			throw new SchemaValidationTypeError('primary field (isPrimary == true) should have \'type\' set to \'number\'.');
		}
		if(!isRequired){
			throw new SchemaValidationTypeError('primary field (isPrimary == true) should have isRequired set to true.');
		}
	}
}
