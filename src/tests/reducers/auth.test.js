import authReducer from '../../reducers/auth';

// REDUX dispatches the @@INIT action to set up default values
test('should set up default state', () => {
	const state = authReducer(undefined, {type: '@@INIT'});
	expect(state).toEqual({});
});

test('should return the logged out state', () => {
	const uid = 'someone is logged in';
	const state = authReducer({uid}, {type: 'LOGOUT'})
	expect(state).toEqual({});
});

test('should set uid for logged in state', () => {
	const uid = 'someone is logged in';
	const state = authReducer({}, {type: 'LOGIN', uid})
	expect(state).toEqual({uid});
});