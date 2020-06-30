const path = require('path');
import simpleJSONDB from 'simple-json-db';

const dbPath = path.join(__dirname, 'jsonDB/Events.json');
const db = new simpleJSONDB(dbPath, {asyncWrite: true});

export {db as default};