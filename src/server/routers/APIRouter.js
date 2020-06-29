import express from 'express';

import logger from '../logger';

const router = express.Router();

router.use((req, res, next) => {
	logger.info('APIRouter operating');
	next();
});

export {router as default};