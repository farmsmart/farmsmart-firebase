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
