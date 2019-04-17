const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const gsheets = google.sheets('v4');
const datahelper = require('./datahelper');
const transform_info = require('./transform_info');
const transform_score = require('./transform_score');

try {
  admin.initializeApp();
} catch (err) {}

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

async function handleAttachCropScoreToCmsCrop(change, context) {
  const current = change.after.data();
  const previous = change.before.data();

  const scoreChange = datahelper.getScoreChange(current, previous);

  if (!scoreChange.isChange) {
    console.log('No changes detected Ignoring event.');
    return null;
  }

  console.log('Detected a Crop Score change, computing CMS crop relationships.');

  let db = admin.firestore();
  let cmsRef = db.collection('fl_content');
  let linksRef = db.collection('fs_crop_score_cms_link');
  let scoresRef = db.collection('fs_crop_scores');

  if (scoreChange.isDelete) {
    await linksRef
      .where('crop', '==', scoreChange.doc.crop.title)
      .get()
      .then(link => {
        link.forEach(async snapshot => {
          deleteLink(linksRef, snapshot.id);
        });
        return Promise.resolve(true);
      });
  } else if (scoreChange.isInsert) {
    let cropName = scoreChange.doc.crop.title;
    const main = await cmsRef
      .where('_fl_meta_.locale', '==', 'en-US')
      .where('_fl_meta_.schema', '==', 'crop')
      .where('name', '==', cropName)
      .get();
    // In reality there should only be one cms document found
    main.forEach(async mainDoc => {
      const multiCmsCrops = await cmsRef
        .where('_fl_meta_.fl_id', '==', mainDoc.id)
        .where('status', '==', 'PUBLISHED')
        .get();
      // when multi language is enabled, then a main document can have more than 1 cms crops
      multiCmsCrops.forEach(cmsCrop => {
        let locale = cmsCrop.data()._fl_meta_.locale;
        let environment = cmsCrop.data()._fl_meta_.env;
        createLinkIfScoreExists(scoresRef, linksRef, cropName, cmsCrop.id, locale, environment);
      });
    });
  }
  return null;
}

const createLinkIfScoreExists = async (
  scoresRef,
  linksRef,
  cropName,
  cmsDocId,
  cmsLocale,
  cmsEnvironment
) => {
  const score = await scoresRef.doc(cropName).get();
  if (score.exists) {
    console.log(`Creating crop link: ${cropName} to ${cmsDocId} in ${linksRef.path} `);
    await linksRef
      .doc(cmsDocId)
      .set({ crop: cropName, cmsCropId: cmsDocId, locale: cmsLocale, env: cmsEnvironment });
  }
};
const deleteLink = async (linksRef, cmsDocId) => {
  console.log(`Removing ${cmsDocId} from ${linksRef.path} `);
  await linksRef.doc(cmsDocId).delete();
};

async function handleAttachCmsCropToCropScore(change, context) {
  const current = change.after.data();
  const previous = change.before.data();

  const cmsCropChange = datahelper.getCmsCropChange(current, previous);

  if (!cmsCropChange || !cmsCropChange.isChange) {
    return null;
  }

  console.log(`Detected CMS Crop Change for a crop ${context.params.cmsCrop}`);

  let db = admin.firestore();
  let cmsRef = db.collection('fl_content');
  let scoresRef = db.collection('fs_crop_scores');
  let linksRef = db.collection('fs_crop_score_cms_link');

  if (cmsCropChange.isDelete || !cmsCropChange.isPublished) {
    // Delete when a cms crop is deleted or unpublished
    deleteLink(linksRef, cmsCropChange.docId);
  } else if (cmsCropChange.isMainDocument && cmsCropChange.isPublished) {
    createLinkIfScoreExists(
      scoresRef,
      linksRef,
      cmsCropChange.doc.name,
      cmsCropChange.docId,
      cmsCropChange.doc._fl_meta_.locale,
      cmsCropChange.doc._fl_meta_.env
    );
  } else if (!cmsCropChange.isMainDocument && cmsCropChange.isPublished) {
    // find the main document of this cmsCrop to fetch the crop name used for association
    let main = await cmsRef.doc(cmsCropChange.cropDocId).get();
    if (main.exists) {
      let crop = main.data().name;
      createLinkIfScoreExists(
        scoresRef,
        linksRef,
        crop,
        cmsCropChange.docId,
        cmsCropChange.doc._fl_meta_.locale,
        cmsCropChange.doc._fl_meta_.env
      );
    }
  }

  return null;
}

/**
 * Detects changes to a crop and associates that to published CMS crops
 */
exports.attachCropScoreToCmsCrop = functions.firestore
  .document('fs_crop_scores/{crop}')
  .onWrite(handleAttachCropScoreToCmsCrop);
/**
 * Detects changes to CMS crop and finds crop score and creates an association
 * if document status is not published, remove the association
 * if document is deleted, remove the association. if multi language ensure
 */
exports.attachCmsCropToCropScore = functions.firestore
  .document('fl_content/{cmsCrop}')
  .onWrite(handleAttachCmsCropToCropScore);

/**
 * Reads from a google spreadsheet and write to fs_crop_scores
 */
exports.processCropScores = functions.https.onRequest(handleBulkUploadScoreBySpreadsheet);

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase!');
});

const glob = require('glob');
const camelCase = require('camelcase');
const files = glob.sync('./**/*.f.js', { cwd: __dirname, ignore: './node_modules/**' });
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const functionName = camelCase(
    file
      .slice(0, -5)
      .split('/')
      .join('_')
  );
  if ((process.env.FUNCTION_NAME || functionName) === functionName) {
    exports[functionName] = require(file);
  }
}
