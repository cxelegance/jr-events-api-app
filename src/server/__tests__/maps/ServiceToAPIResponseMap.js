import ServiceToAPIResponseMap from '../../maps/ServiceToAPIResponseMap';
import ErrorServiceResponse from '../../responses/ErrorServiceResponse';
import SuccessServiceResponse from '../../responses/SuccessServiceResponse';
import NoSuchMethodTypeError from '../../errors/NoSuchMethodTypeError';
import {F405ErrorAPIResponse} from '../../responses/ErrorAPIResponse';

let serviceToAPIResponseMap, serviceResponse;

beforeEach(() => {
	serviceToAPIResponseMap = new ServiceToAPIResponseMap();
});

test('ServiceToAPIResponseMap is instantiated correctly', () => {
	expect(serviceToAPIResponseMap).toBeInstanceOf(ServiceToAPIResponseMap);
	expect(serviceToAPIResponseMap).toBeInstanceOf(Map);
});

test('ServiceToAPIResponseMap returns F405ErrorAPIResponse', () => {
	serviceResponse = new ErrorServiceResponse(
		'Events', 'MyMethod',
		new NoSuchMethodTypeError('Service route "Events" has no method "mymethod".')
	);
	return serviceToAPIResponseMap.get( serviceResponse ).then(
		apiResponse => {
			expect(apiResponse).toBeInstanceOf(F405ErrorAPIResponse);
			const rObject = apiResponse.get();
			expect(rObject.code).toBe(405);
			expect(rObject.status).toBe('Method Not Allowed');
			expect(rObject.message).toBe('NoSuchMethodTypeError: Service route "Events" has no method "mymethod".');
			expect(rObject.data).toBe(undefined);
			return expect(rObject.links).toBeInstanceOf(Array);
		}
	).catch(
		e => expect(e).toEqual('no errors thrown')
	);
});

test('ServiceToAPIResponseMap returns TypeError for bad service response', () => {
	serviceResponse = new Error('this is not a ServiceReponse');
	return serviceToAPIResponseMap.get( serviceResponse ).then(
		response => expect(response).toEqual('error should have been thrown')
	).catch(
		e => {
			expect(e).toBeInstanceOf(TypeError);
			return expect(e.toString()).toBe('TypeError: expected a ServiceResponse as the parameter.');
		}
	)
});

test('ServiceToAPIResponseMap returns Error for no key found', () => {
	serviceResponse = new SuccessServiceResponse('Events', 'MyMethod');
	const key = serviceToAPIResponseMap.formKey('Events', 'MyMethod');
	return serviceToAPIResponseMap.get( serviceResponse ).then(
		response => expect(response).toEqual('error should have been thrown')
	).catch(
		e => {
			expect(e).toBeInstanceOf(Error);
			return expect(e.toString()).toBe(`Error: ServiceToAPIResponseMap is missing key: ${key}.`);
		}
	)
});