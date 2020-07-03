// process.env.NODE_ENV is one of: undefined, 'test', 'production' (Heroku)
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if( process.env.NODE_ENV === 'test'){
	// load contents of .env.test|development into process.env
	//    e.g.: process.env.FIREBASE_API_KEY = <whatever you specified in .env.test>
	const result = require('dotenv').config({path: '.env.test'});
	if (result.error) {
	  throw result.error;
	}
}else if( process.env.NODE_ENV === 'development'){
	const result = require('dotenv').config({path: '.env.development'});
	if (result.error) {
	  throw result.error;
	}
}