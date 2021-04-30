import Route from './routes/Route';

// Order from top to bottom: first match to last
const routes = [
	new Route(/^\/api\/events\/?$/i, 'Events'),
	new Route(/^\/api\/event\/(?<id>[^\/]+?)\/?$/i, 'Event'),
	new Route(/^\/api\/event\/?$/i, 'Event'),
	new Route(/^\/api\/auth\/(?<id>[^\/]+?)\/?$/i, 'Auth'),
	new Route(/^\/api\/auth\/?$/i, 'Auth'),
	new Route(/^\/api\/?/i, undefined) // discoverability on bad route
	// new Route(/^\/index\.html$/, 'App'),
	// new Route(/^\/$/, 'App'),
	// new Route('*') // no controller defined; default action
];

export {routes as default};