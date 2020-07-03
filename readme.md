# Boilerplate React App
**yarn install**
**yarn run test**

If you wanna clean up:
**yarn run clean**

## JR Events App

### Why use simple-json-db?
I wanted control over how the JSON database file would be organized.
This app is not expected to scale beyond a single server; in a Node environment the fs utility will work.
There will be very low read/write ops to this database; it won't be used intensively.
Only one app/user will be connected to the database at any given time.
There won't be so many records; perhaps at most a thousand or two.
The database can stay in local storage and the server memory can handle it until a write operation is desired.
A simple schema can be implemented using some wrapper classes.
The server can easily handle sorting records using Array methods.
The JSON database file can be easily backed up or restored, as well as easily migrated to a different database one day if required.

Note that simple-json-db is used with automatic asyncWrite turned off; the wrapper classes decide when to call the sync() method, which has been rewritten on the prototype to return a promise of finishing the write operation.

## Misc notes
Note that in package.json we use lowercase and hyphens for the name to remain valid with package names.

See https://webpack.js.org/guides/production/; I don't need to use Uglify.js as Webpack's production build
can minify for me:
**yarn run build:prod**

Use the plugin "extract-text-webpack-plugin" to extract CSS from bundle.js and into a CSS bundle.
Don't forget to add the link tag to the index.html file.

We set up Express at /server/server.js just for Heroku publishing.
**yarn run start**

It's a good idea in your components/files to import third-party libs first then your own libs.

We added Babel Polyfill in webpack.config to support older browsers. How fat is it though? Does it a lot of kb to our final production bundle.js?

## Heroku
Should you want to deploy to Heroku, read https://devcenter.heroku.com/articles/nodejs-support.
After Heroku installs all your dependencies and fills up node_modules/, it will run the script
"heroku-postbuild" if it exists, and if not then it will run "build" instead; it will not run both.
**yarn run heroku-postbuild** -> "heroku-postbuild": "yarn run build:prod"

You can also define "heroku-prebuild" to run before building. Finally, Heroku will run your "start".
**yarn run start**

Dev vs Prod: here's what Heroku will run when it installs dependencies; this way the "devDependencies"
will not install in production.
yarn install --production

## Using firebase: validation and security rules
{
  "rules": {
    ".read": false,
    ".write": false,
    "users": {
      "$user_id": {
        ".read": "$user_id === auth.uid",
        ".write": "$user_id === auth.uid",
        "expenses": {
          "$expense_id": {
            ".validate": "newData.hasChildren(['description', 'note', 'createdAt', 'amount'])",
          	"description": {".validate": "newData.isString() && newData.val().length > 0"},
          	"note": {".validate": "newData.isString()"},
          	"createdAt": {".validate": "newData.isNumber()"},
          	"amount": {".validate": "newData.isNumber()"},
        		"$other": {".validate": false}
       		}
        },
        "$other": {".validate": false}
      }
    }
  }
}

And if you push to Heroku, you'll need to add to Firebase Authenticated domains the domain of the Heroku app.

## SASS SCSS tips
see &:hover in list.scss for how to shorthand using &
see @extend in inputs.scss for how to extend a previous selector into a new one