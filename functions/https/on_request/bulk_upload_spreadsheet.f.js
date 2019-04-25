const admin = require('firebase-admin');
const functions = require('firebase-functions');
const datahelper = require('../../score/datahelper');

const { google } = require('googleapis');
const gsheets = google.sheets('v4');

const transform_info = require('../../score/transform_info');
const transform_score = require('../../score/transform_score');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

exports = module.exports = functions.https.onRequest(handleBulkUploadScoreBySpreadsheet);

async function handleBulkUploadScoreBySpreadsheet(request, response) {
  try {
    const apiKey = functions.config().farmsmart.sheets.api.key;

    // Retrieve the spreadsheet information either from default
    //  or a different spreadsheet.
    let sheetId;
    if (!request.query.sheetId) {
      sheetId = functions.config().farmsmart.scorematrix.doc.id;
    } else {
      sheetId = request.query.sheetId;
    }

    const apiauth = await google.auth.getClient({
      scopes: 'https://sheets.googleapis.com/v4/spreadsheets',
    });

    console.log(`Processing worksheet ${sheetId}`);
    const requestContext = {
      spreadsheetId: sheetId,
      auth: apiauth,
      key: apiKey,
    };
    const spreadsheet = await gsheets.spreadsheets.get(requestContext).then(result => {
      console.log(`Successfully fetched worksheet ${result.data.properties.title}.`);
      return Promise.resolve(transform_info.transformSpreadsheetDoc(result.data));
    });
    // Update the record of the spreadsheet document into fs_score_info
    // It is possible to have multiple spreadsheets by passing in a different id
    let db = admin.firestore();
    const infoRef = db.collection(`fs_score_info`).doc(sheetId);
    await db.runTransaction(async tx => {
      spreadsheet.lastFetch = admin.firestore.Timestamp.fromDate(new Date());
      tx.set(infoRef, spreadsheet, { merge: true });
    });

    // Fetches sheet from google API => Transform into JSON document => Write to FireStore
    const transformResultData = data => {
      console.log(`Transforming sheet data into Crop Score`);
      return Promise.resolve(transform_score.transformCropScore(data));
    };
    const writeScoreToFireStore = scoreData => {
      if (!scoreData.crop.title) {
        return Promise.reject(new Error(`Transformed document is invalid`));
      } else {
        console.log(`Writing crop score to FireStore: ${scoreData.crop.title}`);
        let scoreRef = db.collection(`fs_crop_scores`).doc(scoreData.crop.title);
        return db.runTransaction(tx => {
          let meta = {};
          meta.spreadsheetId = sheetId;
          meta.updated = admin.firestore.Timestamp.fromDate(new Date());
          scoreData.meta = meta;
          tx.set(scoreRef, scoreData, { merge: true });
          return Promise.resolve(scoreData.crop.title);
        });
      }
    };
    const scorePromises = [];
    for (const sheetData of spreadsheet.cropSheets) {
      let promise = datahelper
        .fetchSheetValues(sheetData.sheet, apiauth, sheetId, apiKey)
        .then(transformResultData)
        .then(writeScoreToFireStore);
      scorePromises.push(promise);
    }
    console.log(`Processing ${scorePromises.length} score sheets.`);
    await Promise.all(scorePromises);

    response.status(200).send('OK');
  } catch (err) {
    console.log(err);
    response.status(500).send(`FAILED: ${err.name} - ${err.message}`);
  }
}
