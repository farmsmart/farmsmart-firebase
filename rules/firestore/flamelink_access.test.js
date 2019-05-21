const firebase = require('@firebase/testing');
const fs = require('fs');
const { fl_collections, fs_app_collections, fs_service_collections } = require('./collections');

const projectId = `project-${Date.now()}`;

// Firestore emulator must be running
// firebase serve --only firestore

describe('Firestore rules for authenticated Flamelink requests', () => {
  beforeAll(async () => {
    adminApp = await firebase.initializeAdminApp({
      projectId: projectId,
    });

    fl_collections.map(adminWrite);
    fs_app_collections.map(adminWrite);
    fs_service_collections.map(adminWrite);

    await adminApp
      .firestore()
      .collection('fl_users')
      .doc('fluser')
      .set({ email: 'fluser@flamelink.com' });

    flamelinkApp = await firebase.initializeTestApp({
      projectId: projectId,
      auth: { uid: 'fluser', email: 'fluser@flamelink.com' },
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
      await firebase.assertSucceeds(flamelinkRead(collection));
    });

    it('should allow write', async () => {
      await firebase.assertSucceeds(flamelinkWrite(collection));
    });
  });

  describe.each(fs_app_collections)('%p', collection => {
    it('should allow read', async () => {
      await firebase.assertSucceeds(flamelinkRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(flamelinkWrite(collection));
    });
  });

  describe.each(fs_service_collections)('%p', collection => {
    it('should deny read', async () => {
      await firebase.assertFails(flamelinkRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(flamelinkWrite(collection));
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

function flamelinkRead(collection) {
  return flamelinkApp
    .firestore()
    .collection(collection)
    .doc('5678')
    .get();
}

function flamelinkWrite(collection) {
  return flamelinkApp
    .firestore()
    .collection(collection)
    .doc('1111')
    .set({ key: 'value' });
}
