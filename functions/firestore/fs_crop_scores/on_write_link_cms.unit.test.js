const admin = require('firebase-admin');
const test = require('firebase-functions-test')();

const datahelper = require('../../score/datahelper');
const score_repository = require('../../score/score_repository');

describe('fs_crop_scores On Write', () => {
  let wrapped;

  const cropScoreChange = test.makeChange(
    test.firestore.exampleDocumentSnapshot(),
    test.firestore.makeDocumentSnapshot({ status: 'DRAFT' })
  );

  beforeAll(() => {
    jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});

    myFunctions = require('../../index');
    wrapped = test.wrap(myFunctions.firestoreFsCropScoresOnWriteLinkCms);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    test.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should ignore non-interesting events', () => {
    let scoreChangeResult = jest.spyOn(datahelper, 'getScoreChange').mockReturnValue({
      isChange: false,
    });
    wrapped(cropScoreChange);
    expect(scoreChangeResult).toBeCalled();
  });
  it('should ignore updates', () => {
    let scoreChangeResult = jest.spyOn(datahelper, 'getScoreChange').mockReturnValue({
      isChange: true,
      isInsert: false,
      isDelete: false,
    });

    let fs = jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
      collection: {},
    }));
    wrapped(cropScoreChange);
    expect(scoreChangeResult).toBeCalled();
    expect(fs).toBeCalled();
  });

  it('should handle deleted crop scores', async done => {
    let deleteScoreResult = jest.spyOn(datahelper, 'getScoreChange').mockReturnValue({
      isChange: true,
      isDelete: true,
      doc: {
        crop: {
          title: 'Tomato',
        },
      },
    });

    let snapshot = [{ id: 'TEST' }];

    let queryMock = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue(Promise.resolve(snapshot)),
    }));

    let collectionMock = jest.fn().mockImplementation(() => ({
      where: queryMock,
    }));

    let fs = jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
      collection: collectionMock,
    }));

    let deleteLink = jest.spyOn(score_repository, 'deleteLink').mockImplementation(jest.fn());

    await wrapped(cropScoreChange);

    expect(deleteScoreResult).toBeCalled();
    expect(fs).toBeCalled();
    expect(collectionMock).toHaveBeenCalledTimes(2);
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenCalledWith('crop', '==', 'Tomato');
    expect(deleteLink).toHaveBeenCalledTimes(1);
    done();
  });

  it('should handle scores but no cms', async done => {
    let insertScoreResult = jest.spyOn(datahelper, 'getScoreChange').mockReturnValue({
      isChange: true,
      isInsert: true,
      doc: {
        crop: {
          title: 'Tomato',
        },
      },
    });

    let queryMock = jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue(Promise.resolve([])),
    });

    let cmsRefMock = jest.fn().mockReturnValueOnce({
      where: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          where: queryMock,
        }),
      }),
    });
    let linksRefMock = jest.fn().mockImplementation(() => {});
    let scoreRefMock = jest.fn().mockImplementation(() => {});

    let collectionMock = jest
      .fn()
      .mockImplementationOnce(cmsRefMock)
      .mockImplementationOnce(linksRefMock)
      .mockImplementationOnce(scoreRefMock);

    let fs = jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
      collection: collectionMock,
    }));

    await wrapped(cropScoreChange);

    expect(insertScoreResult).toBeCalled();
    expect(fs).toBeCalled();
    expect(collectionMock).toHaveBeenCalledTimes(1);
    expect(cmsRefMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenCalledWith('name', '==', 'Tomato');
    done();
  });
  it('should handle scores and link to cms', async done => {
    let insertScoreResult = jest.spyOn(datahelper, 'getScoreChange').mockReturnValue({
      isChange: true,
      isInsert: true,
      doc: {
        crop: {
          title: 'Tomato',
        },
      },
    });

    let swahili = { id: 'SWAHILI' };
    let mainEntry = {
      id: 'MAIN',
      data: jest.fn().mockImplementation(() => ({
        _fl_meta_: {
          locale: 'en-US',
          env: 'production',
        },
      })),
    };

    let queryMock = jest
      .fn()
      .mockImplementationOnce(() => ({
        get: jest.fn().mockReturnValue(Promise.resolve([swahili])),
      }))
      .mockImplementationOnce(() => ({
        get: jest.fn().mockReturnValue(Promise.resolve([mainEntry])),
      }));

    let fetchSwahili = jest.fn().mockImplementation(() => ({
      where: jest.fn().mockImplementation(() => ({
        where: jest.fn().mockImplementation(() => ({
          where: queryMock,
        })),
      })),
    }));

    let fetchMain = jest.fn().mockImplementation(() => ({
      where: jest.fn().mockImplementation(() => ({
        where: queryMock,
      })),
    }));

    let cmsRefMock = jest
      .fn()
      .mockImplementationOnce(fetchSwahili)
      .mockImplementationOnce(fetchMain);

    let linksRefMock = jest.fn().mockImplementation(() => {});
    let scoreRefMock = jest.fn().mockImplementation(() => ({
      doc: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockImplementation(() => ({
          exists: false,
        })),
      })),
    }));

    let collectionMock = jest
      .fn()
      .mockImplementationOnce(cmsRefMock)
      .mockImplementationOnce(cmsRefMock)
      .mockImplementationOnce(scoreRefMock)
      .mockImplementationOnce(linksRefMock);

    let fs = jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
      collection: collectionMock,
    }));

    await wrapped(cropScoreChange);

    expect(insertScoreResult).toBeCalled();
    expect(fs).toBeCalled();
    expect(collectionMock).toBeCalled();
    expect(fetchSwahili).toBeCalled();
    expect(fetchMain).toBeCalled();
    expect(queryMock).toHaveBeenCalledTimes(2);

    done();
  });
});
