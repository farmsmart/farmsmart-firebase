const { google } = require('googleapis');
const gsheets = google.sheets('v4');

exports.getScoreChange = function(current, previous) {
  let scoreChange = {
    isChange: false,
    doc: null,
    isInsert: false,
    isDelete: false,
    isScoreUpdated: false,
  };

  let doc;
  if (!current) {
    scoreChange.isDelete = true;
    scoreChange.isChange = true;
    doc = previous;
  } else if (!previous) {
    scoreChange.isChange = true;
    scoreChange.isInsert = true;
    doc = current;
  } else {
    doc = current;
  }

  if (!doc['crop'] || !doc.crop['dataHash']) {
    console.log('Missing last updates property or Invalid score structure');
    return null;
  }

  if (
    !scoreChange.isInsert &&
    !scoreChange.isDelete &&
    (current.crop.dataHash !== previous.crop.dataHash || current.crop.title !== previous.crop.title)
  ) {
    scoreChange.isChange = true;
    scoreChange.isScoreUpdated = true;
  }
  scoreChange.doc = doc;

  return scoreChange;
};

exports.getCmsCropChange = function(current, previous) {
  let cropChange = {
    isChange: false,
    docId: null,
    cropDocId: null,
    isDelete: false,
    isInsert: false,
    isMainDocument: false,
    isPublished: false,
    doc: null,
  };
  let doc;
  if (!current) {
    cropChange.isDelete = true;
    cropChange.isChange = true;
    doc = previous;
  } else if (!previous) {
    changes = true;
    cropChange.isInsert = true;
    cropChange.isChange = true;
    doc = current;
  } else {
    doc = current;
  }

  let flMetaProperty = '_fl_meta_';
  if (!(flMetaProperty in doc) || !doc[flMetaProperty] || doc[flMetaProperty].schema !== 'crop') {
    return null;
  }

  cropChange.isMainDocument = doc[flMetaProperty].docId === doc[flMetaProperty].fl_id;
  cropChange.docId = doc[flMetaProperty].docId;
  cropChange.cropDocId = doc[flMetaProperty].fl_id;
  cropChange.doc = doc;
  cropChange.isPublished = doc.status === 'PUBLISHED';

  if (!cropChange.isInsert && !cropChange.isDelete) {
    // Detect changes in the name of main document or
    // the status of (published or not)
    cropChange.isChange =
      current.status !== previous.status ||
      (cropChange.isMainDocument && current.name !== previous.name);
  }

  return cropChange;
};

exports.fetchSheetValues = function(sheetTitle, apiauth, sheetId, apiKey, handler) {
  const sheetRequest = {
    key: apiKey,
    auth: apiauth,
    spreadsheetId: sheetId,
    majorDimension: 'ROWS',
    valueRenderOption: 'FORMATTED_VALUE',
    range: sheetTitle,
  };

  return gsheets.spreadsheets.values.get(sheetRequest).then(result => {
    console.log('Fetched sheet: ' + sheetTitle);
    return Promise.resolve(result.data);
  });
};
