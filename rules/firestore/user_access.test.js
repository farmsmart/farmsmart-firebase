const firebase = require('@firebase/testing');
const fs = require('fs');

const projectId = `project-${Date.now()}`;
const aliceUser = 'alice';
const johnUser = 'john';

// Firestore emulator must be running
// firebase serve --only firestore

describe('Firestore rules for user data requests', () => {
  beforeAll(async () => {
    adminApp = await firebase.initializeAdminApp({
      projectId: projectId,
    });

    await createUserData(aliceUser);

    aliceApp = await firebase.initializeTestApp({
      projectId: projectId,
      auth: { uid: aliceUser, email: 'alice@example.com' },
    });

    johnApp = await firebase.initializeTestApp({
      projectId: projectId,
      auth: { uid: johnUser, email: 'john@example.com' },
    });

    await firebase.loadFirestoreRules({
      projectId: projectId,
      rules: fs.readFileSync('firestore/firestore.rules', 'utf8'),
    });
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });

  it('should allow read for own data', async () => {
    await firebase.assertSucceeds(aliceAppRead(aliceUser));
  });

  it('should allow write for own data', async () => {
    await firebase.assertSucceeds(aliceAppWrite(aliceUser));
  });

  it('should deny read for other user data', async () => {
    await firebase.assertFails(johnAppRead(aliceUser));
  });

  it('should deny write for other user data', async () => {
    await firebase.assertFails(johnAppWrite(aliceUser));
  });

  it('should allow create for new user', async () => {
    await firebase.assertSucceeds(johnAppWrite(johnUser));
  });
});

function createUserData(user) {
  return adminApp
    .firestore()
    .collection('fs_users')
    .doc(user)
    .collection('profiles')
    .doc('Harry')
    .set({ name: 'Harry' });
}

function aliceAppRead(user) {
  return aliceApp
    .firestore()
    .collection('fs_users')
    .doc(user)
    .collection('profiles')
    .doc('Harry')
    .get();
}

function aliceAppWrite(user) {
  return aliceApp
    .firestore()
    .collection('fs_users')
    .doc(user)
    .collection('profiles')
    .doc('Maribel')
    .set({ name: 'Maribel' });
}

function johnAppRead(user) {
  return johnApp
    .firestore()
    .collection('fs_users')
    .doc(user)
    .collection('profiles')
    .doc('Harry')
    .get();
}

function johnAppWrite(user) {
  return johnApp
    .firestore()
    .collection('fs_users')
    .doc(user)
    .collection('profiles')
    .doc('Maribel')
    .set({ name: 'Maribel' });
}
