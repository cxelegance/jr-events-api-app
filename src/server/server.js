import dotenv from 'dotenv';
import {open} from 'lmdb-store';

import HTTPServer from './HTTPServer';
import {modelFactory} from './factories/ModelFactory';
import ServiceFactory from './factories/ServiceFactory';
import ControllerFactory from './factories/ControllerFactory';
import ServiceToAPIResponseMap from './maps/ServiceToAPIResponseMap';
import routes from './apiRoutes';

const dotenvResult = dotenv.config();
if(dotenvResult.error && process.env.NODE_ENV !== 'production') throw dotenvResult.error;

const dbOpener = {
	path: process.env.DB_PATH,
	options: {
		compression: process.env.DB_COMPRESSION
	},
	open: (path, options) => open({path, ...options})
};

const port = process.env.PORT || process.env.DEV_PORT;

const serviceFactory = new ServiceFactory(
	modelFactory,
	dbOpener,
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