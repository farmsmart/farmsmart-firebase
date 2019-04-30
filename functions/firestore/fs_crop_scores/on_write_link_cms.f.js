const admin = require('firebase-admin');
const functions = require('firebase-functions');
const datahelper = require('../../score/datahelper');
const score_repository = require('../../score/score_repository');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

exports = module.exports = functions.firestore
  .document('fs_crop_scores/{crop}')
  .onWrite(handleAttachCropScoreToCmsCrop);

async function handleAttachCropScoreToCmsCrop(change, context) {
  const current = change.after.data();
  const previous = change.before.data();

  const scoreChange = datahelper.getScoreChange(current, previous);

  if (!scoreChange.isChange) {
    console.log('No changes detected Ignoring event.');
    return null;
  }

  console.log('Detected a Crop Score change, computing CMS crop relationships.');

  const db = admin.firestore();

  if (scoreChange.isDelete) {
    await db
      .collection('fs_crop_score_cms_link')
      .where('crop', '==', scoreChange.doc.crop.title)
      .get()
      .then(link => {
        link.forEach(async snapshot => {
          score_repository.deleteLink(db.collection('fs_crop_score_cms_link'), snapshot.id);
        });
        return Promise.resolve(true);
      });
  } else if (scoreChange.isInsert) {
    let cropName = scoreChange.doc.crop.title;
    const main = await db
      .collection('fl_content')
      .where('_fl_meta_.locale', '==', 'en-US')
      .where('_fl_meta_.schema', '==', 'crop')
      .where('name', '==', cropName)
      .get();
    // In reality there should only be one cms document found
    main.forEach(async mainDoc => {
      const multiCmsCrops = await db
        .collection('fl_content')
        .where('_fl_meta_.fl_id', '==', mainDoc.id)
        .where('status', '==', 'PUBLISHED')
        .get();
      // when multi language is enabled, then a main document can have more than 1 cms crops
      multiCmsCrops.forEach(async cmsCrop => {
        let cropData = cmsCrop.data();
        let locale = cropData._fl_meta_.locale;
        let environment = cropData._fl_meta_.env;
        const cropScoresRef = db.collection('fs_crop_scores');
        const cropScoreCmsLinkRef = db.collection('fs_crop_score_cms_link');
        await score_repository.createLinkIfScoreExists(
          cropScoresRef,
          cropScoreCmsLinkRef,
          cropName,
          cmsCrop.id,
          locale,
          environment
        );
      });
    });
  }
  return null;
}
