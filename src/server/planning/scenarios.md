# Use Cases: Detailed Steps
See [Use Case](https://en.wikipedia.org/wiki/Use_case); this is a simple subset.

## Initiate system
**Actor**: The API system itself
**Action**: initiates and starts listening for requests
**Outcome**: the system listens and waits for requests
Pre-process details:
- modelFactory is instantiated
- database is selected to work with the models
 - serviceFactory is instantiated with modelFactory, database and hashed master password as parameters
  - the hashed master password comes from ENV
- serviceToAPIResponseMap is instantiated
 - controllerFactory is instantiated with serviceFactory and serviceToAPIResponseMap as parameters
- routes is selected as an array of Route instances
- port is chosen from the ENV
  - httpServer is instantiated with controllerFactory, port and routes as parameters
- httpServer.listen() is called
- **END**

## Authenticate via HTTPS
**Actor**: API user
**Action**: makes an HTTPS POST request at api/auth/ with a parameter: hashed password
**Outcome**: successfully created new auth record
- httpServer recognizes the request on the Auth Route and knows it is for the AuthController
- httpServer calls controllerFactory('Auth') and receives an AuthController instance
- httpServer calls authController.handleRequest() with 'POST', 'https', <no version>, <no authToken> and hashword as parameters
 - authController calls serviceFactory.get('Auth', isSecure=true, '<no version>') and receives an AuthService instance default version, which is the only version and not indicated in the class names
 - authController calls authService.post(hashword)
  - authService has isSecure=true stored internally and knows it is safe to proceed
  - authService hashes and salts hashword and compares it with its masterHashword property
  - authService determines it to be a match, so it creates a unique ID string
  - authService calls modelFactory('Auth', db, '<no version>') and receives an AuthModel instance, default version
  - authService creates an instance of authModel.schema.constructor (AuthRecord) using the unique ID as a parameter
  - authService calls authModel.create() with the new authRecord as a parameter
   - authModel puts the new authRecord in the database
  - authService returns an instance of SuccessServiceResponse, the unique ID as data, and a link reference that is simply a non-http string: 'auth/:<unique ID>'
 - authController calls serviceToAPIResponseMap.get() with the new successServiceResponse as a parameter
 - authController receives a SuccessAPIResponse with the data loaded
 - authController returns newly obtained successAPIResponse
- httpServer sends successAPIResponse to the requestor
- **END**

## Authenticate via HTTP and v2
**Actor**: API User
**Action**: makes an HTTP POST request at api/auth with parameter hashword, headers request v2
**Outcome**: error: this request must be made via https
- httpServer recognizes the request on the Auth Route and knows it is for the AuthController
- httpServer calls controllerFactory('Auth') and receives an AuthController instance
- httpServer calls authController.handleRequest() with 'POST', 'http', <no authToken>, 'v2', and hashword as parameters
 - authController calls serviceFactory('Auth', isSecure=false, 'v2') and receives an AuthService_v_2 instance
 - authController calls authService.post(hashword)
  - authService_v_2 has isSecure=false stored internally and determines it is not safe to proceed
  - authService_v_2 returns an instance of ErrorServiceResponse with message: POST must be made securely
 - authController calls serviceToAPIResponseMap.get() with the new errorServiceResponse as a parameter
 - authController receives an ErrorAPIResponse with the message loaded
 - authController returns newly obtained errorAPIResponse
- httpServer sends errorAPIResponse to the requestor
- **END**

## Get All Events
**Actor**: API User
**Action**: makes an HTTP GET request at api/events with no parameters, headers request v2
**Outcome**: successfully returned event records
- httpServer recognizes the request on Events Route and knows it is for the EventsController
- httpServer calls controllerFactory('Events') and receives an EventsController instance
- httpServer calls eventsController.handleRequest() with 'GET', 'http', <no authToken>, 'v2', and no parameters
 - eventsController calls serviceFactory('Events', isSecure=false, 'v2') and receives an instance of EventsService_v_2
 - eventsController_v_2 calls eventsService_v_2.get()
  - eventsService_v_2 calls modelFactory('Events', db, 'v2') and receives an instance of EventsModel_v_2
  - eventsService_v_2 calls eventsModel_v_2.get() and receives an array of EventRecord_v_2
  - eventsService_v_2 returns an instance of SuccessServiceResponse with the array as data
 - eventsController_v_2 calls serviceToAPIResponseMap.get() with the new successServiceResponse as a parameter
 - eventsController_v_2 receives a SuccessAPIResponse with the data loaded
 - eventsController_v_2 returns newly obtained successAPIResponse
- httpServer sends successAPIResponse to the requestor
- **END**  

## Create an Event
**Actor** API User
**Action**: makes an HTTP POST request at api/event with an event-like object as parameter
**Outcome**: successfully created new event record
- httpServer recognizes the request on Event Route and knows it is for the EventController
- httpServer calls controllerFactory('Event') and receives an EventController instance
- httpServer calls eventController.handleRequest() with 'POST', 'http', <authToken>, <no version>, and the object as parameters
 - eventController recognizes this is a POST and that an active, recent authentication is required
 - eventController throws ConfirmAuthorizationError
- httpServer catches ConfirmAuthorizationError and notes its proceed() method
- httpServer calls controllerFactory('Auth') and receives an AuthController instance
- httpServer calls authController.handleRequest() with 'GET', 'http', <authToken>, <no version>, and the object as parameters
 - authController calls serviceFactory('Auth', isSecure=false, <no version>) and receives an AuthService instance, default version
 - authController calls authService.get(authToken)
  - authService calls modelFactory('Auth', db, '<no version>') and receives an AuthModel instance, default version
  - authService calls authModel.read(authID); authID is determined from authToken
   - authModel finds a corresponding AuthRecord
   - authModel returns the authRecord
  - authService calls authService.isFresh(authRecord)
  - authService determines the record is Fresh (***TODO: use ENV for fresh limit***)
  - authService returns an instance of SuccessServiceResponse with the authRecord as data
 - authController calls serviceToAPIResponseMap.get() with the new successServiceResponse as a parameter
 - authController receives a SuccessAPIResponse with the data loaded
 - authController returns newly obtained successAPIResponse
- httpServer sees the SuccessAPIResponse and knows it can proceed with the original request
- httpServer calls ConfirmAuthorizationError.proceed() with no parameters
 - eventController resumes where it left off
 - eventController calls serviceFactory('Event', isSecure=false, '<no version>') and receives an EventService instance, default version
 - eventController calls eventService.post() with the original object as a parameter
  - eventService calls modelFactory('Event', db, '<no version>') and receives an EventsModel instance, default version
  - eventService creates an instance of eventsModel.schema.constructor (EventRecord) using the original object as a parameter
  - eventService calls eventsModel.create() with the new eventRecord as a parameter
   - eventsModel puts the new eventRecord in the database and returns a unique ID
  - eventService returns an instance of SuccessServiceResponse, the unique ID as data, and a link reference that is simply a non-http string: 'event/:<unique ID>'
 - eventController calls serviceToAPIResponseMap.get() with the new successServiceResponse as a parameter
 - eventController receives a SuccessAPIResponse with the data loaded
 - eventController returns newly obtained successAPIResponse
- httpServer sends successAPIResponse to the requestor
- **END**  

## Delete an Event
**Actor** API User
**Action**: makes an HTTPS POST request at api/event with an ID as parameter
**Outcome**: successfully deleted an event record
- httpServer recognizes the request on Event Route and knows it is for the EventController
- httpServer calls controllerFactory('Event') and receives an EventController instance
- httpServer calls eventController.handleRequest() with 'POST', 'https', <authToken>, <no version>, and the ID as parameters
 - eventController recognizes this is a DELETE and that an active, recent authentication is required
 - eventController throws ConfirmAuthorizationError
- httpServer catches ConfirmAuthorizationError and notes its proceed() method
- httpServer calls controllerFactory('Auth') and receives an AuthController instance
- httpServer calls authController.handleRequest() with 'GET', 'https', <authToken>, <no version>, and the ID as parameters
 - authController calls serviceFactory('Auth', isSecure=true, '<no version>') and receives an AuthService instance, default version
 - authController calls authService.get(authToken)
  - authService calls modelFactory('Auth', db, '<no version>') and receives an AuthModel instance, default version
  - authService calls authModel.read(authID); authID is determined from authToken
   - authModel finds a corresponding AuthRecord
   - authModel returns the authRecord
  - authService calls authService.isFresh(authRecord)
  - authService determines the record is Fresh (***TODO: use ENV for fresh limit***)
  - authService returns an instance of SuccessServiceResponse with the authRecord as data
 - authController calls serviceToAPIResponseMap.get() with the new successServiceResponse as a parameter
 - authController receives a SuccessAPIResponse with the data loaded
 - authController returns newly obtained successAPIResponse
- httpServer sees the SuccessAPIResponse and knows it can proceed with the original request
- httpServer calls ConfirmAuthorizationError.proceed() with no parameters
 - eventController resumes where it left off
 - eventController calls serviceFactory('Event', isSecure=true, '<no version>') and receives an EventService instance, default version
 - eventController calls eventService.delete() with the ID as a parameter
  - eventService sees has isSecure=true stored internally and knows that it can proceed with delete
  - eventService calls modelFactory('Events', db, <no version>) and receives an EventsModel instance, default version
  - eventService calls eventsModel.delete(ID)
   - eventsModel finds the record matching ID in the database and deletes it
  - eventService did not catch and error so it knows the work is done
  - eventService returns an instance of SuccessServiceResponse with the ID as data
 - eventController calls serviceToAPIResponseMap.get() with the new successServiceResponse as a parameter
 - eventController receives a SuccessAPIResponse with the data loaded
 - eventController returns newly obtained successAPIResponse
- httpServer sends successAPIResponse to the requestor
- **END**  

## Create an Event
**Actor** API User
**Action**: makes an HTTPS POST request at api/event with an event-like object as parameter
**Outcome**: because Auth record is not fresh, requestor receives error: Auth record is removed
- httpServer recognizes the request on Event Route and knows it is for the EventController
- httpServer calls controllerFactory('Event') and receives an EventController instance
- httpServer calls eventController.handleRequest() with 'POST', 'https', <authToken>, <no version>, and the object as parameters
 - eventController recognizes this is a POST and that an active, recent authentication is required
 - eventController throws ConfirmAuthorizationError
- httpServer catches ConfirmAuthorizationError and notes its proceed() method
- httpServer calls controllerFactory('Auth') and receives an AuthController instance
- httpServer calls authController.handleRequest() with 'GET', 'https', <authToken>, <no version>, and the object as parameters
 - authController calls serviceFactory('Auth', isSecure=true, '<no version>') and receives an AuthService instance, default version
 - authController calls authService.get(authToken)
  - authService calls modelFactory('Auth', db, '<no version>') and receives an AuthModel instance, default version
  - authService calls authModel.read(authID); authID is determined from authToken
   - authModel finds a corresponding AuthRecord
   - authModel returns the authRecord
  - authService calls authService.isFresh(authRecord)
  - authService determines the record is not Fresh (***TODO: use ENV for fresh limit***)
  - authService calls authModel.delete(authID)
   - authModel deletes the corresponding AuthRecord
  - authService returns an instance of ErrorServiceResponse with message: must reauthenticate
 - authController calls serviceToAPIResponseMap.get() with the new errorServiceResponse as a parameter
 - authController receives an ErrorAPIResponse with the message loaded
 - authController returns newly obtained errorAPIResponse
- httpServer sends errorAPIResponse to the requestor
- **END**
