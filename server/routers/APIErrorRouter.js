'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _logger = require('../logger');

var _logger2 = _interopRequireDefault(_logger);

var _EventsModel = require('../../database/models/EventsModel');

var _EventsModel2 = _interopRequireDefault(_EventsModel);

var _Events = require('../../database/schemas/Events.json');

var _Events2 = _interopRequireDefault(_Events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();
var events = { // TODO remove this: make it: import EventsModel from '../../database/models/EventsModel';
	getTopRecord: function getTopRecord() {
		throw 'asdfa';
	},
	exceptions: {
		JREventsException: function JREventsException() {}
	}
};

var eventsModel = new _EventsModel2.default(_Events2.default);

router.use(function (req, res, next) {
	_logger2.default.info('APIErrorRouter operating and terminating process');
	next();
});

router.all('*', function (request, response) {
	var aEvent;
	_logger2.default.info('request for unknown URI'); // TODO WIP here, it is quietly failing on http://localhost:5000/help.json
	try {
		aEvent = eventsModel.read(0, 1);
	} catch (e) {
		if (e instanceof events.exceptions.JREventsException) {
			aEvent = [{ 'id': '' }]; // no top record
		} else {
			_logger2.default.info('unknown error:');
			_logger2.default.error(e);
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
});

exports.default = router;