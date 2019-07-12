# farmsmart-firebase

Master: [![CircleCI](https://circleci.com/gh/farmsmart/farmsmart-firebase/tree/master.svg?style=svg)](https://circleci.com/gh/farmsmart/farmsmart-firebase/tree/master)

Develop: [![CircleCI](https://circleci.com/gh/farmsmart/farmsmart-firebase.svg?style=svg)](https://circleci.com/gh/farmsmart/farmsmart-firebase)

The FarmSmart is a mobile app providing tailored recommendations to farmers based on their location,
starting season, farming purpose (such as for profit), as well as details about their land.
In addition, the app will include the latest farming tips as well as links to various chat groups,
enabling farmers to communicate, share information and eventually sell their produce.

This repository contains the Firebase backend services such as Cloud Functions and Rules for Firestore and Cloud Storage.

## Get started

1. Install NodeJS. This project uses Node 8
2. Install the Firebase CLI

```bash
npm install -g firebase-tools
```

3. clone the farmsmart-firebase project
4. install git submodule dependencies

```bash
git submodule update --init --recursive
```

5. install node package dependencies

```bash
npm install
```

6. you can now work within each of the project directories e.g.

```bash
cd functions
npm test
```

## CI/CD

_For development deployments_
This repository is connected to CircleCI to run tests and deploys to a firebase project.
Commits to feature/, develop, release/ and master branches will trigger a build and deploys to pre production projects automatically.

feature branches deploys to a feature project
develop branch deploys to the develop project
release branches deploys to release project

## Release Management

_For production deployments_
Commits to master branch will trigger a build and deployment. This deployment requires a manual approval step in CircleCI.
A member of the team with push privilege should visit CircleCI and approve the workflow step that is on hold.

Release tags can be created following the format: v1.0.0
Release tags will trigger a build on CircleCI and will require manual approval before new code is deployed to Firebase.
