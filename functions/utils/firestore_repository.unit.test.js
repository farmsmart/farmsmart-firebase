const admin = require('firebase-admin');
const firestore = require('./firestore_repository');

const setSpy = jest.fn(() => Promise.resolve());
const deleteSpy = jest.fn(() => Promise.resolve());

jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
  collection: () => ({
    doc: () => ({
      set: setSpy,
      delete: deleteSpy,
    }),
  }),
}));

describe('Firestore repository', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should write document to collection', async () => {
    await firestore.writeDocument('collection_a', '1234', 'test');
    expect(setSpy).toBeCalledWith('test');
  });

  it('should delete document from collection', async () => {
    await firestore.deleteDocument('collection_a', '1234');
    expect(deleteSpy).toBeCalled();
  });
});
