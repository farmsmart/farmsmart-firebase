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

  describe('Create Links for Scores', async () => {
    test('should not create if score does not exist', async done => {
      const snapshot = jest.fn().mockImplementation(() => ({
        get: jest.fn().mockImplementation(() => ({
          docs: [{ id: 'Apple' }],
        })),
        then: jest.fn().mockImplementation(() => [
          {
            crop: { name: 'Tomato_KE', qualifierName: 'Tomato' },
          },
        ]),
      }));

      let scoresRef = {
        get: snapshot,
        then: snapshot,
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

      expect(snapshot).toBeCalled();

      done();
    });
  });

  describe('Deleting Orphaned Crop Scores', () => {
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

    test('should not delete if there are no crops', async done => {
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

  describe('Update spreasheet', () => {
    test('should start transaction to update spreadsheet', async () => {
      const spreadsheet = {};

      const db = {
        runTransaction: jest.fn().mockImplementation(),
      };

      const ref = {};

      // when
      await repository.updateSpreadsheet(db, ref, spreadsheet);

      // then
      expect(db.runTransaction).toBeCalled();
    });
  });

  describe('Write score to firestore', () => {
    test('should reject crop is missing a name', async () => {
      const db = {
        runTransaction: jest.fn().mockImplementation(),
      };

      const scoreData = {};

      const sheetId = 'ABC';

      const collection = 'TEST';

      try {
        // when
        await repository.writeScoreToFireStore(scoreData, sheetId, db, collection);
        fail('Expecting an error to be thrown');
        // eslint-disable-next-line no-empty
      } catch (err) {}

      expect(db.runTransaction).toHaveBeenCalledTimes(0);
    });

    test('should write to firestore', async () => {
      const docRef = jest.fn().mockImplementation();

      const db = {
        runTransaction: jest.fn().mockImplementation(),
        collection: jest.fn().mockImplementation(() => ({
          doc: docRef,
        })),
      };

      const scoreData = {
        crop: {
          name: 'TEST',
        },
      };

      const sheetId = 'ABC';

      const collection = 'TEST';

      await repository.writeScoreToFireStore(scoreData, sheetId, db, collection);

      expect(db.runTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
