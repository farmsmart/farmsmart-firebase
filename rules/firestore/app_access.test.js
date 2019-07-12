const firebase = require('@firebase/testing');
const fs = require('fs');
const { fl_collections, fs_app_collections, fs_service_collections } = require('./collections');

const projectId = `project-${Date.now()}`;

// Firestore emulator must be running
// firebase serve --only firestore

describe('Firestore rules for authenticated app requests', () => {
  beforeAll(async () => {
    adminApp = await firebase.initializeAdminApp({
      projectId: projectId,
    });

    fl_collections.map(adminWrite);
    fs_app_collections.map(adminWrite);
    fs_service_collections.map(adminWrite);

    mobileApp = await firebase.initializeTestApp({
      projectId: projectId,
      auth: { uid: 'alice', email: 'alice@example.com' },
    });

    await firebase.loadFirestoreRules({
      projectId: projectId,
      rules: fs.readFileSync('firestore/firestore.rules', 'utf8'),
    });
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });

  describe.each(fl_collections)('%p ', collection => {
    it('should allow read', async () => {
      await firebase.assertSucceeds(mobileAppRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(mobileAppWrite(collection));
    });
  });

  describe.each(fs_app_collections)('%p', collection => {
    it('should allow read', async () => {
      await firebase.assertSucceeds(mobileAppRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(mobileAppWrite(collection));
    });
  });

  describe.each(fs_service_collections)('%p', collection => {
    it('should deny read', async () => {
      await firebase.assertFails(mobileAppRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(mobileAppWrite(collection));
    });
  });
});

function adminWrite(collection) {
  return adminApp
    .firestore()
    .collection(collection)
    .doc('5678')
    .set({ name: 'secret doc' });
}

function mobileAppRead(collection) {
  return mobileApp
    .firestore()
    .collection(collection)
    .doc('5678')
    .get();
}

function mobileAppWrite(collection) {
  return mobileApp
    .firestore()
    .collection(collection)
    .doc('5678')
    .set({ key: 'value' });
}
