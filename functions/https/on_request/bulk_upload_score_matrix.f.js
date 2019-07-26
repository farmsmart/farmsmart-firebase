const admin = require('firebase-admin');
const functions = require('firebase-functions');

const sheets_helper = require('../../score/sheets_helper');

const score_repository = require('../../score/score_repository');
const transform_info = require('../../score/transform_info');
const transform_score = require('../../score/transform_scorev2');
const transform_reference = require('../../score/transform_reference');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

exports = module.exports = functions.https.onRequest(handleBulkUploadScoreBySpreadsheet);

const SCORES_COLLECTION = 'fs_crop_scores';
const REF_COLLECTION = 'fs_factors';
const SHEET_INFO_COLLECTION = 'fs_score_info';

async function handleBulkUploadScoreBySpreadsheet(request, response) {
  try {
    const apiKey = functions.config().farmsmart.sheets.api.key;

    // Simple check to ensure that sheetId is the same as the configured sheet
    const sheetId = request.query.sheetId;
    if (!request.query.sheetId || sheetId != functions.config().farmsmart.scorematrix.doc.id) {
      throw Error('Missing or Invalid spreadsheet');
    }

    const apiauth = await sheets_helper.authenticateServiceAccount();

    console.log(`Processing worksheet ${sheetId}`);
    const data = await sheets_helper.fetchSpreadsheet(sheetId, apiauth, apiKey);
    const spreadsheet = transform_info.transformSpreadsheetDoc(data);
    console.log('Fetched spreadsheet information');

    // Update the record of the spreadsheet document into fs_score_info
    // It is possible to have multiple spreadsheets by passing in a different id
    const db = admin.firestore();
    const infoRef = db.collection(SHEET_INFO_COLLECTION).doc(sheetId);
    await score_repository.updateSpreadsheet(infoRef, spreadsheet);

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

      crops = await Promise.all(
        cropsData.map(crop =>
          score_repository.writeScoreToFireStore(crop, sheetId, db, SCORES_COLLECTION)
        )
      );
      console.log(`Uploaded crop scores: ${crops}`);

      // Delete any crop record that is not in the spreadsheet.
      score_repository.deleteOrphanCropScores(db.collection(SCORES_COLLECTION), sheetId, crops);
    }

    if (spreadsheet.reference) {
      const sheetData = await sheets_helper.fetchSheetValues(
        spreadsheet.reference,
        apiauth,
        sheetId,
        apiKey
      );
      const factors = transform_reference.transformFactors(sheetData);
      console.log(`Processing ${cropsData.length} reference`);

      await score_repository.writeScoreToFireStore(factors, sheetId, db, REF_COLLECTION);
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
