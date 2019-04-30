const crypto = require('crypto');

const crop_constants = {
  PROP_CROP: 'crop',
  PROP_CROP_TITLE: 'title',
  PROP_HASH: 'dataHash',
  PROP_SCORES: 'scores',
  PROP_FACTOR: 'factor',
  PROP_WEIGHT: 'weight',
  PROP_PERCENTAGE: 'percentage',
  PROP_VALUES: 'values',
  PROP_KEY: 'key',
  PROP_RATING: 'rating',
};
exports.CropScoreConstants = crop_constants;

exports.CropScoreBuilder = function() {
  this.data = {};
  this.factors = new Map();

  this.setCrop = function(cropName = null) {
    let crop = createObjectIfNotPresent(this.data, crop_constants.PROP_CROP);

    if (cropName) {
      crop[crop_constants.PROP_CROP_TITLE] = cropName;
    }
  };

  this.getFactor = function(factor = null) {
    let factorObject = {};
    if (factor) {
      if (this.factors.has(factor)) {
        factorObject = this.factors.get(factor);
      } else {
        factorObject[crop_constants.PROP_FACTOR] = factor;
        this.factors.set(factor, factorObject);
      }
    }
    return factorObject;
  };

  this.addFactor = function(factor) {
    this.getFactor(factor);
  };

  this.addWeightingFromString = function(factor = null, weight, percentage) {
    if (factor) {
      let factorObject = this.getFactor(factor);
      factorObject[crop_constants.PROP_WEIGHT] = parseFloat(weight);
      factorObject[crop_constants.PROP_PERCENTAGE] = parseFloat(percentage);
    }
  };

  this.addRatingFromString = function(factor = null, key = null, rating) {
    if (factor && key) {
      let factorObject = this.getFactor(factor);

      let values = createArrayIfNotPresent(factorObject, crop_constants.PROP_VALUES);
      let entry = {};
      entry[crop_constants.PROP_KEY] = key;
      entry[crop_constants.PROP_RATING] = parseInt(rating);
      values.push(entry);
    }
  };

  this.updateScores = function() {
    delete this.data[crop_constants.PROP_SCORES];
    let scores = createArrayIfNotPresent(this.data, crop_constants.PROP_SCORES);
    scores.push(...this.factors.values());
  };

  this.get = function() {
    if (!(crop_constants.PROP_CROP in this.data)) {
      this.setCrop();
    }

    this.updateScores();

    let crop = this.data[crop_constants.PROP_CROP];
    delete crop[crop_constants.PROP_HASH];
    crop[crop_constants.PROP_HASH] = createHash(this.data);

    return this.data;
  };
};

const info_constants = {
  PROP_LAST_FETCH: 'lastFetch',
  PROP_SPREADSHEET_ID: 'spreadsheetId',
  PROP_TITLE: 'title',
  PROP_CROP_SHEETS: 'cropSheets',
  PROP_REFERENCE: 'reference',
  PROP_SHEET: 'sheet',
  PROP_DATA_HASH: 'dataHash',
};
exports.SheetInfoConstants = info_constants;

exports.SheetInfoBuilder = function() {
  this.data = {};

  this.setInfo = function(title = '', spreadsheetId = '', updated) {
    this.data[info_constants.PROP_TITLE] = title;
    this.data[info_constants.PROP_SPREADSHEET_ID] = spreadsheetId;
    if (updated) {
      this.data[info_constants.PROP_LAST_FETCH] = updated;
    }
  };

  this.addCrop = function(title = null, sheet = null) {
    let crops = createArrayIfNotPresent(this.data, info_constants.PROP_CROP_SHEETS);
    if (title) {
      let cropSheet = {};
      cropSheet[info_constants.PROP_TITLE] = title;
      cropSheet[info_constants.PROP_SHEET] = sheet;
      crops.push(cropSheet);
    }
  };

  this.setReference = function(refSheet = null) {
    if (refSheet) {
      this.data[info_constants.PROP_REFERENCE] = refSheet;
    }
  };

  this.get = function() {
    if (!(info_constants.PROP_TITLE in this.data)) {
      this.setInfo();
    }

    delete this.data[info_constants.PROP_DATA_HASH];
    this.data[info_constants.PROP_DATA_HASH] = createHash(this.data);

    return this.data;
  };
};

function createObjectIfNotPresent(parent, property) {
  if (!(property in parent)) {
    parent[property] = {};
  }
  return parent[property];
}

function createArrayIfNotPresent(parent, property) {
  if (!(property in parent)) {
    parent[property] = [];
  }
  return parent[property];
}

function createHash(data) {
  let dataString = JSON.stringify(data);
  return crypto
    .createHash('md5')
    .update(dataString)
    .digest('hex');
}
