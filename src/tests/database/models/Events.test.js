import EventsModel from '../../../database/models/EventsModel';
import schema from '../../../database/schemas/Events.json';

let eventsModel;

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

test.only('create should fill out returned object to match schema', () => {
	const result = eventsModel.create({
		name: 'test',
		start: 20
	});
	expect(result.length).toBe(1);
	expect(result).toEqual([{id: 1, event: {name: 'test', start: 20}}]);

	// const result2 = eventsModel.delete(2);
	// expect(result2).toEqual([]);
});


