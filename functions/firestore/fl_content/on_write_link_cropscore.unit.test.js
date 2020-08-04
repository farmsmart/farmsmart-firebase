const admin = require('firebase-admin');
const test = require('firebase-functions-test')();

const datahelper = require('../../score/datahelper');
const score_repository = require('../../score/score_repository');

describe('fl_content On Write link crop score', () => {
  let wrapped;

  const flContentChange = test.makeChange(
    test.firestore.exampleDocumentSnapshot(),
    test.firestore.makeDocumentSnapshot({ status: 'DRAFT' })
  );

  const sampleCms = {
    _fl_meta_: {
      locale: 'en-US',
      env: 'production',
    },
    name: 'SAMPLE-CROP',
    recommendationEngineCropName: 'SAMPLE-CROP',
  };

  let cmsChange;
  let deleteLink, createLinkIfScoreExists;
  let cmsRef, scoresRef, linksRef;
  let firestoreCollection, firestore;

  beforeAll(() => {
    jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});

    cmsChange = jest.spyOn(datahelper, 'getCmsCropChange');

    deleteLink = jest.spyOn(score_repository, 'deleteLink').mockImplementation(() => {});

    createLinkIfScoreExists = jest
      .spyOn(score_repository, 'createLinkIfScoreExists')
      .mockImplementation(() => {});

    cmsRef = jest.fn().mockReturnValue(true);
    scoresRef = jest.fn().mockReturnValue(true);
    linksRef = jest.fn().mockReturnValue(true);

    firestoreCollection = jest.fn();

    firestore = jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
      collection: firestoreCollection,
    }));

    myFunctions = require('../../index');
    wrapped = test.wrap(myFunctions.firestoreFlContentOnWriteLinkCropscore);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    test.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should ignore non changes', async done => {
    cmsChange.mockReturnValue({
      isChange: false,
    });

    await wrapped(flContentChange);

    expect(firestore).not.toBeCalled();
    expect(cmsChange).toBeCalled();

    done();
  });

  it('should ignore missing', async done => {
    cmsChange.mockReturnValue({});

    await wrapped(flContentChange);

    expect(firestore).not.toBeCalled();
    expect(cmsChange).toBeCalled();

    done();
  });

  it('should delete if cms is deleted', async done => {
    cmsChange.mockReturnValue({
      isChange: true,
      isDelete: true,
      doc: sampleCms,
    });

    await wrapped(flContentChange);

    expect(firestore).toBeCalled();
    expect(cmsChange).toBeCalled();
    expect(deleteLink).toBeCalled();

    done();
  });

  it('should delete if cms is not published', async done => {
    cmsChange.mockReturnValue({
      isChange: true,
      isPublished: false,
      doc: sampleCms,
    });

    await wrapped(flContentChange);

    expect(firestore).toBeCalled();
    expect(cmsChange).toBeCalled();
    expect(deleteLink).toBeCalled();

    done();
  });

  it('should create if a main document is published', async done => {
    cmsChange.mockReturnValue({
      isChange: true,
      isMainDocument: true,
      isPublished: true,
      docId: 'DOCID',
      doc: sampleCms,
    });

    firestoreCollection
      .mockImplementationOnce(cmsRef)
      .mockImplementationOnce(scoresRef)
      .mockImplementationOnce(linksRef);

    await wrapped(flContentChange);

    expect(firestore).toBeCalled();
    expect(cmsChange).toBeCalled();
    expect(firestoreCollection).toHaveBeenCalledTimes(3);
    expect(createLinkIfScoreExists).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'SAMPLE-CROP',
      'SAMPLE-CROP_US',
      'DOCID',
      'en-US',
      'production'
    );

    done();
  });

  it('should not create if not main document and is published but main document is missing', async done => {
    cmsChange.mockReturnValue({
      isChange: true,
      isMainDocument: false,
      isPublished: true,
      docId: 'DOCID',
      doc: sampleCms,
    });

    cmsRef = {
      doc: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnValue({
          exists: false,
        }),
      })),
    };

    firestoreCollection
      .mockReturnValueOnce(cmsRef)
      .mockReturnValueOnce(scoresRef)
      .mockReturnValueOnce(linksRef);

    await wrapped(flContentChange);

    expect(firestore).toBeCalled();
    expect(cmsChange).toBeCalled();
    expect(firestoreCollection).toHaveBeenCalledTimes(3);
    expect(createLinkIfScoreExists).not.toBeCalled();

    done();
  });

  it('should create if not main document and is published main document is present', async done => {
    cmsChange.mockReturnValue({
      isChange: true,
      isMainDocument: false,
      isPublished: true,
      docId: 'DOCID',
      doc: sampleCms,
    });

    cmsRef = {
      doc: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnValue({
          exists: true,
          data: jest.fn().mockReturnValue({
            name: 'CROP',
            recommendationEngineCropName: 'CROP',
          }),
        }),
      })),
    };

    firestoreCollection
      .mockReturnValueOnce(cmsRef)
      .mockReturnValueOnce(scoresRef)
      .mockReturnValueOnce(linksRef);

    await wrapped(flContentChange);

    expect(firestore).toBeCalled();
    expect(cmsChange).toBeCalled();
    expect(firestoreCollection).toHaveBeenCalledTimes(3);
    expect(createLinkIfScoreExists).toBeCalled();

    expect(createLinkIfScoreExists).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'SAMPLE-CROP',
      'SAMPLE-CROP_US',
      'DOCID',
      'en-US',
      'production'
    );

    done();
  });
});
