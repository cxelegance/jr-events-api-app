import EventService from '../../services/EventService';
import Service from '../../services/Service';
import EventsModel from '../../models/EventsModel';
import {modelFactory} from '../../factories/ModelFactory';
import db from '../models/__mocks__/db';
import {eventRecsValid} from '../fixtures/eventRecords';

import ErrorServiceResponse from '../../responses/ErrorServiceResponse';
import SuccessServiceResponse from '../../responses/SuccessServiceResponse';

import NoRecordsFoundError from '../../errors/NoRecordsFoundError';
import RecordExistsError from '../../errors/RecordExistsError';
import InsecureOperationError from '../../errors/InsecureOperationError';
import ConfirmAuthorizationError from '../../errors/ConfirmAuthorizationError';
import RecordTypeError from '../../errors/RecordTypeError';

let eventService, eventServiceInsecure;

beforeEach(() => {
	eventService = new EventService(modelFactory, db, true);
	eventServiceInsecure = new EventService(modelFactory, db, false);
});

describe('eventService instantiation is correct:', () => {

	test('is an instance of EventService and Service', () => {
		expect(eventService instanceof EventService).toBe(true);
		expect(eventService instanceof Service).toBe(true);
	});

	test('modelType property is built correctly', () => {
		expect(eventService.modelType).toBe('Events');
	});

	test('modelFactory property is built correctly', () => {
		return eventService.getModel().then(
			model => model instanceof EventsModel
		).then(
			isEventsModel => expect(isEventsModel).toBe(true)
		);
	});

	test('secureMethods property is built correctly', () => {
		expect(eventService.secureMethods).toBeInstanceOf(Array);
		expect(eventService.secureMethods.length).toBe(3);
	});

	test('throwIfInsecure method throws when parameter is missing or of wrong type', () => {
		expect(
			() => eventService.throwIfInsecure()
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
		expect(
			() => eventService.throwIfInsecure({})
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
		expect(
			() => eventService.throwIfInsecure(3)
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
		expect(
			() => eventService.throwIfInsecure('hi')
		).toThrow(new Error('throwIfInsecure() must be passed the name of the method/function you are calling from.'));
	});

});

describe('get method', () => {

	test('returns ErrorServiceResponse with NoRecordsFoundError', () => {
		return eventService.getModel().then(
			eventsModel => new Promise( resolve => resolve(eventsModel.db.getRangeReturns([])) )
		).then(
			() => eventService.get({})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(NoRecordsFoundError);
			}
		);
	});

	test('returns SuccessServiceResponse with record', () => {
		const recs = [{key: 1, val: eventRecsValid.get(1)}];
		return eventService.getModel().then(
			eventsModel => new Promise( resolve => resolve(eventsModel.db.getRangeReturns(recs)) )
		).then(
			() => eventService.get({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([eventRecsValid.get(1)]);
			}
		);
	});

	test('returns SuccessServiceResponse with record even when isSecure is false', () => {
		const recs = [{key: 1, val: eventRecsValid.get(1)}];
		return eventServiceInsecure.getModel().then(
			eventsModel => new Promise( resolve => resolve(eventsModel.db.getRangeReturns(recs)) )
		).then(
			() => eventServiceInsecure.get({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toEqual([eventRecsValid.get(1)]);
			}
		);
	});

});

describe('put method', () => {

	test('returns InsecureOperationError when isSecure is false', () => {
		return eventServiceInsecure.getModel().then(
			eventsModel => new Promise( resolve => resolve(eventsModel.db.getReturns(undefined)) )
		).then(
			() => eventServiceInsecure.put({ event: eventRecsValid.get(1) })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(InsecureOperationError);
			}
		);
	});

	test('returns ErrorServiceResponse with NoRecordsFoundError', () => {
		return eventService.getModel().then(
			eventsModel => new Promise( resolve => resolve(eventsModel.db.getReturns(undefined)) )
		).then(
			() => eventService.put({ records: [eventRecsValid.get(1)] })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(NoRecordsFoundError);
			}
		)
	});

	test('returns ErrorServiceResponse with Error', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true);
					eventsModel.db.putResolves(false);
					resolve();
				}
			)
		).then(
			() => eventService.put({ event: eventRecsValid.get(1) })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(Error);
			}
		);
	});

	test('returns SuccessServiceResponse with record ID', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true);
					eventsModel.db.putResolves(true);
					resolve();
				}
			)
		).then(
			() => eventService.put({ records: [eventRecsValid.get(1)] })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}

		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toBe(1);
			}
		);
	});

});

describe.only('post method', () => {

	let recs;
	beforeEach(() => {
		recs = [{key: 1, val: eventRecsValid.get(1)}, {key: 2, val: eventRecsValid.get(2)}];
	});

	test('returns InsecureOperationError when isSecure is false', () => {
		return eventServiceInsecure.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true)
					eventsModel.db.getRangeReturns(recs)
					resolve();
				}
			)
		).then(
			() => eventServiceInsecure.post({ event: eventRecsValid.get(3) })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(InsecureOperationError);
			}
		);
	});

	test('returns ErrorServiceResponse with RecordTypeError', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true)
					eventsModel.db.getRangeReturns(recs)
					resolve();
				}
			)
		).then(
			() => eventService.post({ records: eventRecsValid.get(3) })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(RecordTypeError);
			}
		);
	});

	test('returns ErrorServiceResponse with RecordTypeError', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true)
					eventsModel.db.getRangeReturns(recs)
					resolve();
				}
			)
		).then(
			() => eventService.post({ records: ['this will not work'] })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(RecordTypeError);
			}
		);
	});

	test.only('returns ErrorServiceResponse with RecordExistsError', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true)
					eventsModel.db.getRangeReturns(recs)
					resolve();
				}
			)
		).then(
			() => {
				const recNoID = eventRecsValid.get(3);
				delete recNoID.eventID;
				return eventService.post({ records: [recNoID] })
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(RecordExistsError);
			}
		);
	});

	test('returns ErrorServiceResponse with Error', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(undefined);
					eventsModel.db.getRangeReturns(recs);
					eventsModel.db.putResolves(false);
					resolve();
				}
			)
		).then(
			() => eventService.post({ event: eventRecsValid.get(3) })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(Error);
			}
		);
	});

	test('returns SuccessServiceResponse with record ID', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(undefined);
					eventsModel.db.getRangeReturns(recs);
					eventsModel.db.putResolves(true);
					resolve();
				}
			)
		).then(
			() => eventService.post({ records: [eventRecsValid.get(3)] })
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toBe(3);
			}
		);
	});

});

describe('delete method', () => {

	let recs;
	beforeEach(() => {
		recs = [{key: 1, val: eventRecsValid.get(1)}, {key: 2, val: eventRecsValid.get(2)}];
	});

	test('returns InsecureOperationError when isSecure is false', () => {
		return eventServiceInsecure.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(undefined)
					resolve();
				}
			)
		).then(
			() => eventServiceInsecure.delete({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(InsecureOperationError);
			}
		);
	});

	test('returns ErrorServiceResponse with NoRecordsFoundError', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(undefined)
					resolve();
				}
			)
		).then(
			() => eventService.delete({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(NoRecordsFoundError);
			}
		);
	});

	test('returns ErrorServiceResponse with Error', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true);
					eventsModel.db.removeResolves(false);
					resolve();
				}
			)
		).then(
			() => eventService.delete({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				return expect(response.error).toBeInstanceOf(Error);
			}
		);
	});

	test('returns SuccessServiceResponse with record ID', () => {
		return eventService.getModel().then(
			eventsModel => new Promise(
				resolve => {
					eventsModel.db.getReturns(true);
					eventsModel.db.removeResolves(true);
					resolve();
				}
			)
		).then(
			() => eventService.delete({id: 1})
		).then(
			response => {
				expect(response).toBeInstanceOf(ErrorServiceResponse);
				expect(response.error).toBeInstanceOf(ConfirmAuthorizationError);
				return response.error.proceed();
			}
		).then(
			response => {
				expect(response).toBeInstanceOf(SuccessServiceResponse);
				return expect(response.data).toBe(1);
			}
		);
	});

});