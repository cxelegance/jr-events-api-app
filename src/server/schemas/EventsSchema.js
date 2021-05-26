import Schema from './Schema';

/**
 * Responsible for defining EventsSchema.
 *
 * @class
 * @classdesc EventsSchema defines EventRecords in the database.
 */
export default class EventsSchema extends Schema {

	rules = {
		eventID: {
			type: 'number',
			isRequired: true,
			isPrimary: true
		},
		eventType: {
			type: 'string',
			isRequired: true,
			oneOf: ['concert', 'festival', 'special set', 'gig', 'house concert'],
			defaultVal: 'concert'
		},
		displayName: {
			type: 'string',
			isRequired: true,
			note: 'the name of the <type>, e.g., Live set - Quintal Brunch with JR'
		},
		description: {
			type: 'string',
			note: 'e.g., Guest to Billie Woods\' show'
		},
		uri: {
			type: 'string',
			note: 'external link to the event, NOT the Songkick page'
		},
		startsAt: {
			type: 'number',
			isRequired: true,
			note: 'milliseconds since the Unix Epoch.'
		},
		duration: {
			type: 'number',
			note: 'milliseconds that can be added to startTime'
		},
		timezone: {
			type: 'string',
			isRequired: true,
			defaultVal: 'Etc/UTC',
			note: 'e.g. America/New_York, see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones'
		},
		songkickID: {
			type: 'number',
		},
		songkickURI: {
			type: 'string'
		},
		songkickVersion: {
			type: 'string'
		},
		songkickVenue: {
			type: 'object',
			object: {
				venueID: {
					type: 'number'
				},
				uri: {
					type: 'string'
				},
				displayName: {
					type: 'string'
				},
				city: {
					type: 'string'
				},
				state: {
					type: 'string'
				},
				country: {
					type: 'string',
					note: 'two letters: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2'
				}
			}
		},
		oldVenue: {
			type: 'object',
			object: {
				displayName: {
					note: 'useful if there is no songkick venue; e.g., The Church, Nanda\'s house, etc.',
					type: 'string'
				},
				city: {
					note: 'useful if there is no songkick venue; e.g., The Church, Nanda\'s house, etc.',
					type: 'string'
				},
				state: {
					note: 'useful if there is no songkick venue; e.g., The Church, Nanda\'s house, etc.',
					type: 'string'
				},
				country: {
					type: 'string',
					note: 'two letters: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2'
				}
			}
		},
		otherActs: {
			type: 'array',
			subType: 'string',
			note: 'E.g., [Brasilia Sax, Duo Alvenaria, etc.]'
		},
		musicianNames: {
			type: 'array',
			subType: 'string',
			note: 'E.g., [Du Andrade, Tynan Groves, etc.]'
		}
	};

	constructor(){
		super();
		this.validatePrimary();
		this.datatypes = [];
		this.populateDatatypes();
	}

}