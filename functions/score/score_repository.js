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
