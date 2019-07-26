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
  cmsDocId,
  cmsLocale,
  cmsEnvironment
) {
  const score = await scoresRef.doc(cropName).get();
  if (score.exists) {
    console.log(`Creating crop link: ${cropName} to ${cmsDocId} in ${linksRef.path} `);
    await linksRef
      .doc(cmsDocId)
      .set({ cropName: cropName, cmsCropId: cmsDocId, locale: cmsLocale, env: cmsEnvironment });
  }
};

exports.deleteLink = async function(linksRef, cmsDocId) {
  console.log(`Removing ${cmsDocId} from ${linksRef.path} `);
  await linksRef.doc(cmsDocId).delete();
};

exports.createDate = function() {
  return admin.firestore.Timestamp.fromDate(new Date());
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
  if (!scoreData.crop.name) {
    return Promise.reject(new Error(`Transformed document is invalid`));
  } else {
    const scoreRef = db.collection(collection).doc(scoreData.crop.name);
    return db.runTransaction(tx => {
      console.log(`Writing crop score to FireStore: ${scoreData.crop.name}`);
      scoreData.meta = {
        spreadsheetId: sheetId,
        updated: createDate(new Date()),
      };
      tx.set(scoreRef, scoreData);
      return Promise.resolve(scoreData.crop.name);
    });
  }
};

exports.updateSpreadsheet = async function(infoRef, spreadsheet) {
  return db.runTransaction(tx => {
    spreadsheet.lastFetch = score_repository.createDate(new Date());
    tx.set(infoRef, spreadsheet);
    return Promise.resolve(true);
  });
};
