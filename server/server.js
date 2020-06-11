const path = require('path');
const express = require('express');
const app = express();
const publicPath = path.join(__dirname, '..', 'public/');

/*
 * Express.static simply serves up a static web site/app.
 */
app.use(express.static(publicPath));

app.get('*', (request, response) => {
	response.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(3000, () => console.log('Server is up!')); // 3000 is available on all OS