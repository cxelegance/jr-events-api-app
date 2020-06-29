const bunyan = require('bunyan');

const logger = bunyan.createLogger({
	name: 'server.log',
	streams: [{
		level: bunyan.INFO,
		stream: process.stderr
	}]
});

module.exports = logger;