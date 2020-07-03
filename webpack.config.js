// webpack.config.js
//    this is a node JS script

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// process.env.NODE_ENV is one of: undefined, 'test', 'production' (Heroku)
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if( process.env.NODE_ENV === 'test'){
	// load contents of .env.test|development into process.env
	//    e.g.: process.env.FIREBASE_API_KEY = <whatever you specified in .env.test>
	require('dotenv').config({path: '.env.test'});
}else if( process.env.NODE_ENV === 'development'){
	require('dotenv').config({path: '.env.development'});
}

module.exports = (env) => {
	isProduction = env === 'production';
	const cssExtract = new ExtractTextPlugin('styles.css'); // we will create a styles.css file

	return {
		//essentials
		//   https://webpack.js.org/concepts/#entry
		entry: ['@babel/polyfill', './src/app.js'],
		output: {
			path: path.resolve(__dirname, 'public', 'dist'),
			filename: 'bundle.js' // common filename for webpack-generated output
		},
		module: { // loader for Babel
			rules: [{
					loader: 'babel-loader', // look at .babelrc in project root for presets set
					test: /\.js[x]{0,1}$/, // process any js or jsx file
					exclude: /node_modules/ // don't process node_modules!
				},
				{
					use: cssExtract.extract({
						use: [
							{
								loader: 'css-loader',
								options: {sourceMap: true}
							},
							{
								loader: 'sass-loader',
								options: {sourceMap: true}
							}
						]
					}),
					test: /\.s?css$/
				}
			]
		},
		/*
		 * The plugins array is for third-party webpack plugins; these plugins should have access to edit
		 * your existing webpack build.
		 */
		plugins: [
			cssExtract,
			// create global constants for compile time
			// escaped quotes are needed to ensure strings are set, so use JSON.stringify
			new webpack.DefinePlugin({
				'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
				'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
				'process.env.FIREBASE_DATABASE_URL': JSON.stringify(process.env.FIREBASE_DATABASE_URL),
				'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
				'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
				'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID),
				'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID)
			})
		],
		/*
		 * 'source-map' is more expensive to build but better for production, as it is an external file
		 * and only opens when the dev tools are opened in the browser;
		 * see https://webpack.js.org/configuration/devtool/ for various prod or dev source map options.
		 * We were using 'cheap-module-eval-source-map' for development but it fails to split CSS into
		 * original source files, so we now use 'inline-source-map' which is a bit slower.
		 */
		devtool: isProduction ? 'source-map' : 'inline-source-map',
		devServer: { // see https://webpack.js.org/configuration/dev-server/
			contentBase: path.resolve(__dirname, 'public'),
			publicPath: '/dist/',
			historyApiFallback: true // so that React Router serves index.html for all routes
		} // devServer never generates bundle.js! This is a nice replacement for live-server
	};
};