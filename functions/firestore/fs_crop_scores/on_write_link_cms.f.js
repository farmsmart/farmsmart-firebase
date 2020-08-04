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

  // new attribute qualifierName representing crop name - scoreChange.doc.crop.qualifierName
  if (scoreChange.isDelete) {
    console.log('Executing score change delete for crop :' + scoreChange.doc.crop.name);
    await db
      .collection('fs_crop_score_cms_link')
      .where('cropName', '==', scoreChange.doc.crop.qualifierName)
      .get()
      .then(link => {
        link.forEach(async snapshot => {
          score_repository.deleteLink(db.collection('fs_crop_score_cms_link'), snapshot.id);
        });
        return Promise.resolve(true);
      });
  } else if (scoreChange.isInsert) {
    let cropQualifierName = scoreChange.doc.crop.qualifierName;
    console.log('Executing score change insert for crop:' + cropQualifierName);
    const main = await db
      .collection('fl_content')
      .where('_fl_meta_.schema', '==', 'crop')
      .where('recommendationEngineCropName', '==', cropQualifierName)
      .where('status', '==', 'PUBLISHED')
      .get();

    if (!main) {
      console.log('No crop schema doc found for crop ' + cropQualifierName);
    } else {
      console.log('Keys for main : ' + Object.keys(main));
    }

    //In reality there should only be one cms document found.
    console.log('Beginning to create link for crop :' + cropQualifierName);
    main.forEach(async cmsCrop => {
      let cropData = cmsCrop.data();
      console.log('recEngineCropName is :' + cropData.recommendationEngineCropName);
      let cropName = cropData.recommendationEngineCropName;
      let locale = cropData._fl_meta_.locale;
      let environment = cropData._fl_meta_.env;
      const cropScoresRef = db.collection('fs_crop_scores');
      const cropScoreCmsLinkRef = db.collection('fs_crop_score_cms_link');
      let territory = locale
        .split('-')[1]
        .toUpperCase()
        .trim();
      let cropScoreLookUpName = cropName.trim() + '_' + territory;
      console.log(
        'Executing create link for crop :' + cropName + ' and lookup name :' + cropScoreLookUpName
      );
      await score_repository.createLinkIfScoreExists(
        cropScoresRef,
        cropScoreCmsLinkRef,
        cropName,
        cropScoreLookUpName,
        cmsCrop.id,
        locale,
        environment
      );
    });
  }
  return null;
}
