# farmsmart-backend

The FarmSmart project is being run as part of Amido's CSR (Corporate Social Responsibility) initiative. 
Our primary deliverable is a mobile app providing tailored recommendations to farmers based on their location, 
starting season, farming purpose (such as for profit), as well as details about their land. 
In addition, the app will include the latest farming tips as well as links to various chat groups, 
enabling farmers to communicate, share information and eventually sell their produce.


# Setting up Firebase Cloud Functions Functions
[Firebase Function Quickstart Guide](https://firebase.google.com/docs/functions/get-started)

1. Install NodeJS. This project uses Node 8
2. Install the firebase CLI to global
```bash
$ npm install -g firebase-tools
```
3. Clone ``farmsmart-backend``
```bash
$ git clone https://github.com/amido/farmsmart-backend.git
$ cd functions
# Updates the firebase SDK used by the project. Persists in package.json 
$ npm install firebase-functions@latest firebase-admin@latest --save
$ npm install
```
4. Install Microsoft VS Code (or your preferred IDE for Node projects)

### Running Tests
For local testing ensure you go into the `functions` directory to run npm commands as defined
in `functions/package.json` file.
From the `farmsmart-backend` root directory
```
$ cd functions

# Run the unit tests

$ npm run lint
$ npm run test

```


## Farmsmart Cloud Function Environment configurations

``farmsmart.sheets.api.key`` - project config that holds the sheets api key used to access a google spreadsheet from the cloud function
``farmsmart.scorematrix.doc.id`` - the google spreadsheet document id to the score matrix data 


## Helpful Firebase Cloud functions commands
Firebase commands can be run from the `farmsmart-backend` root directory.

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


## Score data JSONPath queries

 [Sample Physical Model For Scores](./json-dcs/sample-crop-scores.json)

JSONP for the score models
```
$.scores[?(@.factor=='season')].values[?(@.key=='yes')].rating
```

JsonPath to retrieve all the scores for a given factor (ie intention)
```
$.scores[?(@.factor=='intention')].values
```

JsonPath for factors we have scores for: 
```
$.scores[*].factor
```

JsonPath for weightings we have scores for: 
```
$.scores[?(@.values)].factor
```

