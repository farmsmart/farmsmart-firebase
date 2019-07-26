const firestore = require('../../utils/firestore_repository');
const config = {
  projectId: 'farmsmart-development',
  databaseURL: 'https://farmsmart-development.firebaseio.com',
};
const test = require('firebase-functions-test')(
  config,
  './.credentials/testing-service-account-key.json'
);
const { firestoreFlContentOnWriteLinkCropscore } = require('../../index');
const wrappedLinkCropscore = test.wrap(firestoreFlContentOnWriteLinkCropscore);

const cropPath = id => `fl_content/${id}`;
const scorePath = id => `fs_crop_scores/${id}`;
const linkPath = id => `fs_crop_score_cms_link/${id}`;

const change = (data, id) => {
  const beforeSnap = test.firestore.exampleDocumentSnapshot();
  const afterSnap = test.firestore.makeDocumentSnapshot(data, cropPath(id));
  return test.makeChange(beforeSnap, afterSnap);
};

const deleteChange = (data, id) => {
  const beforeSnap = test.firestore.makeDocumentSnapshot(data, cropPath(id));
  const afterSnap = test.firestore.makeDocumentSnapshot({}, cropPath(id));
  return test.makeChange(beforeSnap, afterSnap);
};

const tryDelete = async path => {
  try {
    await firestore.deleteDocument(path);
  } catch (error) {
    // emulator throws when firestore attempts to delete non existing record
  }
};

describe('Link crop scores to crops on write', () => {
  const sampleCrop = require('../../model/json/crop.sample.json');

  const mainId = 'xxMAINBEETSxx';
  const mainName = 'MainBeets';
  const mainCrop = {
    ...sampleCrop,
    name: mainName,
    _fl_meta_: { ...sampleCrop._fl_meta_, docId: mainId, fl_id: mainId },
  };

  const translatedId = 'xxTRANSLATEDBEETSxx';
  const translatedName = 'TranslatedBeets';
  const translatedCrop = {
    ...sampleCrop,
    name: translatedName,
    _fl_meta_: { ...sampleCrop._fl_meta_, docId: translatedId, fl_id: mainId },
  };

  afterEach(async () => {
    await tryDelete(linkPath(mainId));
    await tryDelete(linkPath(translatedId));
    await tryDelete(scorePath(mainName));
    await tryDelete(scorePath('RenamedCrop'));
    await tryDelete(cropPath(mainId));
    await tryDelete(cropPath(translatedId));
  });

  it('should create a link if the main (en-us) crop is published', async () => {
    // insert score data
    await firestore.writeDocument(scorePath(mainName), { crop: { name: mainName } });

    // create crop change with published main crop
    await wrappedLinkCropscore(change(mainCrop, mainId));

    // assert link created and confirm id and name
    const link = await firestore.getDocument(linkPath(mainId));
    expect(link.exists).toBe(true);
    expect(link.data().cropName).toBe(mainName);
  });

  it('should create a link for translated crops if the main crop exists', async () => {
    // insert main crop
    await firestore.writeDocument(cropPath(mainId), mainCrop);

    // insert translated crop
    await firestore.writeDocument(cropPath(translatedId), translatedCrop);

    // insert score data
    await firestore.writeDocument(scorePath(mainName), { crop: { name: mainName } });

    // create crop change with published translated crop
    await wrappedLinkCropscore(change(translatedCrop, translatedId));

    // assert link created and confirm id and name
    const link = await firestore.getDocument(linkPath(translatedId));
    expect(link.exists).toBe(true);
    expect(link.data().cropName).toBe(mainName);
  });

  it('should not create a link for translated crops if the main crop is missing', async () => {
    // insert translated crop
    await firestore.writeDocument(cropPath(translatedId), translatedCrop);

    await new Promise(done => setTimeout(done, 500));

    // insert score data
    await firestore.writeDocument(scorePath(mainName), { crop: { name: mainName } });

    await new Promise(done => setTimeout(done, 500));

    // create crop change with published translated crop
    await wrappedLinkCropscore(change(translatedCrop, translatedId));

    await new Promise(done => setTimeout(done, 1000));

    // assert link not created
    const link = await firestore.getDocument(linkPath(translatedId));
    expect(link.exists).toBe(false);
  });

  it('should update link if crop name is changed', async () => {
    // insert main crop
    await firestore.writeDocument(cropPath(mainId), mainCrop);

    const renamedCrop = { ...mainCrop, name: 'RenamedCrop' };

    // insert score data
    await firestore.writeDocument(scorePath(renamedCrop.name), {
      crop: { name: renamedCrop.name },
    });

    // insert link
    await firestore.writeDocument(linkPath(mainId), { cropName: mainName });

    // create crop change with renamed main crop
    await wrappedLinkCropscore(change(renamedCrop, mainId));

    // assert link created and confirm id and name
    const link = await firestore.getDocument(linkPath(mainId));
    expect(link.exists).toBe(true);
    expect(link.data().cropName).toBe(renamedCrop.name);
  });

  it('should delete link if the crop is unpublished', async () => {
    // insert link
    await firestore.writeDocument(linkPath(mainId), { cropName: mainName });

    // create crop change with unpublished crop
    const unpublishedCrop = { ...mainCrop, status: 'DRAFT' };
    await wrappedLinkCropscore(change(unpublishedCrop, mainId));

    // assert link is deleted
    const link = await firestore.getDocument(linkPath(mainId));
    expect(link.exists).toBe(false);
  });

  it('should delete link if the crop is deleted', async () => {
    // insert main crop link
    await firestore.writeDocument(linkPath(mainId), { cropName: mainName });

    // insert translated crop link
    await firestore.writeDocument(linkPath(translatedId), { cropName: mainName });

    // create crop change to delete main crop
    await wrappedLinkCropscore(deleteChange(mainCrop, mainId));

    // assert both links are deleted
    const mainLink = await firestore.getDocument(linkPath(mainId));
    expect(mainLink.exists).toBe(false);
  });
});
