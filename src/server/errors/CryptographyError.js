/**
 * Responsible for creating a new CryptographyError.
 *
 * @class
 * @classdesc Throw CryptographyError when a cryptographic process fails internally.
 */
export default class CryptographyError extends Error {
	name = 'CryptographyError';
}