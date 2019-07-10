const config = {
  projectId: 'farmsmart-development',
  databaseURL: 'https://farmsmart-development.firebaseio.com',
};
const test = require('firebase-functions-test')(
  config,
  './.credentials/testing-service-account-key.json'
);

const { getDocument, writeDocument, deleteDocument } = require('../../utils/firestore_repository');

const { firestoreFlContentOnWriteValidate } = require('../../index');
const wrappedValidateSchemaOnWrite = test.wrap(firestoreFlContentOnWriteValidate);

const slack = require('../../utils/slack_alert');
const slackSpy = jest.spyOn(slack, 'post').mockImplementation(() => Promise.resolve());

const contentPath = id => `fl_content/${id}`;
const errorPath = id => `fs_content_errors/${id}`;

const change = (data, id) => {
  const beforeSnap = test.firestore.exampleDocumentSnapshot();
  const afterSnap = test.firestore.makeDocumentSnapshot(data, contentPath(id));
  return test.makeChange(beforeSnap, afterSnap);
};

const deletedChange = (data, id) => {
  const beforeSnap = test.firestore.makeDocumentSnapshot(data, contentPath(id));
  const afterSnap = test.firestore.makeDocumentSnapshot({});
  return test.makeChange(beforeSnap, afterSnap);
};

describe('Validate Flamelink content schemas on write', () => {
  const validCrop = require('../../model/json/crop.sample.json');
  const invalidCrop = { ...validCrop, name: null };
  const invalidDraftCrop = { ...invalidCrop, status: 'DRAFT' };

  const publishedId = 'xxPUBLISHED-VALIDxx';
  const publishedChange = change(validCrop, publishedId);

  const invalidId = 'xxPUBLISHED-INVALIDxx';
  const invalidChange = change(invalidCrop, invalidId);

  const existingId = 'xxPUBLISHED-EXISTINGxx';
  const existingChange = change(validCrop, existingId);

  const draftId = 'xxDRAFTxx';
  const draftChange = change(invalidDraftCrop, draftId);

  const deleteId = 'xxDELETEDxx';
  const deleteChange = deletedChange(validCrop, deleteId);

  beforeAll(async () => {
    await writeDocument(errorPath(existingId), {});
    await writeDocument(errorPath(draftId), {});
    await writeDocument(errorPath(deleteId), {});
  });

  afterAll(async () => {
    await deleteDocument(errorPath(invalidId));
    await deleteDocument(errorPath(draftId));
    test.cleanup();
    jest.restoreAllMocks();
  });

  it('should validate schema for published content', async () => {
    try {
      await wrappedValidateSchemaOnWrite(publishedChange);
    } catch (error) {
      // emulator throws when firestore attempts to delete non existing record
    }

    const errorLog = await getDocument(errorPath(publishedId));
    expect(errorLog.exists).toBe(false);
  });

  it('should create an error log for document with invalid schema', async () => {
    try {
      await wrappedValidateSchemaOnWrite(invalidChange);
    } catch (error) {
      expect(error.message).toEqual(
        'Schema validation - doc: xxPUBLISHED-INVALIDxx, schema: crop, result: FAILED'
      );
    }
    const errorLog = await getDocument(errorPath(invalidId));
    expect(errorLog.exists).toBe(true);
    expect(slackSpy).toBeCalled();
  });

  it('should remove an existing error log for a valid document', async () => {
    await wrappedValidateSchemaOnWrite(existingChange);
    const errorLog = await getDocument(errorPath(existingId));
    expect(errorLog.exists).toBe(false);
  });

  it('should not remove an existing error log if invalid document set to draft', async () => {
    await wrappedValidateSchemaOnWrite(draftChange);
    const errorLog = await getDocument(errorPath(draftId));
    expect(errorLog.exists).toBe(true);
  });

  it('should remove deleted document references from the error log', async () => {
    await wrappedValidateSchemaOnWrite(deleteChange);
    const errorLog = await getDocument(errorPath(deleteId));
    expect(errorLog.exists).toBe(false);
  });
});
