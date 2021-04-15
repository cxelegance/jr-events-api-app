import dotenv from 'dotenv';
import {open} from 'lmdb-store';

import HTTPServer from './HTTPServer';
import {modelFactory} from './factories/ModelFactory';
import ServiceFactory from './factories/ServiceFactory';
import ControllerFactory from './factories/ControllerFactory';
import ServiceToAPIResponseMap from './maps/ServiceToAPIResponseMap';
import Route from './routes/Route';

const dotenvResult = dotenv.config();
if(dotenvResult.error && process.env.NODE_ENV !== 'production') throw dotenvResult.error;

const db = open({
    path: process.env.DB_PATH,
    // any options go here, we can turn on/off compression like this:
    compression: process.env.DB_COMPRESSION
});

const port = process.env.PORT || process.env.DEV_PORT;

// Order from top to bottom: first match to last
const routes = [
	new Route(/^\/api\/events\/?$/i, 'Events'),
	new Route(/^\/api\/event\/(?<id>[^\/]+?)\/?$/i, 'Event'),
	new Route(/^\/api\/event\/?$/i, 'Event'),
	new Route(/^\/api\/auth\/(?<id>[^\/]+?)\/?$/i, 'Auth'),
	new Route(/^\/api\/auth\/?$/i, 'Auth'),
	new Route(/^\/api\/?/i, undefined) // discoverability on bad route
	// new Route(/^\/index\.html$/, 'App'),
	// new Route(/^\/$/, 'App'),
	// new Route('*') // no controller defined; default action
]; // Don't forget to update the test for HTTPServer.js!

const serviceFactory = new ServiceFactory(
	modelFactory,
	db,
	parseInt(process.env.FRESHLIMIT, 10),
	process.env.MASTERUSER,
	process.env.MASTERPASS
);

const serviceToAPIResponseMap = new ServiceToAPIResponseMap();
const controllerFactory = new ControllerFactory(serviceFactory, serviceToAPIResponseMap);
const httpServer = new HTTPServer(port, routes, controllerFactory);

/*
 * Do NOT leave the log level on 'debug' or 'trace'! Request params will be logged! Think: passwords exposed.
 * Leave it on 'info'.
 */
httpServer.log.level(process.env.LOGGER_LEVEL);

// Do NOT leave these in!
// httpServer.setFakeSecure(true);
// httpServer.setFakeAuthorized(true);

httpServer.listen();

export {httpServer as default};