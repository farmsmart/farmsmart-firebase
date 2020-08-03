const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

exports.createLinkIfScoreExists = async function(
  scoresRef,
  linksRef,
  cropName,
  cropScoreLookUpName,
  cmsDocId,
  cmsLocale,
  cmsEnvironment
) {
  let score = await buildCMSLinkCropScores(scoresRef, cropName, cropScoreLookUpName);
  console.log('Executing createLinkIfScoreExists');
  if (score !== '') {
    console.log(`Creating crop link: ${cropScoreLookUpName} to ${cmsDocId} in ${linksRef.path} `);
    await linksRef.doc(cmsDocId).set({
      cropName: cropName,
      cmsCropId: cmsDocId,
      locale: cmsLocale,
      env: cmsEnvironment,
      score: score,
    });
  } else {
    console.log(`No scores derived for crop : ${cropName} `);
  }
};

exports.deleteLink = async function(linksRef, cmsDocId) {
  console.log(`Removing ${cmsDocId} from ${linksRef.path} `);
  await linksRef.doc(cmsDocId).delete();
};

exports.createDate = function() {
  return toFirebaseDate(new Date());
};

exports.deleteOrphanCropScores = async function(cropScoreRef, sheetId, newCrops) {
  const snapshot = await cropScoreRef.where('meta.spreadsheetId', '==', sheetId).get();
  if (snapshot.empty) {
    return [];
  }
  const existingCrops = snapshot.docs.map(doc => doc.id);

  const cropsToRemove = existingCrops.filter(crop => !newCrops.includes(crop));
  if (cropsToRemove.length > 0) {
    console.log(`Deleting crop scores: ${cropsToRemove} `);
    cropsToRemove.map(crop => cropScoreRef.doc(crop).delete());
  }
};

exports.writeScoreToFireStore = function(scoreData, sheetId, db, collection) {
  if (!scoreData.crop || !scoreData.crop.name) {
    return Promise.reject(new Error(`Transformed document is invalid`));
  } else {
    const scoreRef = db.collection(collection).doc(scoreData.crop.name);
    return db.runTransaction(tx => {
      console.log(`Writing crop score to FireStore: ${scoreData.crop.name}`);
      scoreData.meta = {
        spreadsheetId: sheetId,
        updated: toFirebaseDate(new Date()),
      };
      tx.set(scoreRef, scoreData);
      return Promise.resolve(scoreData.crop.name);
    });
  }
};

exports.updateSpreadsheet = async function(db, infoRef, spreadsheet) {
  return db.runTransaction(tx => {
    spreadsheet.lastFetch = toFirebaseDate(new Date());
    tx.set(infoRef, spreadsheet);
    return Promise.resolve(true);
  });
};

async function buildCMSLinkCropScores(scoresRef, cropName, cropScoreLookUpName) {
  let docsSnapShot = await scoresRef.get().then(collection => {
    return collection.docs.map(doc => doc.data());
  });
  console.log(`Creating score link for crop : ${cropScoreLookUpName}`);
  let score = '';
  for (let doc of docsSnapShot) {
    if (doc.crop.name === cropScoreLookUpName) {
      score = doc.crop.name;
      break;
    }
  }
  if (score !== '') {
    console.log(`CMS link crop score for crop: ${cropName} is ${score} `);
  } else {
    console.log(`No score found for crop: ${cropName}`);
  }
  return score;
}

function toFirebaseDate(date) {
  return admin.firestore.Timestamp.fromDate(date);
}
