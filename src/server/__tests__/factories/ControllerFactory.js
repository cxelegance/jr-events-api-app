import AuthController from '../../controllers/AuthController';
import EventController from '../../controllers/EventController';
import EventsController from '../../controllers/EventsController';
import {modelFactory} from '../../factories/ModelFactory';
import ServiceFactory from '../../factories/ServiceFactory';
import ControllerFactory from '../../factories/ControllerFactory';
import ServiceToAPIResponseMap from '../../maps/ServiceToAPIResponseMap';
import db from '../models/__mocks__/db';

const isSecure = true;
const freshLimit = 5 * 60 * 1000; // 5 minutes
const masterUserID = "100";
const masterHashword = 'hey testing';
let serviceFactory, serviceToAPIResponseMap, controllerFactory;

beforeEach(() => {
	serviceFactory = new ServiceFactory(modelFactory, db, freshLimit, masterUserID, masterHashword);
	serviceToAPIResponseMap = new ServiceToAPIResponseMap();
	controllerFactory = new ControllerFactory(serviceFactory, serviceToAPIResponseMap);
});

test('authController is created successfully', () => {
	const myController = controllerFactory.get(
		'Auth'
	);
	return expect(myController).resolves.toBeInstanceOf(AuthController);
});

test('eventController is created successfully', () => {
	const myController = controllerFactory.get(
		'Event'
	);
	return expect(myController).resolves.toBeInstanceOf(EventController);
});

test('eventsController is created successfully', () => {
	const myController = controllerFactory.get(
		'Events'
	);
	return expect(myController).resolves.toBeInstanceOf(EventsController);
});