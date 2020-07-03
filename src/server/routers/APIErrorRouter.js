import express from 'express';

import '../../env/load-env.js';
import logger from '../logger';
import EventsModel from '../../database/models/Events';
import eventsSchema from '../../database/schemas/Events.json';

const router = express.Router();
const port = process.env.PORT; // 3000 is available on all OS
const eventsModel = new EventsModel(eventsSchema);

router.use((req, res, next) => {
	logger.info('APIErrorRouter operating and terminating process');
	next();
});

router.all(
	'*',
	(request, response) => {
		let topEvent;
		logger.info('request for unknown URI');
		try{
			topEvent = eventsModel.read(0, 1);
		} catch (e){
			if(e instanceof TypeError){
				logger.info('TypeError thrown by EventsModel');
			}else{
				logger.info('unknown error');
			}
			logger.error(e);
			response.status(520);
			response.json({
				'code': 520, // integer
				'status': 'fail', // 'fail' 500 – 599; 'error' 400 – 499; else 'success'
				// message only for status 'error' or 'fail'
				'message': 'an unknown error has been logged to the server',
				'data': 'Exception' // if 'error' or 'fail' then the cause or exception name
			});
				return;
		}
		response.status(404);
		response.json({
			'code': 404, // integer
			'status': 'error', // 'fail' 500 – 599; 'error' 400 – 499; else 'success'
			// message only for status 'error' or 'fail'
			'message': `you want to "${request.method}" from an unhandled/unknown URI`,
			'data': 'Exception', // if 'error' or 'fail' then the cause or exception name
			'links': [{
				'rel': 'help',
				'href': request.protocol + '://' + request.hostname + ':' + port + '/event/' + (topEvent ? topEvent[0].id : 0)
			}, {
				'rel': 'help',
				'href': request.protocol + '://' + request.hostname + ':' + port + '/events'
			}, {
				'rel': 'help',
				'href': request.protocol + '://' + request.hostname + ':' + port + '/events/2'
			}, {
				'rel': 'help',
				'href': request.protocol + '://' + request.hostname + ':' + port + '/events/2-8'
			}]
		});
	}
);

export {router as default};