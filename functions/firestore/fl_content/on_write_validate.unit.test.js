const admin = require('firebase-admin');
const test = require('firebase-functions-test')();
const validateSchema = require('../../validate/validate_schema');
const firestore = require('../../utils/firestore_repository');

jest.mock('../../utils/slack_alert');
const validateSchemaSpy = jest.spyOn(validateSchema, 'validateSchema').mockImplementation(() => {});
const deleteSpy = jest.spyOn(firestore, 'deleteDocument').mockImplementation(() => {});
const writeSpy = jest.spyOn(firestore, 'writeDocument').mockImplementation(() => {});

describe('fl_content On Write', () => {
  const crop = {
    _fl_meta_: { schema: 'crop' },
    status: 'PUBLISHED',
  };
  const snapBefore = test.firestore.exampleDocumentSnapshot();
  const snapAfterPublished = test.firestore.makeDocumentSnapshot(crop);
  const snapAfterDraft = test.firestore.makeDocumentSnapshot({ ...crop, status: 'DRAFT' });
  const publishedChange = test.makeChange(snapBefore, snapAfterPublished);
  const draftChange = test.makeChange(snapBefore, snapAfterDraft);
  const deleteChange = test.makeChange(snapBefore, test.firestore.makeDocumentSnapshot({}));

  jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});
  const { firestoreFlContentOnWriteValidate } = require('../../index');
  const wrappedValidateSchemaOnWrite = test.wrap(firestoreFlContentOnWriteValidate);

  afterAll(() => {
    jest.restoreAllMocks();
    test.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate schema for published content', async () => {
    await wrappedValidateSchemaOnWrite(publishedChange);
    expect(validateSchemaSpy).toBeCalled();
  });

  it('should remove an existing error log for a valid document', async () => {
    await wrappedValidateSchemaOnWrite(publishedChange);
    expect(deleteSpy).toBeCalled();
  });

  it('should not remove an existing error log if invalid document set to draft', async () => {
    await wrappedValidateSchemaOnWrite(draftChange);
    expect(deleteSpy).not.toBeCalled();
  });

  it('should remove deleted document references from the error log', async () => {
    await wrappedValidateSchemaOnWrite(deleteChange);
    expect(deleteSpy).toBeCalled();
  });

  describe('invalid schema', () => {
    beforeAll(() => {
      jest.spyOn(validateSchema, 'validateSchema').mockImplementation(() => ({ errors: true }));
    });
    it('should create an error log for document with invalid schema', async () => {
      try {
        await wrappedValidateSchemaOnWrite(publishedChange);
      } catch (error) {
        // emulator throws when firestore attempts to delete non existing record
      }
      expect(writeSpy).toBeCalled();
    });
  });
});
