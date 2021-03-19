import Record from '../../records/Record';
import AuthRecord from '../../records/AuthRecord';

let authRecord;

beforeEach(() => {
	authRecord = new AuthRecord();
});

test('new authRecord is an instance of AuthRecord and of Record', () => {
	expect(authRecord instanceof AuthRecord).toBe(true);
	expect(authRecord instanceof Record).toBe(true);
});