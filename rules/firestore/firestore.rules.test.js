const firebase = require('@firebase/testing');
const fs = require('fs');

const projectId = `project-${Date.now()}`;
let adminApp;
let mobileApp;
let flamelinkApp;

const fl_collections = [
  'fl_content',
  'fl_environments',
  'fl_files',
  'fl_folders',
  'fl_locales',
  'fl_permissions',
  'fl_schemas',
  'fl_settings',
  'fl_users',
];

const fs_collections = ['fs_crop_scores', 'fs_crop_score_cms_link'];

const service_collections = ['fs_score_info', 'fs_content_errors'];

// Firestore emulator must be running
// firebase serve --only firestore

describe('Firestore rules', () => {
  beforeAll(async () => {
    adminApp = await firebase.initializeAdminApp({
      projectId: projectId,
    });

    fl_collections.map(adminWrite);
    fs_collections.map(adminWrite);
    service_collections.map(adminWrite);

    adminApp
      .firestore()
      .collection('fl_users')
      .doc('fluser')
      .set({ email: 'user@flamelink.com' });

    anonymousApp = await firebase.initializeTestApp({
      projectId: projectId,
    });

    mobileApp = await firebase.initializeTestApp({
      projectId: projectId,
      auth: { uid: 'alice', email: 'alice@example.com' },
    });

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

  describe.each(fl_collections)('Flamelink collection %p ', collection => {
    it('should allow anonymous reads', async () => {
      await firebase.assertSucceeds(anonymousRead(collection));
    });

    it('should deny anonymous writes', async () => {
      await firebase.assertFails(anonymousWrite(collection));
    });

    it('should allow mobile app reads', async () => {
      await firebase.assertSucceeds(mobileAppRead(collection));
    });

    it('should deny mobile app writes', async () => {
      await firebase.assertFails(mobileAppWrite(collection));
    });

    it('should allow flamelink reads', async () => {
      await firebase.assertSucceeds(flamelinkRead(collection));
    });

    it('should allow flamelink writes', async () => {
      await firebase.assertSucceeds(flamelinkWrite(collection));
    });
  });

  describe.each(fs_collections)('FarmSmart collection %p', collection => {
    it('should allow anonymous reads', async () => {
      await firebase.assertSucceeds(anonymousRead(collection));
    });

    it('should deny anonymous writes', async () => {
      await firebase.assertFails(anonymousWrite(collection));
    });

    it('should allow mobile app reads', async () => {
      await firebase.assertSucceeds(mobileAppRead(collection));
    });

    it('should deny mobile app writes', async () => {
      await firebase.assertFails(mobileAppWrite(collection));
    });

    it('should allow flamelink reads', async () => {
      await firebase.assertSucceeds(flamelinkRead(collection));
    });

    it('should deny flamelink writes', async () => {
      await firebase.assertFails(flamelinkWrite(collection));
    });
  });

  describe.each(service_collections)('Service collection %p', collection => {
    it('should deny anonymous reads', async () => {
      await firebase.assertFails(anonymousRead(collection));
    });

    it('should deny anonymous writes', async () => {
      await firebase.assertFails(anonymousWrite(collection));
    });

    it('should deny mobile app reads', async () => {
      await firebase.assertFails(mobileAppRead(collection));
    });

    it('should deny mobile app writes', async () => {
      await firebase.assertFails(mobileAppWrite(collection));
    });

    it('should deny flamelink reads', async () => {
      await firebase.assertFails(flamelinkRead(collection));
    });

    it('should deny flamelink writes', async () => {
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
    .doc('5678')
    .set({ key: 'value' });
}
