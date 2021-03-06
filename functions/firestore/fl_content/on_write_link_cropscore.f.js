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
  .document('fl_content/{cmsCrop}')
  .onWrite(handleAttachCmsCropToCropScore);

async function handleAttachCmsCropToCropScore(change, context) {
  const current = change.after.data();
  const previous = change.before.data();

  const cmsCropChange = datahelper.getCmsCropChange(current, previous);
  if (!cmsCropChange || !cmsCropChange.isChange) {
    console.log(`No Changes detected .`);
    return null;
  }

  console.log(`Detected CMS Crop Change for a crop ${context.params.cmsCrop}`);

  let db = admin.firestore();
  let cmsRef = db.collection('fl_content');
  let scoresRef = db.collection('fs_crop_scores');
  let linksRef = db.collection('fs_crop_score_cms_link');

  if (cmsCropChange.isDelete || !cmsCropChange.isPublished) {
    // Delete when a cms crop is deleted or unpublished
    console.log(`Executing delete link .`);
    await score_repository.deleteLink(linksRef, cmsCropChange.docId);
  } else if (cmsCropChange.isMainDocument && cmsCropChange.isPublished) {
    console.log('Creating link when crop change is a main doc  :' + cmsCropChange.docId);
    let locale = cmsCropChange.doc._fl_meta_.locale;
    let recommendationEngineCropName = cmsCropChange.doc.recommendationEngineCropName;
    let cropScoreLookUpName =
      recommendationEngineCropName.trim() +
      '_' +
      locale
        .split('-')[1]
        .toUpperCase()
        .trim();
    console.log('recommendationEngineCropName is  :' + recommendationEngineCropName);
    await score_repository.createLinkIfScoreExists(
      scoresRef,
      linksRef,
      recommendationEngineCropName,
      cropScoreLookUpName,
      cmsCropChange.docId,
      locale,
      cmsCropChange.doc._fl_meta_.env
    );
  } else if (!cmsCropChange.isMainDocument && cmsCropChange.isPublished) {
    console.log('Creating link when crop change is a not a main doc  :' + cmsCropChange.docId);
    // find the main document of this cmsCrop to fetch the crop name used for association
    let main = await cmsRef.doc(cmsCropChange.cropDocId).get();
    if (main.exists) {
      let locale = cmsCropChange.doc._fl_meta_.locale;
      let recommendationEngineCropName = cmsCropChange.doc.recommendationEngineCropName;
      let cropScoreLookUpName =
        recommendationEngineCropName.trim() +
        '_' +
        locale
          .split('-')[1]
          .toUpperCase()
          .trim();
      console.log(
        'Action for  doc:' + cmsCropChange.docId + ' and lookup name is : ' + cropScoreLookUpName
      );
      await score_repository.createLinkIfScoreExists(
        scoresRef,
        linksRef,
        recommendationEngineCropName,
        cropScoreLookUpName,
        cmsCropChange.docId,
        locale,
        cmsCropChange.doc._fl_meta_.env
      );
    }
  }
  return null;
}
