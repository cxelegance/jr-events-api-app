import EventsRecord from '../../records/EventsRecord';

const eventRecsValid = new Map();
const eventRecsInvalid = new Map();

let nextIndex = 0;

/*
 * Valid Records
 */

eventRecsValid.set('shell', new EventsRecord({
	description: undefined,
	displayName: undefined,
	duration: undefined,
	eventID: undefined,
	eventType: 'concert',
	musicianNames: undefined,
	oldVenue: {
		city: undefined,
		country: undefined,
		displayName: undefined,
		state: undefined,
	},
	otherActs: undefined,
	songkickID: undefined,
	songkickURI: undefined,
	songkickVenue: {
		city: undefined,
		country: undefined,
		displayName: undefined,
		state: undefined,
		uri: undefined,
		venueID: undefined,
	},
	songkickVersion: undefined,
	startsAt: undefined,
	timezone: 'Etc/UTC',
	uri: undefined
}));

/*
 * leaves all songkick props absent
 */
eventRecsValid.set(++nextIndex, new EventsRecord({
	"eventID": 1,
	"eventType": "house concert",
	"displayName": "Brasilia Sessions",
	"description": "a Brasilia Sessions show",
	"uri": "http://myshow.com",
	"startsAt": 100,
	"duration": 10000,
	"timezone": "Etc/UTC",
	"oldVenue": {
		"displayName": "Danny's house in Lago Sul",
		"city": "Brasilia",
		"state": "DF",
		"country": "BR"
	},
	"otherActs": ["Brasilia Sax", "Duo Alvenaria"],
	"musicianNames": ["Du Andrade", "Tynan Groves"]
}));

/*
 * tries 'undefined' for otherActs
 * tries empty array for musicianNames
 * leaves oldVenue absent
 */
eventRecsValid.set(++nextIndex, new EventsRecord({
	eventID: 2,
	eventType: 'concert',
	displayName: 'Quintal cafe show',
	description: 'Jesse live in the cafe',
	uri: 'http://myshow.com/2',
	startsAt: 100,
	duration: 10000,
	timezone: 'Etc/UTC',
	songkickID: 4348867482,
	songkickURI: 'http://songkick.com/events/4348867482',
	songkickVersion: '3.0',
	songkickVenue: {
		venueID: 1003438683,
		uri: 'http://songkick.com/venues/1003438683',
		displayName: 'Quintal F/508',
		city: 'Brasilia',
		state: 'DF',
		country: 'BR'
	},
	otherActs: undefined,
	musicianNames: []
}));

/*
 * has an empty object for songkickVenue (which is meant to be an object with sub properties)
 * and oldVenue is absent
 */
eventRecsValid.set(++nextIndex, new EventsRecord({
	eventID: 3,
	eventType: 'house concert',
	displayName: 'House Concert—Brasilia Sessions',
	description: 'a Brasilia Sessions show',
	uri: 'http://myshow.com',
	startsAt: 100,
	duration: 10000,
	timezone: 'Etc/UTC',
	songkickID: 4348867482,
	songkickURI: 'http://songkick.com/events/4348867482',
	songkickVersion: '3.0',
	songkickVenue: {}
}));

/*
 * Just the minimum required fields
 */
eventRecsValid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 1'
}));

/*
 * Invalid Records
 */
nextIndex = 0;

/*
 * Completely empty!
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({

}));

/*
 * missing required field eventID
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 2'
}));

/*
 * required field eventID is NaN
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: NaN,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 3'
}));

/*
 * required field eventID is a string
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: '1000',
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 4'
}));

/*
 * missing required field eventType
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 5'
}));

/*
 * missing required field startsAt
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	timezone: 'Etc/UTC',
	displayName: 'My big concert 6'
}));

/*
 * missing required field timezone
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	displayName: 'My big concert 7'
}));

/*
 * missing required field displayName
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC'
}));

/*
 * basic minimum required fields, plus a stray unaccepted field with a string
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 8',
	whatIsThis: '?'
}));

/*
 * basic minimum required fields, plus a stray unaccepted field with an object
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 9',
	whatIsThis: {
		hey: 'look at me!'
	}
}));

/*
 * basic minimum required fields, plus a stray unaccepted field with a number
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 10',
	whatIsThis: 7
}));

/*
 * basic minimum required fields, plus a stray unaccepted field with an empty array
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 11',
	whatIsThis: []
}));

/*
 * basic minimum required fields, plus a stray unaccepted field with an array of numbers
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 12',
	whatIsThis: [1, 2, 3]
}));

/*
 * basic minimum required fields, plus a stray unaccepted field with an array of strings
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 13',
	whatIsThis: ['hi', 'there']
}));

/*
 * a nested object that has unaccepted field lookAtMe with a number
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: 1,
	timezone: 'Etc/UTC',
	displayName: 'My big concert 14',
	songkickVenue: {
		lookAtMe: 18
	}
}));

/*
 * accepted field startsAt has an empty object in it when a number is expected
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: {},
	timezone: 'Etc/UTC',
	displayName: 'My big concert 15'
}));

/*
 * accepted field musicianNames has a non-string subtype.
 */
eventRecsInvalid.set(++nextIndex, new EventsRecord({
	eventID: 1000,
	eventType: 'concert',
	startsAt: {},
	timezone: 'Etc/UTC',
	displayName: 'My big concert 16',
	musicianNames: ['Me', 5]
}));

export {eventRecsValid, eventRecsInvalid};