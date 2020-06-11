import React from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';

const PublicRoute = ({
	isAuthenticated,
	component: Component,
	...rest // this is the rest of the props
}) => (
	<Route {...rest}
		component={props => (
			isAuthenticated ? (
				<Redirect to="/dashboard" />
			) : (
				<Component {...props} />
			)
		)}
	/>
);

const mapStateToProps = state => ({
	isAuthenticated: !!state.auth.uid
});

export default connect(mapStateToProps)(PublicRoute);