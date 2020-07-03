#! /bin/bash

yarn run build-server
yarn run build-database
rsync -vrt ./src/database/schemas ./database/
rsync -vrt ./src/env ./
mkdir database/jsonDB
touch database/jsonDB/Events.json
touch database/jsonDB/Events.test.json
node server/server.js