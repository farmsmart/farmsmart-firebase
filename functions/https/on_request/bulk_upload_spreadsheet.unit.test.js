const admin = require('firebase-admin');
const test = require('firebase-functions-test')();

const score_repository = require('../../score/score_repository');
const sheets_helper = require('../../score/sheets_helper');
const transform_info = require('../../score/transform_info');
const transform_score = require('../../score/transform_score');

describe('htts On Request upload spreadsheet', () => {
  let wrapped;
  let request, response;
  let statusFunction, sendFunction;
  let firestoreCollection;

  const tx = {
    set: jest.fn(),
  };

  const transaction = jest.fn().mockImplementation(callable => {
    return callable(tx);
  });

  beforeAll(() => {
    jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});

    jest.spyOn(sheets_helper, 'authenticate').mockReturnValue({});

    jest.spyOn(sheets_helper, 'fetchSheetValues').mockReturnValue(Promise.resolve({}));

    jest.spyOn(sheets_helper, 'fetchSpreadsheet').mockReturnValue(Promise.resolve({}));

    test.mockConfig({
      farmsmart: {
        sheets: {
          api: {
            key: 'KEY',
          },
        },
      },
    });

    firestoreCollection = jest.fn().mockImplementation(() => ({
      doc: jest.fn(),
    }));

    firestore = jest.spyOn(admin, 'firestore', 'get').mockReturnValue(() => ({
      collection: firestoreCollection,
      runTransaction: transaction,
    }));

    jest.spyOn(score_repository, 'createDate').mockReturnValue({});

    myFunctions = require('../../index');
    wrapped = myFunctions.httpsOnRequestBulkUploadSpreadsheet;
  });

  beforeEach(() => {
    request = {
      query: { sheetId: 'SHEET-ID' },
    };

    sendFunction = jest.fn();
    statusFunction = jest.fn().mockImplementation(() => ({
      send: sendFunction,
    }));

    response = {
      status: statusFunction,
    };
  });

  afterAll(() => {
    jest.restoreAllMocks();
    test.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a 200 response on success', done => {
    const score_data = {
      crop: {
        title: 'CROP',
      },
    };

    let transformCropScore = jest
      .spyOn(transform_score, 'transformCropScore')
      .mockReturnValue(score_data);

    let transformSpreadsheetDoc = jest
      .spyOn(transform_info, 'transformSpreadsheetDoc')
      .mockReturnValue({
        cropSheets: [{}],
      });

    wrapped(request, response);

    expect(transformCropScore).toBeCalled();
    expect(transformSpreadsheetDoc).toBeCalled();
    expect(transaction).toBeCalled();

    expect(statusFunction).toBeCalled();
    expect(statusFunction).toHaveBeenCalledWith(200);
    expect(sendFunction).toBeCalled();

    done();
  });
});
