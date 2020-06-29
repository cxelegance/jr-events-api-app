'use strict';

var bunyan = require('bunyan');

var logger = bunyan.createLogger({
	name: 'server.log',
	streams: [{
		level: bunyan.INFO,
		stream: process.stderr
	}]
});

module.exports = logger;