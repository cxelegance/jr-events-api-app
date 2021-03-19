import {saltAndHash} from './Hashword';

// createPassword should be called with one argument
const plaintext = process.argv[2];

// watch for the generated cyphertext on the console
saltAndHash(plaintext).then(
	cyphertext => console.log(cyphertext)
);