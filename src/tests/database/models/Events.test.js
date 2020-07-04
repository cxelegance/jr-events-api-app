import EventsModel from '../../../database/models/EventsModel';
import schema from '../../../database/schemas/Events.json';

let eventsModel;
const expectedDefaults = {
	timezone: "Etc/UTC",
	type: "concert"
};

beforeEach(() => {
	eventsModel = new EventsModel(schema);
});

test('should throw TypeError if constructing without schema', () => {
	expect(
		() => {
			new EventsModel()
		}
	).toThrowError( TypeError );

});

test('test database should be empty to start with', () => {
	expect(eventsModel).toHaveProperty('create');
	expect(eventsModel.read()).toEqual([]);
	expect(eventsModel.read(0,0)).toEqual([]);
	expect(eventsModel.read(0,1)).toEqual([]);
	expect(eventsModel.read(1,0)).toEqual([]);
	expect(eventsModel.read(1,1)).toEqual([]);
	expect(
		() => {
			eventsModel.read(true, true)
		}
	).toThrowError( TypeError );
	expect(eventsModel.read(1,1)).toEqual([]);
});

test('create should throw TypeError on null or non-objects', () => {
	expect(
		() => {
			eventsModel.create(function(){})
		}
	).toThrowError( new TypeError('provided record should be a non-null object') );
	expect(
		() => {
			eventsModel.create(null)
		}
	).toThrowError( new TypeError('provided record should be a non-null object') );
});

test('create should fill out returned object to match schema', (done) => {
	const event = {name: 'test', startTime: 20, id: 1}
	eventsModel.create(
		event
	).then(
		result => {
			expect(result).toEqual([{...event, ...expectedDefaults}]);
		}
	).then(
		() => {
			eventsModel.delete(1).then(
				result => {
					expect(result).toEqual([]);
					done();
				}
			);
		}
	);
});

test('create should fill out returned object to match any schema: 1', (done) => {
	const schema = {
		"songkick": {
			"type": "Object",
			"object": {
				"id": {
					"type": "String",
					"note": "Songkick will have a reference ID so this is required",
					"isRequired": true
				},
				"venue": {
					"type": "Object",
					"object": {
						"id": {
							"isRequired": true,
							"type": "String",
							"note": "Venues have reference IDs as well, make it essential"
						},
						"name": {
							"type": "String"
						},
						"timezone": {
							"defaultVal": "UTC"
						}
					},
					"isRequired": true
				},
				"location": {
					"defaultVal": "USA"
				}
			}
		}
	};

	const eventGiven = {
		id: 1
	};
	const eventReceived = {
		id: 1
	};
	eventsModel = new EventsModel(schema);

	eventsModel.create(
		eventGiven
	).then(
		result => {
			expect(result).toEqual([eventReceived]);
		}
	).then(
		() => {
			eventsModel.delete(1).then(
				result => {
					expect(result).toEqual([]);
					done();
				}
			);
		}
	);
});

test('create should fill out returned object to match any schema: 2', (done) => {
	const schema = {
		"songkick": {
			"type": "Object",
			"object": {
				"id": {
					"type": "String",
					"note": "Songkick will have a reference ID so this is required",
					"isRequired": true
				},
				"venue": {
					"type": "Object",
					"object": {
						"id": {
							"isRequired": true,
							"type": "String",
							"note": "Venues have reference IDs as well, make it essential"
						},
						"name": {
							"type": "String"
						},
						"timezone": {
							"defaultVal": "UTC"
						}
					},
					"isRequired": true
				},
				"location": {
					"defaultVal": "USA"
				}
			}
		}
	};

	const eventGiven = {
		id: 1,
		songkick: {
			id: 'asdfa',
			venue: {
				id: '43256g',
				name: 'my place'
			}
		}
	};
	const eventReceived = {
		id: 1,
		songkick: {
			id: 'asdfa',
			venue: {
				id: '43256g',
				name: 'my place',
				timezone: 'UTC'
			},
			location: 'USA'
		}
	};
	eventsModel = new EventsModel(schema);

	eventsModel.create(
		eventGiven
	).then(
		result => {
			expect(result).toEqual([eventReceived]);
		}
	).then(
		() => {
			eventsModel.delete(1).then(
				result => {
					expect(result).toEqual([]);
					done();
				}
			);
		}
	);
});


