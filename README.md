# JR Events App and API
**yarn install**<br>
**yarn run test**<br>
Cool?<br>
**yarn run build**<br>
**yarn run start**<br>
End process when you're done.<br>
If you wanna clean up:<br>
**yarn run clean**

## Database Model and Choice
Ultimately, it was decided to use LMDB; LevelDB was considered but the prior appears more resistant to data corruption.

### Criteria for Decision
- This app is intended to be hosted at Heroku on a free account.
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

## The App
Yet to be created; a simple version is intended before going to version 1.0.

## API Layer Structure

### Why not separate the API from the App?
That would have been cleaner, but the intention is for the app to render an HTML list of all records prior to JavaScript loading. If JavaScript does not load, then the app will have still delivered the main information expected of the app.

### API Layers and Flow Diagram
[API Layers and Flow Diagram](src/server/planning/API%20Layers%20and%20Flow.png).<br>
This [MDN structure example](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes) was referenced prior to designing.

#### HTTP Layer
There is a HTTP Server that responds to HTTP requests. This layer houses a public business layer, as well as a private business layer; it contains all routes, a controller, a set of HTTP responses and a map for transforming service responses into HTTP responses.

#### Public Business Layer
Essentially a Services business front, accepting and responding to requests from the controller in the HTTP Layer. This layer also hides a private business layer.

#### Private Business Layer
Here lie the database and models, including the schema definitions appropriate to the business needs. The models are used by the Services in the parent layer.

### API Spec UML
The [API Spec UML](src/server/planning/API%20spec%20UML.png) shows most entity relationships for the API.

## API: Creating the Master Password
**yarn install**<br>
**yarn run build-sandbox-lib**<br>
**yarn run build-sandbox-errors**<br>
**node sandbox/lib/createPassword.js \<insert plaintext here\>**<br>
Copy the resulting cryptotext and put it into .env on the MASTERPASS line.<br>
Don't forget the original plaintext ;)<br>
Consider cleaning afterward:<br>
**yarn run clean**

## Issues Remaining to Resolve
See Service::nextID: the uniqueness of IDs in the database needs to be guaranteed, e.g. with transactions in a relational, transactional database. For now, this is somewhat guaranteed in Model::create() and Model::update().

If the system scales up to a multiuser system, then use of uid() should be replaced in AuthService.

Notes on why my HATEOAS hypermedia is the way it is for version 1.
future patch: ETag working on responses

Use WWW-Authenticate to pass the auth token when not using it for actually authenticating.

The HTTPServer class should not have the additional responsibility of determining whether a request is authorized or not. Perhaps create an Authorizor Class that the HTTPServer can use to determine this, or an intermediary class that sits between the HTTPServer and any Controller it builds to complete the request; the intermediary class can determine authorization, complete the request if authorized and let the response pass up to the HTTPServer. The HTTPServer::authorizeThenProceed() method should really be an isAuthorized() method that promises to return a boolean.

POST Auth as much as you like: the service rids of the old record and returns the new one.

Once an event rec is deleted, it's ID should remain as permanently deleted.

We wouldn't need tailored F405ErrorAPIResponse to each service if the ServiceResponse returned: availableMethods (get, post, delete, etc.).

Consolidate all F500ErrorAPIResponse and child classes to one and use the ServiceResponse to determine what headers/links to output.

Think more about how HTTPServer knows what params each Service expects as inputs; HTTPServer is responsible for getting them from the HTTP request, but who is responsible for knowing what to look for? The Services in the Public Business Layer should be explicit about what parameters their methods require; the HTTP Layer should be dealing with filtering HTTP parameters down to what the Services expect.

Consider HATEOAS hypermedia/links.<br>
- a 2020 doc mentioning some formats: https://www.mscharhag.com/api-design/hypermedia-rest
- was thinking of going with JSON-LD: https://www.w3.org/TR/json-ld/#basic-concepts
- mention which HTTP methods/operations are allowed: https://sookocheff.com/post/api/on-choosing-a-hypermedia-format/
 - seems more involved than desirable for this API; what about standard ATOM format:
   - https://datatracker.ietf.org/doc/rfc8288/?include_text=1
   - https://www.iana.org/assignments/link-relations/
     - e.g. link: {rel: 'self', target: '/event/1'}
