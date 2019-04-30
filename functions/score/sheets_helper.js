const { google } = require('googleapis');

exports.authenticate = function() {
  return google.auth.getClient({
    scopes: 'https://sheets.googleapis.com/v4/spreadsheets',
  });
};

exports.fetchSheetValues = function(sheetTitle, apiauth, sheetId, apiKey) {
  const sheetRequest = {
    key: apiKey,
    auth: apiauth,
    spreadsheetId: sheetId,
    majorDimension: 'ROWS',
    valueRenderOption: 'FORMATTED_VALUE',
    range: sheetTitle,
  };

  const gsheets = google.sheets('v4');

  return gsheets.spreadsheets.values.get(sheetRequest).then(result => {
    console.log('Fetched sheet: ' + sheetTitle);
    return Promise.resolve(result.data);
  });
};

exports.fetchSpreadsheet = function(sheetId, apiauth, apiKey) {
  const requestContext = {
    spreadsheetId: sheetId,
    auth: apiauth,
    key: apiKey,
  };

  const gsheets = google.sheets('v4');

  return gsheets.spreadsheets.get(requestContext).then(result => {
    console.log(`Successfully fetched worksheet ${result.data.properties.title}.`);
    return Promise.resolve(result.data);
  });
};
