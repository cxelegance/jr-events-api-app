// import {selfTest} from '../../lib/Hashword';

import AuthService from '../../services/AuthService';
import Service from '../../services/Service';
import AuthModel from '../../models/AuthModel';
import {modelFactory} from '../../factories/ModelFactory';
import db from '../models/__mocks__/db';
import {authRecsValid} from '../fixtures/authRecords';

import ErrorServiceResponse from '../../responses/ErrorServiceResponse';
import SuccessServiceResponse from '../../responses/SuccessServiceResponse';

import NoRecordsFoundError from '../../errors/NoRecordsFoundError';
import RecordExistsError from '../../errors/RecordExistsError';
import InsecureOperationError from '../../errors/InsecureOperationError';
import AuthenticationFailedError from '../../errors/AuthenticationFailedError';
import ReauthenticationRequiredError from '../../errors/ReauthenticationRequiredError';
import ParameterTypeError from '../../errors/ParameterTypeError';

let authService, authServiceInsecure;
const incorrectPassword = 'hey';
const correctPassword = 'ed809121b93e4ecab38659e77f5aa3ad';
const masterHashword = '$2b$10$qhSeOdFQn7QQrDHfPnKe3Ofmiuo9TI.3sdV1Cm4BchUs1tfkVUOa6'; // salted and hashed correctPassword
const freshLimit = 3 * 1000; // 5 seconds
const masterUserID = "1";

const waitPromise = ms => new Promise(
	resolve => setTimeout(resolve, ms)
);

beforeEach(() => {
	authService = new AuthService(modelFactory, db, true, freshLimit, masterUserID, masterHashword);
	authServiceInsecure = new AuthService(modelFactory, db, false, freshLimit, masterUserID, masterHashword);
});

// test.skip('Hashword selfTest passes', () => {
// 	return expect(selfTest()).resolves.toBe(true);
// });

describe('authService instantiation is correct:', () => {

	test('is an instance of AuthService and Service', () => {
		expect(authService instanceof AuthService).toBe(true);
		expect(authService instanceof Service).toBe(true);
	});

	test('modelType property is built correctly', () => {
		expect(authService.modelType).toBe('Auth');
	});

	test('modelFactory property is built correctly', () => {
		return authService.getModel().then(
			model => model instanceof AuthModel
		).then(
			isAuthModel => expect(isAuthModel).toBe(true)
		);
	});

	test('secureMethods property is built correctly', () => {
		expect(authService.secureMethods).toBeInstanceOf(Array);
		expect(authService.secureMethods.length).toBe(1);
	});

	test('throwIfInsecure method throws when parameter is missing or of wrong type', () => {
		expect(
			() => authService.throwIfInsecure()
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
		expect(
			() => authService.throwIfInsecure({})
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
		expect(
			() => authService.throwIfInsecure(3)
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
		expect(
			() => authService.throwIfInsecure('hi')
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
	});

});

describe('get method', () => {

	test('returns ErrorServiceResponse with NoRecordsFoundError', () => {
		return authService.getModel().then(
			authModel => new Promise( resolve => resolve(authModel.db.getRangeReturns([])) )
		).then(
			() => authService.get({})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(ParameterTypeError);
			}
		);
	});

	test('returns SuccessServiceResponse with record when searching by userID', () => {
		const recs = [{key: 1, value: authRecsValid.get(1)}];
		recs[0].value.createdAt = Date.now();
		return authService.getModel().then(
			authModel => new Promise( resolve => resolve(authModel.db.getRangeReturns(recs)) )
		).then(
			() => authService.get({userID: recs[0].value.userID})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([authRecsValid.get(1)]);
			}
		);
	});

	test('returns SuccessServiceResponse with record when searching by authToken', () => {
		const recs = [{key: 1, value: authRecsValid.get(1)}];
		recs[0].value.createdAt = Date.now();
		return authService.getModel().then(
			authModel => new Promise( resolve => resolve(authModel.db.getRangeReturns(recs)) )
		).then(
			() => authService.get({authToken: recs[0].value.authToken})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([authRecsValid.get(1)]);
			}
		);
	});

	test('returns SuccessServiceResponse with record even when isSecure is false', () => {
		const recs = [{key: 1, value: authRecsValid.get(1)}];
		recs[0].value.createdAt = Date.now();
		return authServiceInsecure.getModel().then(
			authModel => new Promise( resolve => resolve(authModel.db.getRangeReturns(recs)) )
		).then(
			() => authServiceInsecure.get({userID: recs[0].value.userID})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([authRecsValid.get(1)]);
			}
		);
	});

	test('returns ErrorServiceResponse with ReauthenticationRequiredError', () => {
		const recs = [{key: 1, value: authRecsValid.get(1)}];
		return authService.getModel().then(
			authModel => new Promise( resolve => resolve(authModel.db.getRangeReturns(recs)) )
		).then(
			() => waitPromise(freshLimit)
		).then(
			() => authService.get({userID: "1"})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(ReauthenticationRequiredError);
			}
		);
	});

});

describe('post method', () => {

	let recs;
	beforeEach(() => {
		recs = [{key: 1, value: authRecsValid.get(1)}, {key: 2, value: authRecsValid.get(2)}];
	});

	test('returns InsecureOperationError when isSecure is false', () => {
		return authServiceInsecure.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(true)
					authModel.db.getRangeReturns(recs)
					resolve();
				}
			)
		).then(
			() => authServiceInsecure.post({plainword: incorrectPassword})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(InsecureOperationError);
			}
		);
	});

	test('returns ErrorServiceResponse with RecordExistsError', () => {
		return authService.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(true)
					authModel.db.getRangeReturns(recs)
					resolve();
				}
			)
		).then(
			() => authService.post({plainword: correctPassword})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(RecordExistsError);
			}
		);
	});

	test('returns ErrorServiceResponse with Error', () => {
		return authService.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(undefined);
					authModel.db.getRangeReturns(recs);
					authModel.db.putResolves(false);
					resolve();
				}
			)
		).then(
			() => authService.post({plainword: correctPassword})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(Error);
			}
		);
	});

	test('returns SuccessServiceResponse with record ID', () => {
		return authService.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(undefined);
					authModel.db.getRangeReturns(recs);
					authModel.db.putResolves(true);
					resolve();
				}
			)
		).then(
			() => authService.post({plainword: correctPassword})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				expect(response.data.authToken).toEqual(expect.stringMatching(/^\w*$/gm));
				return expect(response.data.id).toBe(3);

			}
		);
	});

	test('returns ErrorServiceResponse with AuthenticationFailedError', () => {
		return authService.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(undefined);
					authModel.db.getRangeReturns(recs);
					authModel.db.putResolves(true);
					resolve();
				}
			)
		).then(
			() => authService.post({plainword: incorrectPassword})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(AuthenticationFailedError);
			}
		);
	});

});

describe('delete method', () => {

	let recs;
	beforeEach(() => {
		recs = [{key: 1, value: authRecsValid.get(1)}, {key: 2, value: authRecsValid.get(2)}];
	});

	test('returns ErrorServiceResponse with NoRecordsFoundError', () => {
		return authService.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(undefined)
					resolve();
				}
			)
		).then(
			() => authService.delete({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(NoRecordsFoundError);
			}
		);
	});

	test('returns ErrorServiceResponse with Error', () => {
		return authService.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(true);
					authModel.db.removeResolves(false);
					resolve();
				}
			)
		).then(
			() => authService.delete({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(Error);
			}
		);
	});

	test('returns SuccessServiceResponse with record ID', () => {
		return authService.getModel().then(
			authModel => new Promise(
				resolve => {
					authModel.db.getReturns(true);
					authModel.db.removeResolves(true);
					resolve();
				}
			)
		).then(
			() => authService.delete({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toBe(1);
			}
		);
	});

});