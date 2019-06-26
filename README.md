# farmsmart-firebase

[![CircleCI](https://circleci.com/gh/farmsmart/farmsmart-firebase.svg?style=svg)](https://circleci.com/gh/farmsmart/farmsmart-firebase)

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
