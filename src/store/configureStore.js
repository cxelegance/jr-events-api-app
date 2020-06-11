import {createStore, combineReducers, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';

import authReducer from '../reducers/auth';

// just for the Firefox Redux dev tools extension
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default () => {

	// Store creation

	const store = createStore(
		combineReducers({
			auth: authReducer
		}),
		// applyMiddleware(thunk) // normally you'd call this but we want devtools and thunk, so...
		composeEnhancers(applyMiddleware(thunk))
	);

	return store;
};

