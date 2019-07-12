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
        const result = transform_info.transformSpreadsheetDoc(data);
        console.log('Fetched spreadsheet');
        return Promise.resolve(result);
      });

    // Update the record of the spreadsheet document into fs_score_info
    // It is possible to have multiple spreadsheets by passing in a different id
    const db = admin.firestore();
    const infoRef = db.collection(`fs_score_info`).doc(sheetId);
    await db.runTransaction(tx => {
      spreadsheet.lastFetch = score_repository.createDate(new Date());
      tx.set(infoRef, spreadsheet);
      return Promise.resolve(true);
    });

    const writeScoreToFireStore = scoreData => {
      if (!scoreData.crop.name) {
        return Promise.reject(new Error(`Transformed document is invalid`));
      } else {
        let scoreRef = db.collection(`fs_crop_scores`).doc(scoreData.crop.name);
        return db.runTransaction(tx => {
          console.log(`Writing crop score to FireStore: ${scoreData.crop.name}`);
          scoreData.meta = {
            spreadsheetId: sheetId,
            updated: score_repository.createDate(new Date()),
          };
          tx.set(scoreRef, scoreData);
          return Promise.resolve(scoreData.crop.name);
        });
      }
    };
    let crops = [];
    if (spreadsheet.scoreMatrix) {
      const sheetData = await sheets_helper.fetchSheetValues(
        spreadsheet.scoreMatrix,
        apiauth,
        sheetId,
        apiKey
      );
      const cropsData = transform_score.transformCropScores(sheetData);
      console.log(`Processing ${cropsData.length} crop scores`);

      crops = await Promise.all(cropsData.map(crop => writeScoreToFireStore(crop)));
      console.log(`Uploaded crop scores: ${crops}`);

      // Delete any crop record that is not in the spreadsheet.
      score_repository.deleteOrphanCropScores(db.collection(`fs_crop_scores`), sheetId, crops);
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
