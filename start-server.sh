#! /bin/bash

yarn run build-server
mkdir database
node server/server.js