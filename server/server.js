'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _APIEventsRouter = require('./routers/APIEventsRouter');

var _APIEventsRouter2 = _interopRequireDefault(_APIEventsRouter);

var _APIEventRouter = require('./routers/APIEventRouter');

var _APIEventRouter2 = _interopRequireDefault(_APIEventRouter);

var _APIRouter = require('./routers/APIRouter');

var _APIRouter2 = _interopRequireDefault(_APIRouter);

var _APIErrorRouter = require('./routers/APIErrorRouter');

var _APIErrorRouter2 = _interopRequireDefault(_APIErrorRouter);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');


var app = (0, _express2.default)();
var publicPath = path.join(__dirname, '..', 'public/');
var port = 3000; // 3000 is available on all OS

app.use(_express2.default.json());

app.use(/^\/api\/events/, _APIRouter2.default, _APIEventsRouter2.default, _APIErrorRouter2.default);
app.use(/^\/api\/event/, _APIRouter2.default, _APIEventRouter2.default, _APIErrorRouter2.default);
app.use(/^\/api/, _APIRouter2.default, _APIErrorRouter2.default);

app.use(_express2.default.static(publicPath));
app.get('*', function (request, response) {
	response.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, function () {
	return _logger2.default.info('Server is up on server ' + port);
});