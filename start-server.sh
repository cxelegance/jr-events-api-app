#! /bin/bash

yarn run build-babel-server
yarn run build-babel-database
yarn run build-database-schemas
node server/server.js