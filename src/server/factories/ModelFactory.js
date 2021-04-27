/**
 * Responsible for defining a ModelFactory.
 *
 * @class
 * @classdesc A ModelFactory builds models for database operations.
 */
export default class ModelFactory {

	/**
	 * Responsible for getting a newly built model of a specified type.
	 *
	 * @see Model
	 *
	 * @param  {String} type    E.g. Auth, Events; prefixes for AuthModel, EventsModel, etc.
	 * @param  {Object} db      A database object.
	 * @param  {String} version E.g. v2, v3, v4; must match the class naming structure for Services, Models, Schema, etc.
	 *
	 * @return {Promise}        Resolves with a newly built model.
	 */
	get(type, db, version){
		const typeModelVersion = `${type}Model` + ( version ? (`_v_${version}`) : '' );
		const typeSchemaVersion = `${type}Schema` + ( version ? (`_v_${version}`) : '' );
		let schemaClass, modelClass;
		return import(
			`../schemas/${typeSchemaVersion}`
		).then(
			imported => {
				schemaClass = imported.default;
				return import(`../models/${typeModelVersion}`);
			}
		).then(
			imported => modelClass = imported.default
		).then(
			() => new modelClass(new (schemaClass)(), db.open(db.path += `-${type}`, db.options))
		);
	}

}

export const modelFactory = new ModelFactory();