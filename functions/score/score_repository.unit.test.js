const chai = require('chai');
const admin = require('firebase-admin');

describe('Score repository', () => {
  let repository;
  beforeAll(() => {
    jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});

    jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
      collection: () => ({
        doc: () => ({}),
      }),
    }));

    repository = require('./score_repository');
  });

  test('should delete a link', async done => {
    let cmsDocId = 'DOCID';
    let deleteFunction = jest.fn();
    let document = jest.fn().mockImplementation(() => ({
      delete: deleteFunction,
    }));
    let linksRef = {
      doc: document,
      id: cmsDocId,
    };

    await repository.deleteLink(linksRef, cmsDocId);

    expect(document).toBeCalledWith('DOCID');
    expect(deleteFunction).toBeCalled();

    done();
  });

  test('should not create if score does not exist', async done => {
    let document = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockImplementation(() => ({
        exists: false,
      })),
    }));

    let scoresRef = {
      doc: document,
    };
    let linksRef = {};
    let cropName = 'NAME',
      cmsDocId = '1',
      cmsLocale = 'en-US',
      cmsEnvironment = 'production';

    await repository.createLinkIfScoreExists(
      scoresRef,
      linksRef,
      cropName,
      cmsDocId,
      cmsLocale,
      cmsEnvironment
    );

    expect(document).toBeCalled();

    done();
  });

  test('should create if a score exist', async done => {
    let document = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockImplementation(() => ({
        exists: true,
      })),
    }));

    let scoresRef = {
      doc: document,
    };

    let updateDocument = jest.fn();
    let linkDocument = jest.fn().mockImplementation(() => ({
      set: updateDocument,
    }));

    let linksRef = {
      doc: linkDocument,
    };
    let cropName = 'NAME',
      cmsDocId = '1',
      cmsLocale = 'en-US',
      cmsEnvironment = 'production';

    await repository.createLinkIfScoreExists(
      scoresRef,
      linksRef,
      cropName,
      cmsDocId,
      cmsLocale,
      cmsEnvironment
    );

    expect(document).toBeCalled();
    expect(linkDocument).toBeCalled();
    expect(updateDocument).toBeCalled();
    done();
  });

  describe('Test deleting Orhan Crop Scores', () => {
    // given
    const snapshot = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockImplementation(() => ({
        empty: false,
        docs: [{ id: 'Apple' }],
      })),
    }));

    const deleteFn = jest.fn();
    const crop = jest.fn().mockImplementation(() => ({
      delete: deleteFn,
    }));

    const ref = {
      where: snapshot,
      doc: crop,
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should delete ophan crop scores', async done => {
      // when
      await repository.deleteOrphanCropScores(ref, 'TEST', ['Orange']);

      // then
      expect(snapshot).toBeCalled();
      expect(crop).toBeCalledWith('Apple');
      expect(deleteFn).toBeCalled();

      done();
    });

    test('should not delete if crop is not an orphan', async done => {
      // when
      await repository.deleteOrphanCropScores(ref, 'TEST', ['Apple']);

      // then
      expect(snapshot).toBeCalled();
      expect(deleteFn).toHaveBeenCalledTimes(0);

      done();
    });

    test('should not delete there are no crops', async done => {
      const snapshot = jest.fn().mockImplementation(() => ({
        get: jest.fn().mockImplementation(() => ({
          empty: true,
          docs: [{ id: 'Apple' }],
        })),
      }));

      const ref = {
        where: snapshot,
        doc: crop,
      };

      // when
      await repository.deleteOrphanCropScores(ref, 'TEST', ['Apple']);

      // then
      expect(snapshot).toBeCalled();
      expect(deleteFn).toHaveBeenCalledTimes(0);

      done();
    });
  });
});
