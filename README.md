# farmsmart-firebase

[![CircleCI](https://circleci.com/gh/farmsmart/farmsmart-firebase.svg?style=svg)](https://circleci.com/gh/farmsmart/farmsmart-firebase)

The FarmSmart is a mobile app providing tailored recommendations to farmers based on their location,
starting season, farming purpose (such as for profit), as well as details about their land.
In addition, the app will include the latest farming tips as well as links to various chat groups,
enabling farmers to communicate, share information and eventually sell their produce.

This repository contains the Firebase backend services such as Cloud Functions and Rules for Firestore and Cloud Storage.

## Get started

1. Install NodeJS. This project uses Node 8
2. Install the firebase CLI to global

```bash
$ npm install -g firebase-tools
```

3. Checkout the source code
4. Change directory into `functions` directory and run install

```bash
$ cd functions
$ npm install
```

[> Firebase Function Quickstart Guide](https://firebase.google.com/docs/functions/get-started)

## Writing functions

Note that you will need to switch to the `functions` directory before running `npm` commands

```bash
$ cd functions
```

In order to keep a maintainable `index.js` the project declares functions in separate files which are then dynamically named and referenced from the index.

#### Conventions

- Should follow a directory structure based on the Firebase service
- Should be named based on the event type
- Must use a `.f.js` suffix in the filename
- Should store tests with the function

```
functions/
  auth/
    on_create.f.js
    on_delete.f.js
  firestore/
    users/
      on_create.f.js
    content/
      on_write.f.js
  utils/
    helper.js
```

This will result in the following functions being deployed

```
authOnCreate
authOnDelete
firestoreUsersOnCreate
firestoreContentOnWrite
```

[> More on organising Cloud Functions](https://codeburst.io/organizing-your-firebase-cloud-functions-67dc17b3b0da)

## Testing functions

### Linting and format

Coding standards are defined in `.eslintrc.json` and `.prettierrc`.

```bash
$ npm run lint
$ npm run prettier
```

### Unit

Tests are written using [Jest](https://jestjs.io/) and include a coverage report. As a soft rule we aim for 80% coverage. Exported modules must include tests.

```bash
$ npm test
```

#### Conventions

- Should include tests in same directory as the module
- Should follow a `describe('My Module')` ... `it('should ...')` format
- Must use a `.unit.test.js` suffix in the filename

```
functions/
  firestore/
    content/
      on_write.f.js
      on_write.unit.test.js
```

Test configuration is managed in the `jest.config.js`. By default use `npm run test` for simplified output in the console.

### Running functions locally

You can run your functions locally before commiting them into CI. This executes your functions against your currently set Firebase project. Use `firebase list` and `firebase set` commands to manage which project to target.

```bash
$ npm run shell
```

The console will list out the available functions which can then be run by providing some json data and any params

```
firestoreContentOnWrite({ before: oldData, after: newData, params: { id: 123 } })
```

[> More details for running locally](https://firebase.google.com/docs/functions/local-emulator)

## Farmsmart Cloud Function Environment configurations

`farmsmart.sheets.api.key` - project config that holds the sheets api key used to access a google spreadsheet from the cloud function

`farmsmart.scorematrix.doc.id` - the google spreadsheet document id to the score matrix data

## Helpful Firebase Cloud functions commands

Firebase commands can be run from the `farmsmart-firebase` root directory.

```bash
# view all projects you are allowed to access
$ firebase list

# point to a project
$ firebase use <project_id>

# add configs
$ firebase functions:config:set farmsmart.sheets.api.key="<gcp_api_key_for_spreadsheets>" farmsmart.scorematrix.doc.id="<google_spreadsheet_doc_id>"

# retrieve all cloud function configs set for the current project
$ firebase functions:config:get

# deploy all cloud functions in the project
$ firebase deploy --only functions
# deploy a specific cloud function
$ firebase deploy --only functions:<name_of_cloud_function>

# delete cloud functions if deleted form index.js
 firebase functions:delete <name_of_cloud_function> --region us-central1 --force
```

## Firebase rules

The `rules` directory contains the security definitions for accessing each of the Firebase repository and storage facilities

### Writing rules

Refer to the [Firebase documentation](https://firebase.google.com/docs/rules) for developing rules

### Testing rules

Firestore and Realtime Database can be tested locally using the Firebase emulators

```bash
# /rules
firebase serve --only firestore,database
npm test
```

Storage rules need to be tested using the [online simulator](https://firebase.google.com/docs/rules/simulator)

Test configuration is defined in `jest.config.js`

### Deploying rules

```bash
# full deploy of all services and rules
firebase deploy

# deploy an individual service
firebase deploy --only firestore

# deploy only the rules for a service
firebase deploy --only firestore:rules
```
