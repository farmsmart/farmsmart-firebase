const admin = require('firebase-admin');
const test = require('firebase-functions-test')();
const validation = require('../../utils/validate_schema');
const firestore = require('../../utils/firestore_repository');

describe('fl_content On Write', () => {
  let myFunctions, wrapped;
  let validateStub, deleteDocumentStub;
  const snapBefore = test.firestore.exampleDocumentSnapshot();
  const publishedSnapshot = test.makeChange(
    snapBefore,
    test.firestore.makeDocumentSnapshot({ status: 'PUBLISHED' })
  );
  const unPublishedSnapshot = test.makeChange(
    snapBefore,
    test.firestore.makeDocumentSnapshot({ status: 'DRAFT' })
  );
  const deletedSnapshot = test.makeChange(snapBefore, test.firestore.makeDocumentSnapshot({}));

  beforeAll(() => {
    jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});
    validateStub = jest.spyOn(validation, 'validateSchema').mockImplementation(() => {});
    deleteDocumentStub = jest.spyOn(firestore, 'deleteDocument').mockImplementation(() => {});

    myFunctions = require('../../index');
    wrapped = test.wrap(myFunctions.firestoreFlContentOnWrite);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    test.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate schema for published content', () => {
    wrapped(publishedSnapshot);
    expect(validateStub).toBeCalled();
  });

  it('should not validate schema for unpublished content', () => {
    wrapped(unPublishedSnapshot);
    expect(validateStub).not.toBeCalled();
  });

  it('should remove unpublished content from the error log', () => {
    wrapped(unPublishedSnapshot);
    expect(deleteDocumentStub).toBeCalled();
  });

  it('should remove deleted content from the error log', () => {
    wrapped(deletedSnapshot);
    expect(deleteDocumentStub).toBeCalled();
  });
});
