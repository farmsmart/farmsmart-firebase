const chai = require('chai');
const assert = chai.assert;
const expected = chai.expect;

describe('Score repository', () => {
  let repository;
  beforeAll(() => {
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
});
