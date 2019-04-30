const admin = require('firebase-admin');
const functions = require('firebase-functions');

const sheets_helper = require('../../score/sheets_helper');

const score_repository = require('../../score/score_repository');
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

    const apiauth = await sheets_helper.authenticate();

    console.log(`Processing worksheet ${sheetId}`);

    const spreadsheet = await sheets_helper
      .fetchSpreadsheet(sheetId, apiauth, apiKey)
      .then(data => {
        let result = transform_info.transformSpreadsheetDoc(data);
        console.log('Fetched spreadsheet');
        return Promise.resolve(result);
      });

    // Update the record of the spreadsheet document into fs_score_info
    // It is possible to have multiple spreadsheets by passing in a different id
    let db = admin.firestore();
    const infoRef = db.collection(`fs_score_info`).doc(sheetId);
    await db.runTransaction(tx => {
      spreadsheet.lastFetch = score_repository.createDate(new Date());
      tx.set(infoRef, spreadsheet, { merge: true });
      return Promise.resolve(true);
    });

    // Fetches sheet from google API => Transform into JSON document => Write to FireStore
    const transformResultData = data => {
      console.log(`Transforming sheet data into Crop Score`);
      let result = transform_score.transformCropScore(data);
      return Promise.resolve(result);
    };
    const writeScoreToFireStore = scoreData => {
      if (!scoreData.crop.title) {
        return Promise.reject(new Error(`Transformed document is invalid`));
      } else {
        let scoreRef = db.collection(`fs_crop_scores`).doc(scoreData.crop.title);
        return db.runTransaction(tx => {
          console.log(`Writing crop score to FireStore: ${scoreData.crop.title}`);
          let meta = {};
          meta.spreadsheetId = sheetId;
          meta.updated = score_repository.createDate(new Date());
          scoreData.meta = meta;
          tx.set(scoreRef, scoreData, { merge: true });
          return Promise.resolve(scoreData.crop.title);
        });
      }
    };
    const scorePromises = [];
    for (const sheetData of spreadsheet.cropSheets) {
      let promise = sheets_helper
        .fetchSheetValues(sheetData.sheet, apiauth, sheetId, apiKey)
        .then(transformResultData)
        .then(writeScoreToFireStore);
      scorePromises.push(promise);
    }
    console.log(`Processing ${scorePromises.length} score sheets.`);
    await Promise.all(scorePromises);

    console.log('Successfully processed spreadsheet');
    response.status(200).send('OK');
  } catch (err) {
    console.log(err);
    response.status(500).send(`FAILED: ${err.name} - ${err.message}`);
  }
}
