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

  beforeAll(() => {
    myFunctions = require('../../index');
    wrapped = myFunctions.httpsOnRequestBulkUploadSpreadsheet;
  });

  afterAll(() => {
    jest.restoreAllMocks();
    test.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a 200 response on success', async done => {
    let tx = {
      set: jest.fn(),
    };

    jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});

    let authCall = jest.spyOn(sheets_helper, 'authenticateServiceAccount').mockReturnValue({});

    jest.spyOn(sheets_helper, 'fetchSheetValues').mockReturnValue(Promise.resolve({}));

    let fetchSpreadsheet = jest
      .spyOn(sheets_helper, 'fetchSpreadsheet')
      .mockReturnValue(Promise.resolve({}));

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
      runTransaction: callable => {
        console.log('called mock transaction');
        expect(true).toBeTruthy();
        return callable(tx);
      },
    }));

    jest.spyOn(score_repository, 'createDate').mockReturnValue({});

    const score_data = {
      crop: {
        title: 'CROP',
      },
    };

    jest.spyOn(transform_score, 'transformCropScore').mockReturnValue(score_data);

    jest.spyOn(transform_info, 'transformSpreadsheetDoc').mockReturnValue({
      cropSheets: [{}],
    });

    request = {
      query: { sheetId: 'SHEET-ID' },
    };

    sendFunction = jest.fn().mockImplementation(() => {
      console.log('Send!');
      expect(true).toBeTruthy();
    });
    statusFunction = jest.fn().mockImplementation(() => ({
      send: sendFunction,
    }));

    response = {
      status: statusFunction,
    };

    // N.B. there are 5 assertions invoked that is expected and ci/linux recognizes it correctly
    // Expect at least one of the async callbacks was called (e.g. transaction)
    expect.hasAssertions();

    await wrapped(request, response);

    expect(authCall).toHaveBeenCalled();
    expect(fetchSpreadsheet).toHaveBeenCalled();
    done();
  });
});
