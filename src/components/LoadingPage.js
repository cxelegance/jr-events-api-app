import React from 'react';

// I left this in here but in my mind it is better to have the loader in the HTML; React and libs
// will load later than the index.html file.
const LoadingPage = () => (
	<div className="loader">
		<img className="loader__image" src="/images/loader.gif" />
	</div>
);

export default LoadingPage;