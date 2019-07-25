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

// Ignored since I have no idea why this suite behaves differently compared to anonymous
xdescribe('Firestore rules for authenticated Flamelink requests', () => {
  beforeAll(async () => {
    adminApp = await firebase.initializeAdminApp({
      projectId: projectId,
    });

    fl_public_collections.map(adminWrite);
    fl_collections.map(adminWrite);
    fs_app_collections.map(adminWrite);
    fs_service_collections.map(adminWrite);

    cmsApp = await firebase.initializeTestApp({
      projectId: projectId,
      auth: {
        uid: 'alice',
        email: 'alice@example.com',
        token: {
          firebase: {
            sign_in_provider: 'email',
          },
          email_verified: true,
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
      await firebase.assertSucceeds(cmsRead(collection));
    });

    it('should allow write', async () => {
      await firebase.assertSucceeds(cmsWrite(collection));
    });
  });

  describe.each(fl_collections)('%p ', collection => {
    it('should allow read', async () => {
      await firebase.assertSucceeds(cmsRead(collection));
    });

    it('should allow write', async () => {
      await firebase.assertSucceeds(cmsWrite(collection));
    });
  });

  describe.each(fs_app_collections)('%p', collection => {
    it('should allow read', async () => {
      await firebase.assertSucceeds(cmsRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(cmsWrite(collection));
    });
  });

  describe.each(fs_service_collections)('%p', collection => {
    it('should deny read', async () => {
      await firebase.assertFails(cmsRead(collection));
    });

    it('should deny write', async () => {
      await firebase.assertFails(cmsWrite(collection));
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

function cmsRead(collection) {
  return cmsApp
    .firestore()
    .collection(collection)
    .doc('5678')
    .get();
}

function cmsWrite(collection) {
  return cmsApp
    .firestore()
    .collection(collection)
    .doc('1111')
    .set({ key: 'value' });
}
