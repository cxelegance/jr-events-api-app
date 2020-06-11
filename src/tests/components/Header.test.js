import React from 'react';
import { Header } from '../../components/Header';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import {shallow} from 'enzyme';
import toJSON from 'enzyme-to-json';

test.skip('should render Header correctly', () => {
	const renderer = new ReactShallowRenderer();
	renderer.render(<Header startLogout={ () => {} }/>);
	/*
	 * Snapshot time:
	 * On first run, a snapshot will be created in the __snapshots__ folder.
	 * On subsequent runs, the code will be compared with that snapshot.
	 * If this test fails, you can either correct the error to match the snapshot,
	 * or you can update (while running tests) the snapshot.
	 */
	expect(renderer.getRenderOutput()).toMatchSnapshot();
});

test('should render Header correctly using Enzyme', () => {
	const wrapper = shallow(<Header />);
	expect(wrapper).toMatchSnapshot();
	expect(wrapper.find('h1').text()).toBe('Boilerplate');
});

test('should call startLogout on button click', ()=>{
	const startLogout = jest.fn();
	const wrapper = shallow(<Header startLogout={startLogout}/>);
	wrapper.find('button').simulate('click');
	expect(startLogout).toHaveBeenCalled();
});