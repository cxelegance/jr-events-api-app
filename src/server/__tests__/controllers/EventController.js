import Controller from '../../controllers/Controller';
import EventController from '../../controllers/EventController';
import ServiceFactory from '../../factories/ServiceFactory';
import {modelFactory} from '../../factories/ModelFactory';
import ServiceToAPIResponseMap from '../../maps/ServiceToAPIResponseMap';
import db from '../models/__mocks__/db';

const freshLimit = 5 * 60 * 1000; // 5 minutes
const masterUserID = 100;
const masterHashword = 'hey testing';
let serviceFactory;
let eventController;
let serviceToAPIResponseMap;

beforeEach(() => {
	serviceFactory = new ServiceFactory(modelFactory, db, freshLimit, masterUserID, masterHashword);
	serviceToAPIResponseMap = new ServiceToAPIResponseMap();
	eventController = new EventController(serviceFactory, serviceToAPIResponseMap);
});

test('EventController is instantiated correctly', () => {
	expect(eventController).toBeInstanceOf(EventController);
	expect(eventController).toBeInstanceOf(Controller);
	expect(eventController.serviceRoute).toBe('Event');
	expect(eventController.serviceFactory).toBeInstanceOf(ServiceFactory);
	expect(eventController.serviceToAPIResponseMap).toBeInstanceOf(ServiceToAPIResponseMap);
});