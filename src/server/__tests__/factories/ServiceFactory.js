import AuthService from '../../services/AuthService';
import EventService from '../../services/EventService';
import EventsService from '../../services/EventsService';
import {modelFactory} from '../../factories/ModelFactory';
import ServiceFactory from '../../factories/ServiceFactory';
import db from '../models/__mocks__/db';

const isSecure = true;
const freshLimit = 5 * 60 * 1000; // 5 minutes
const masterUserID = "100";
const masterHashword = 'hey testing';
let serviceFactory;

beforeEach(() => {
	serviceFactory = new ServiceFactory(modelFactory, db, freshLimit, masterUserID, masterHashword);
});

test('authService is created successfully', () => {
	let authService;
	return serviceFactory.get(
		'Auth', undefined, isSecure
	).then(
		built => authService = built
	).then(
		() => expect(authService instanceof AuthService).toBe(true)
	);
});

test('eventService is created successfully', () => {
	let eventService;
	return serviceFactory.get(
		'Event', undefined, isSecure
	).then(
		built => eventService = built
	).then(
		() => expect(eventService instanceof EventService).toBe(true)
	);
});

test('eventsService is created successfully', () => {
	let eventsService;
	return serviceFactory.get(
		'Events', undefined, isSecure
	).then(
		built => eventsService = built
	).then(
		() => expect(eventsService instanceof EventsService).toBe(true)
	);
});