import express from 'express';

import logger from '../logger';
import EventsModel from '../../database/models/EventsModel';

const router = express.Router();
const events = { // TODO remove this: make it: import EventsModel from '../../database/models/EventsModel';
	getTopRecord: () => {throw 'asdfa'},
	exceptions: {
		JREventsException: () => {}
	}
};
import eventsSchema from '../../database/schemas/Events.json';
const eventsModel = new EventsModel(eventsSchema);

router.use((req, res, next) => {
	logger.info('APIErrorRouter operating and terminating process');
	next();
});

router.all(
	'*',
	(request, response) => {
		var aEvent;
		logger.info('request for unknown URI'); // TODO WIP here, it is quietly failing on http://localhost:5000/help.json
		try{
			aEvent = eventsModel.read(0, 1);
		} catch (e){
			if (e instanceof events.exceptions.JREventsException) {
				aEvent = [{'id': ''}]; // no top record
			} else {
				logger.info('unknown error:');
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
		}
		response.status(404);
		response.json({
			'code': 404, // integer
			'status': 'error', // 'fail' 500 – 599; 'error' 400 – 499; else 'success'
			// message only for status 'error' or 'fail'
			'message': 'you want to "' + request.method + '" from an unhandled/unknown URI',
			'data': 'Exception', // if 'error' or 'fail' then the cause or exception name
			'links': [{
				'rel': 'help',
				'href': request.protocol + '://' + request.hostname + ':' + port + '/event/' + aEvent[0].id
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