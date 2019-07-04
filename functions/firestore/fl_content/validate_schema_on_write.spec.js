const admin = require('firebase-admin');

const config = {
  projectId: 'farmsmart-development',
  databaseURL: 'https://farmsmart-development.firebaseio.com',
};

const test = require('firebase-functions-test')(config, './.credentials/.service-account-key.json');

jest.mock('../../utils/slack_alert', () => ({
  post: jest.fn(() => Promise.resolve()),
}));

const getDocument = path => {
  return admin
    .firestore()
    .doc(path)
    .get();
};

const writeDocument = (path, data) => {
  return admin
    .firestore()
    .doc(path)
    .set(data);
};

const deleteDocument = path => {
  return admin
    .firestore()
    .doc(path)
    .delete();
};

const contentPath = id => `fl_content/${id}`;
const errorPath = id => `fs_content_errors/${id}`;

const change = (data, id) => {
  const beforeSnap = test.firestore.exampleDocumentSnapshot();
  const afterSnap = test.firestore.makeDocumentSnapshot(data, contentPath(id));
  return test.makeChange(beforeSnap, afterSnap);
};

describe('Validate schema on write', () => {
  const { firestoreFlContentOnWriteValidate } = require('../../index');
  const wrapped = test.wrap(firestoreFlContentOnWriteValidate);

  const draftId = 'xxDRAFTxx';

  const validCrop = require('../../model/json/crop.sample.json');
  const invalidCrop = { ...validCrop, name: null };
  // const draftCrop = { ...validCrop, status: 'DRAFT' };

  // const draftSnap = test.firestore.makeDocumentSnapshot(draftCrop, contentPath);
  // const draftChange = test.makeChange(beforeSnap, draftSnap);

  // const deletedSnap = test.firestore.makeDocumentSnapshot({}, contentPath);
  // const deletedChange = test.makeChange(beforeSnap, deletedSnap);

  afterAll(async () => {
    test.cleanup();
  });

  describe('Published content', () => {
    const publishedId = 'xxPUBLISHED-VALIDxx';
    const publishedChange = change(validCrop, publishedId);

    const invalidId = 'xxPUBLISHED-INVALIDxx';
    const invalidChange = change(invalidCrop, invalidId);

    const existingId = 'xxPUBLISHED-EXISTINGxx';
    const existingChange = change(validCrop, existingId);

    beforeAll(async () => {
      await writeDocument(errorPath(existingId), {});
    });

    // afterAll(async () => {
    //   try {
    //     [publishedId, invalidId, existingId].map(async id => {
    //       await deleteDocument(errorPath(id));
    //     });
    //   } catch (error) {}
    // });

    // it('should validate schema', async () => {
    //   await wrapped(publishedChange);
    //   const errorLog = await getDocument(errorPath(publishedId));
    //   expect(errorLog.exists).toBe(false);
    // });

    it('should create an error log for invalid schema', async () => {
      try {
        await wrapped(invalidChange);
      } catch (error) {
        expect(error.message).toEqual(
          'Schema validation - doc: xxPUBLISHED-INVALIDxx, schema: crop, result: FAILED'
        );
      }
      const errorLog = await getDocument(errorPath(invalidId));
      expect(errorLog.exists).toBe(true);
    });

    // it('should remove the error log for valid schema', async () => {
    //   await wrapped(existingChange);
    //   const errorLog = await getDocument(errorPath(existingId));
    //   expect(errorLog.exists).toBe(false);
    // });
  });

  // it('should not validate schema for draft content', () => {
  //   wrapped(draftChange);
  // });

  // it('should not remove draft content from the error log', () => {
  //   wrapped(draftChange);
  // });

  // it('should remove deleted content from the error log', () => {
  //   wrapped(deletedChange);
  // });
});
