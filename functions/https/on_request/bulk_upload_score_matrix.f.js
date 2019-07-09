const admin = require('firebase-admin');
const functions = require('firebase-functions');

const sheets_helper = require('../../score/sheets_helper');

const score_repository = require('../../score/score_repository');
const transform_info = require('../../score/transform_info');
const transform_score = require('../../score/transform_scorev2');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

exports = module.exports = functions.https.onRequest(handleBulkUploadScoreBySpreadsheet);

async function handleBulkUploadScoreBySpreadsheet(request, response) {
  try {
    const apiKey = functions.config().farmsmart.sheets.api.key;

    // Simple check to ensure that sheetId is the same as the configured sheet
    let sheetId = request.query.sheetId;
    if (!request.query.sheetId || sheetId != functions.config().farmsmart.scorematrix.doc.id) {
      throw Error('Missing or Invalid spreadsheet');
    }

    const apiauth = await sheets_helper.authenticateServiceAccount();

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
      tx.set(infoRef, spreadsheet);
      return Promise.resolve(true);
    });

    // Fetches sheet from google API => Transform into JSON document => Write to FireStore
    const transformResultData = data => {
      console.log(`Transforming sheet data into Crop Scores`);
      let result = transform_score.transformCropScores(data);
      return Promise.resolve(result);
    };
    const writeScoreToFireStore = scoreData => {
      if (!scoreData.crop.name) {
        return Promise.reject(new Error(`Transformed document is invalid`));
      } else {
        let scoreRef = db.collection(`fs_crop_scores`).doc(scoreData.crop.name);
        return db.runTransaction(tx => {
          console.log(`Writing crop score to FireStore: ${scoreData.crop.name}`);
          let meta = {};
          meta.spreadsheetId = sheetId;
          meta.updated = score_repository.createDate(new Date());
          scoreData.meta = meta;
          tx.set(scoreRef, scoreData);
          return Promise.resolve(scoreData.crop.name);
        });
      }
    };

    let crops = [];
    if (spreadsheet.scoreMatrix) {
      let cropsData = await sheets_helper
        .fetchSheetValues(spreadsheet.scoreMatrix, apiauth, sheetId, apiKey)
        .then(transformResultData);
      console.log(`Processing ${cropsData.length} crop scores`);

      crops = await Promise.all(cropsData.map(crop => writeScoreToFireStore(crop)));
      console.log(`Uploaded crop scores: ${crops}`);

      // Delete any crop record that is not in the spreadsheet.
      const cropScoreRef = db.collection(`fs_crop_scores`);
      const existingCrops = await cropScoreRef
        .where('meta.spreadsheetId', '==', sheetId)
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            return [];
          }
          return snapshot.docs.map(doc => doc.id);
        });
      let cropsToRemove = existingCrops.filter(crop => !crops.includes(crop));
      console.log(`Deleting crop scores: ${cropsToRemove} `);
      cropsToRemove.map(crop => cropScoreRef.doc(crop).delete());
    }

    console.log('Successfully processed spreadsheet');

    // Caches successful upload for a short time
    response.set('Cache-Control', 'private, max-age=120, s-maxage=240');
    response.status(200).send(`
      <html>
        <body>
          <h1>Score upload successful.</h1>
          <p>Sheet: ${spreadsheet.title}</p>
          <p>Fetch: ${new Date()}</p>
          <p>Crops processed: ${crops}</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.log(err);
    response.status(500).send(`FAILED: ${err.name} - ${err.message}`);
  }
}
