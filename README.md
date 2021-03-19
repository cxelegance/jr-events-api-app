// TODO WIP!
// [DONE] to get this to work, I had to change the AuthService.get() method to accept an object with id prop
// [DONE]   that would need to be done for all Service methods and their tests would need updating
// I'm getting ServiceToAPIResponseMap.get() to handle a SuccessAPIResponse
//    It will need to transform links from Service into something for HTTP
//       In a collection of records, each item needs its own link.
//    I need my API to use the Range header and Content-Range header (see best practices)
//    Post and Put should use the Location header
// [DONE] I need a test suite for ServiceToAPIResponseMap
// Service::noSuchMethod() should ultimately result in 405 Method Not Allowed
//    'Allow' header should indicate which methods are accepted: GET, PUT, POST, DELETE
// learn about HATEOAS hypermedia/links
//    at 2020 doc mentioning some formats: https://www.mscharhag.com/api-design/hypermedia-rest
//    I was thinking of going with JSON-LD: https://www.w3.org/TR/json-ld/#basic-concepts
//       This page shows you can also mention which HTTP methods/operations are allowed: https://sookocheff.com/post/api/on-choosing-a-hypermedia-format/
//       It seems more involved than I care to do for this API; I will stick with a standard ATOM format.
//       I will use:
//          https://datatracker.ietf.org/doc/rfc8288/?include_text=1
//          https://www.iana.org/assignments/link-relations/
//          e.g. link: {rel: 'self', target: '/event/1'}
//       TODO I need a Link class for these objects.
// WIP: do the ControllerFactory, then HTTPServer
// There is a Route entity in the API Spec UML that I am not using... should I?
// I added a headers String[] to APIResponse... document this.
// remove the dangerous isDebug from lib/Hashword
// TODO: auth GET is not a public-api-facing service; it only works internally

# Boilerplate React App
**yarn install**
**yarn run test**
Cool?
**yarn run build-server**
**yarn run start**
End process when you're done.
If you wanna clean up:
**yarn run clean**

## JR Events API and App

### Database Model and Choice
Ultimately, it was decided to use LMDB; LevelDB was considered but the prior appears more resistant to data corruption.

#### Criteria for Decision
- This app is intended to be hosted at Heroku on a **free** account.
- PostgreSQL appears to have some expected downtime at this account level, on the order of 1 hour per month.
- There also will be need to upgrade the PostgreSQL database every three years or so.
- The database is expected to hold at most a thousand or two records.
 - It is expected to perform very few transactions per hour.
 - The data will change very seldom.
 - There will be much more reads than writes.
 - There are very few relations in the data logic.
- Queries will be simple (most common: get all records) and very seldom.
- There could be future business need to change the data schema, but it would be seldom.
- The data will be backed up regularly via JSON and will be easily restored via JSON.
- The schema need not be flexible; all data will follow one schema.
- It is not expected to need to scale up beyond all the above scope.

Heroku free options are Redis and PostgreSQL; the prior could be used for session information but so could the latter; the latter seems the obvious choice for most of the remaining criteria. However, the unpredictable downtime and the need to upgrade are turnoffs.

A key-value NoSQL solution like LevelDB or LMDB is not exactly the best fit for this app, but it won't hurt anything and should work well with the free hosting.
### Layer Structure

#### Why not separate the API from the app?
That would have been cleaner, but the intention is for the app to render an HTML list of all records prior to JavaScript loading. If JavaScript does not load, then the app will have still delivered the main information expected of the app.

Note: CORS is implemented for requests to the API coming from other domains.

[MDN structure example](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes)

#### APIServer: wraps the HTTP layer and serves; consumes and uses what's in the HTTP layer
Router uses Routes to route a Request to a Controller which uses Services to generate a Response,
ultimately sending the Response.

#### Router: in HTTP layer
Request
Response

#### Routes: in HTTP layer
/api/events/		 R
/api/event/			CRUD
/api/auth/			C  D
/index.html			server-generated list of Events, then load JavaScript app
/ 					see index.html

#### Responses: in HTTP layer
jsonEvents			An array of Events
htmlEvents			An HTML page listing Events
jsonError			An error

TODO TODO: could Controllers really be routers?
#### Controllers: in HTTP layer; an interface to lower layers
Auth				For a routed Auth request, use an Auth Service to satisfy it,
					sending the data/error via a Response.
Event				For a routed Event request, use an Events Service to satisfy it,
					sending the data/error via a Response.
Events				For a routed Events request, use an Events Service to satisfy it,
					sending the data/error via a Response.
App					For a routed App request, use an App Service to satisfy it,
					sending the data/error via a Response.

#### Services: in business public layer; interfaces with layer above and below
Auth				e.g. authenticate, isFresh, deAuthenticate
Events				e.g. getEvents, getEvent, updateEvent, deleteEvent
App					e.g. getEventsHTML

#### Models: in business private layer
Auth				Offers methods for CRUD for Auth data.
Events				Offers methods for CRUD for Events data.

#### Database: in business private layer
Auths				e.g. authDate, authKey
Events				e.g. name, place, time, day, location, etc.

### Project Structure
/server.js			the API runs from here
/app				the built app is here
/app/index.html
/app/dist/
/app/dist/bundle.js
/server				the built API is here
/server
/server/routes
/server/responses
/server/controllers
/server/services
/server/models
/server/database
/src				the sibling directory structure is essentially replicated within here
/doc				JSDoc in here, API and app in separate folders
/tests/
/tests/app/
/tests/server/

### Creating master password
**yarn install**
**yarn run build-sandbox-lib**
**yarn run build-sandbox-errors**
**node sandbox/lib/createPassword.js <insert plaintext here>**
Copy the resulting cryptotext and put it into your ENV on the supplied line.
Don't forget your original plaintext ;)
Consider cleaning afterward:
**yarn run clean**

### Issues yet to deal with
See Service::nextID: the uniqueness of IDs in the database needs to be guaranteed, e.g. with transactions in a relational, transactional database. For now, this is somewhat guaranteed in Model::create() and Model::update().

If the system scales up to a multiuser system, then use of uid() should be replaced in AuthService.

Notes on why my HATEOAS hypermedia is the way it is for version 1.
future patch: ETag working on responses

GET /events/ returns all events; what about POST /events/ (authorized only) to wipe and restore from backup?

Use WWW-Authenticate to pass the auth token when not using it for actually authenticating.

The HTTPServer class should not have the additional responsibility of determining whether a request is authorized or not. Perhaps create an Authorizor Class that the HTTPServer can use to determine this, or an intermediary class that sits between the HTTPServer and any Controller it builds to complete the request; the intermediary class can determine authorization, complete the request if authorized and let the response pass up to the HTTPServer. The HTTPServer::authorizeThenProceed() method should really be an isAuthorized() method that promised to return a boolean.

POST Auth as much as you like: the service rids of the old record and returns the new one.

Once an event rec is deleted, it's ID should remain as permanently deleted.

We wouldn't need tailored F405ErrorAPIResponse to each service if the ServiceResponse returned: availableMethods (get, post, delete, etc.).

Consolidate all F500ErrorAPIResponse and child classes to one and use the ServiceResponse to determine what headers/links to output.

Think more about how HTTPServer knows what params each Service expects as inputs; HTTPServer is responsible for getting them from the HTTP request, but who is responsible for knowing what to look for? The Services in the Public Business Layer should be explicit about what parameters their methods require; the HTTP Layer should be dealing with filtering HTTP parameters down to what the Services expect.
