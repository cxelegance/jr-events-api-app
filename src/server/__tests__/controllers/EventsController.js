import Controller from '../../controllers/Controller';
import EventsController from '../../controllers/EventsController';
import ServiceFactory from '../../factories/ServiceFactory';
import {modelFactory} from '../../factories/ModelFactory';
import ServiceToAPIResponseMap from '../../maps/ServiceToAPIResponseMap';
import db from '../models/__mocks__/db';

const freshLimit = 5 * 60 * 1000; // 5 minutes
const masterUserID = 100;
const masterHashword = 'hey testing';
let serviceFactory;
let eventsController;
let serviceToAPIResponseMap;

beforeEach(() => {
	serviceFactory = new ServiceFactory(modelFactory, db, freshLimit, masterUserID, masterHashword);
	serviceToAPIResponseMap = new ServiceToAPIResponseMap();
	eventsController = new EventsController(serviceFactory, serviceToAPIResponseMap);
});

test('EventsController is instantiated correctly', () => {
	expect(eventsController).toBeInstanceOf(EventsController);
	expect(eventsController).toBeInstanceOf(Controller);
	expect(eventsController.serviceRoute).toBe('Events');
	expect(eventsController.serviceFactory).toBeInstanceOf(ServiceFactory);
	expect(eventsController.serviceToAPIResponseMap).toBeInstanceOf(ServiceToAPIResponseMap);
});