/**
 * Responsible for mixing the props and methods directly on the prototype of a mixin class
 * into the prototype of a target class, overriding any duplication. The target class can
 * then be used to instantiate or can be extended. The mixin class will not appear in the prototype chain.
 *
 * @param  {Class} mixinClass  Has the properties and methods desired for addition.
 * @param  {Class} parentClass Will be extended and the new prototype will receive the additional properties and methods.
 *
 * @return {Class}             A brand new class based on parentClass with the additions from mixinClass.
 */
export default (mixinClass, parentClass) => {
	const o = {};
	o.mixedInClass = class extends parentClass {};
	o.propsToAdd = Object.getOwnPropertyNames(mixinClass.prototype); // only what is defined directly on the prototype!
	for(const propName of o.propsToAdd){
		if(propName !== 'constructor'){
			o.mixedInClass.prototype[propName] = mixinClass.prototype[propName];
		}
	}
	return o.mixedInClass;
};