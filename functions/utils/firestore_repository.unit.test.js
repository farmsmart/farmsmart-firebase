const admin = require('firebase-admin');
const firestore = require('./firestore_repository');

const getSpy = jest.fn(() => Promise.resolve());
const setSpy = jest.fn(() => Promise.resolve());
const deleteSpy = jest.fn(() => Promise.resolve());

jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
  doc: () => ({
    get: getSpy,
    set: setSpy,
    delete: deleteSpy,
  }),
}));

describe('Firestore repository', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get document from path', async () => {
    await firestore.getDocument('collection_a/1234');
    expect(getSpy).toBeCalled();
  });

  it('should write document to path', async () => {
    await firestore.writeDocument('collection_a/1234', 'test');
    expect(setSpy).toBeCalledWith('test');
  });

  it('should delete document from path', async () => {
    await firestore.deleteDocument('collection_a/1234');
    expect(deleteSpy).toBeCalled();
  });
});
