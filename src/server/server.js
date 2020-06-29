const path = require('path');
import express from 'express';

import apiEventsRouter from './routers/APIEventsRouter';
import apiEventRouter from './routers/APIEventRouter';
import apiRouter from './routers/APIRouter';
import apiErrorRouter from './routers/APIErrorRouter';
import logger from './logger';

const app = express();
const publicPath = path.join(__dirname, '..', 'public/');
const port = 3000; // 3000 is available on all OS

app.use(express.json());

app.use(/^\/api\/events/, apiRouter, apiEventsRouter, apiErrorRouter);
app.use(/^\/api\/event/, apiRouter, apiEventRouter, apiErrorRouter);
app.use(/^\/api/, apiRouter, apiErrorRouter);

app.use(express.static(publicPath));
app.get('*', (request, response) => {
	response.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => logger.info(`Server is up on server ${port}`));