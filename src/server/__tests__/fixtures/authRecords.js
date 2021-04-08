import AuthRecord from '../../records/AuthRecord';

const authRecsValid = new Map();
const authRecsInvalid = new Map();

let nextIndex = 0;

/*
 * Valid Records
 */

authRecsValid.set('shell', new AuthRecord({
	authID: undefined,
	authToken: undefined,
	userID: undefined,
	createdAt: undefined
}));

/*
 * Minimum required fields provided
 */
authRecsValid.set(++nextIndex, new AuthRecord({
	authID: nextIndex,
	authToken: 'adfaf3qrasdfadfbasdasdf',
	userID: "1",
	createdAt: 100000000
}));

/*
 * Minimum required fields provided
 */
authRecsValid.set(++nextIndex, new AuthRecord({
	authID: nextIndex,
	authToken: 'bbbccccdddeeeeffff',
	userID: "1",
	createdAt: 1000000
}));

/*
 * Invalid Records
 */
nextIndex = 0;

/*
 * Minimum required fields provided, but an extra one snuck in
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: 1,
	authToken: 'adfaf3qrasdfadfbasdasdf',
	userID: "1",
	createdAt: 100000000,
	whatIsThis: '?'
}));

/*
 * authID is missing
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authToken: 'adfaf3qrasdfadfbasdasdf',
	userID: "1",
	createdAt: 100000000
}));

/*
 * authToken is missing
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: 1,
	userID: "1",
	createdAt: 100000000
}));

/*
 * userID is missing
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: 1,
	authToken: 'adfaf3qrasdfadfbasdasdf',
	createdAt: 100000000
}));

/*
 * createdAt is missing
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: 1,
	authToken: 'adfaf3qrasdfadfbasdasdf',
	userID: "1",
}));

/*
 * authID is not a number
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: '3',
	authToken: 'adfaf3qrasdfadfbasdasdf',
	userID: "1",
	createdAt: 100000000
}));

/*
 * authToken is not a string
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: 1,
	authToken: 3127596,
	userID: "1",
	createdAt: 100000000
}));

/*
 * userID is not a string
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: 1,
	authToken: 'adfaf3qrasdfadfbasdasdf',
	userID: 1,
	createdAt: 100000000
}));

/*
 * createdAt is not a number
 */
authRecsInvalid.set(++nextIndex, new AuthRecord({
	authID: 1,
	authToken: 'adfaf3qrasdfadfbasdasdf',
	userID: "1",
	createdAt: '100000000'
}));

export {authRecsValid, authRecsInvalid};