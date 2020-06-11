/*
 * https://reacttraining.com/react-router/ for web (react-router-dom) and for native (react-router-native)
 *
 * Only one component can be inside BrowserRouter, so make a parent div to contain multiple routes.
 *    Could be "Switch" component instead of any div; Switch stops when it finds a match.
 *
 * Notes:
 *    In yarn or npm, both scripts "test" and "start" can be run without the "run" keyword;
 *       you can say yarn test or npm start and those scripts will be run; they are common aliased keywords;
 *       yarn test === yarn run test; yarn start === yarn run start
 *    If you want to run a script and then add some parameters, you need to use two hyphens:
 *       yarn run test -- --watch: this adds the --watch parameter to jest, essentially running:
 *          jest --watch
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import moment from 'moment';
// import {addExpense} from './actions/expenses';
// import {setTextFilter} from './actions/filters';
import { firebase } from './firebase/firebase';

import AppRouter, { history } from './routers/AppRouter';
import configureStore from './store/configureStore';
import { login, logout } from './actions/auth';
import LoadingPage from './components/LoadingPage';

import 'normalize.css/normalize.css'; // reset your browser to start your styling a-fresh
import './styles/style.scss';
import 'react-dates/lib/css/_datepicker.css';

let hasRendered = false;
const renderApp = () => {
	if(hasRendered) return;
	ReactDOM.render(jsx, document.getElementById('app'));
	hasRendered = true;
};

const store = configureStore();
store.subscribe(
	() => {
		const state = store.getState();
		console.log(state);
	}
);

const jsx = (
	// Here we provide our store to all of our components that are within (and including) AppRouter
	<Provider store={store}>
		<AppRouter />
	</Provider>
);

ReactDOM.render(<LoadingPage />, document.getElementById('app'));

const someAsyncAction = new Promise(
	(resolve, reject) => { // here you enter the async task that, when it completes, will resolve/reject the promise
		console.log('wait for someAsyncAction');
		setTimeout(
			() => {
				resolve('someAsyncAction has completed');
				console.log('someAsyncAction has completed');
			},
			2000
		);
	}
);

firebase.auth().onAuthStateChanged(user => {
	if(user){
		console.log('logged in');
		store.dispatch(login(user.uid));
		someAsyncAction.then(
			() => {
				renderApp();
				if(history.location.pathname === '/') history.push('/dashboard');
			}
		).catch(
			e => {throw e;}
		);
	}else{
		store.dispatch(logout());
		renderApp();
		history.push('/');
		console.log('logged out');
	}
});

