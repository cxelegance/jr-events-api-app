// we need to Mock moment.js or our snapshots of Enzyme tests wherever moment is used will break
// read JEST's docs on manual mocks; especially on how to actually import the library you're mocking!
const moment = require.requireActual('moment');

export default (timestamp = 0) => {
	return moment(timestamp);
};