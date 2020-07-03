const fs = require('fs');

import simpleJSONDB from 'simple-json-db'; // v 1.2.2 !!!

// The following hack is to allow the consumer to await filewrites
simpleJSONDB.prototype.sync = function() {
	return new Promise(
		(resolve, reject) => {
			fs.writeFile(
				this.filePath,
				JSON.stringify(this.storage, null, 4),
				err => {
					if (err) reject(err);
					else resolve();
				}
			);
		}
	);
};

export {simpleJSONDB as default};