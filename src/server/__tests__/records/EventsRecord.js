import Record from '../../records/Record';
import EventsRecord from '../../records/EventsRecord';

let eventsRecord;

beforeEach(() => {
	eventsRecord = new EventsRecord();
});

test('new eventsRecord is an instance of EventsRecord and of Record', () => {
	expect(eventsRecord instanceof EventsRecord).toBe(true);
	expect(eventsRecord instanceof Record).toBe(true);
});