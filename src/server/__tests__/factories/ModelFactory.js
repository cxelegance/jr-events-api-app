import AuthModel from '../../models/AuthModel';
import EventsModel from '../../models/EventsModel';
import {modelFactory} from '../../factories/ModelFactory';
import db from '../models/__mocks__/db';

test('authModel is created successfully', () => {
	let authModel;
	return modelFactory.get('Auth', db, undefined).then(
		built => authModel = built
	).then(
		() => expect(authModel instanceof AuthModel).toBe(true)
	);
});

test('eventsModel is created successfully', () => {
	let eventsModel;
	return modelFactory.get('Events', db, undefined).then(
		built => eventsModel = built
	).then(
		() => expect(eventsModel instanceof EventsModel).toBe(true)
	);
});