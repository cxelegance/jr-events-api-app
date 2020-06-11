// the .test.js double extension is what JEST looks for when running the test suite

// here's a method to test
const badAdd = (a, b) => a + b + 1;

// let's use JEST's globals test() and expect()
test.skip('add 3 and 4 using badAdd()', () => {
	expect(badAdd(3, 4)).toBe(7); // this will cause JEST to fail: assertion failed
});