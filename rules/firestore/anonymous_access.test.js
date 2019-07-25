const firebase = require('@firebase/testing');
const fs = require('fs');
const {
  fl_public_collections,
  fl_collections,
  fs_app_collections,
  fs_service_collections,
} = require('./collections');

const projectId = `project-${Date.now()}`;
// Firestore emulator must be running
// firebase serve --only firestore

describe('Firestore rules for anonymous requests', () => {
  beforeAll(async () => {
    adminApp = await firebase.initializeAdminApp({
      projectId: projectId,
    });

    fl_public_collections.map(adminWrite);
    fl_collections.map(adminWrite);
    fs_app_collections.map(adminWrite);
    fs_service_collections.map(adminWrite);

    anonymousApp = await firebase.initializeTestApp({
      projectId: projectId,
      auth: {
        uid: 'ABC',
        token: {
          firebase: {
            sign_in_provider: 'anonymous',
          },
        },
      },
    });

    await firebase.loadFirestoreRules({
      projectId: projectId,
      rules: fs.readFileSync('firestore/firestore.rules', 'utf8'),
    });
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });

  describe.each(fl_public_collections)('%p ', collection => {
    it('should allow read', async () => {
      await firebase.assertSucceeds(anonymousRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(anonymousWrite(collection));
    });
  });

  describe.each(fl_collections)('%p ', collection => {
    it('should deny read', async () => {
      await firebase.assertFails(anonymousRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(anonymousWrite(collection));
    });
  });

  describe.each(fs_app_collections)('%p', collection => {
    it('should allow read', async () => {
      await firebase.assertSucceeds(anonymousRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(anonymousWrite(collection));
    });
  });

  describe.each(fs_service_collections)('%p', collection => {
    it('should deny read', async () => {
      await firebase.assertFails(anonymousRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(anonymousWrite(collection));
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

function anonymousRead(collection) {
  return anonymousApp
    .firestore()
    .collection(collection)
    .doc('5678')
    .get();
}

function anonymousWrite(collection) {
  return anonymousApp
    .firestore()
    .collection(collection)
    .doc('5678')
    .set({ key: 'value' });
}
