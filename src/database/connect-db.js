const path = require('path');

import simpleJSONDB from './hack-simple-json-db';
import '../env/load-env.js';

// determine dbPath based on whether or not there is a 'src/' followed by 'database/' in the path
let dbPath = path.parse(path.join(__dirname, `jsonDB/${process.env.DB_FILENAME}`));
const aDirParts = dbPath.dir.split(path.sep);
const iSrc = aDirParts.indexOf('src');
if(iSrc > -1 && aDirParts.indexOf('database') == iSrc + 1){
	aDirParts.splice(iSrc, 1);
	dbPath.dir=aDirParts.join(path.sep);
}
dbPath = path.format(dbPath);

// now connect the db with the correct path
const db = new simpleJSONDB(dbPath, {asyncWrite: false});

export {db as default};