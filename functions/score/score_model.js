const crypto = require('crypto');

const crop_constants = {
  PROP_CROP: 'crop',
  PROP_CROP_TITLE: 'name',
  PROP_CROP_REGION: 'region',
  PROP_HASH: 'dataHash',
  PROP_SCORES: 'scores',
  PROP_VALID: 'valid',
  PROP_FACTOR: 'factor',
  PROP_WEIGHT: 'weight',
  PROP_PERCENTAGE: 'percentage',
  PROP_VALUES: 'values',
  PROP_TOTAL_WEIGHT: 'totalWeight',
  PROP_KEY: 'key',
  PROP_RATING: 'rating',
};
exports.CropScoreConstants = crop_constants;

exports.CropScoreBuilder = function() {
  this.data = {};
  this.factors = new Map();
  this.isValid = true;

  this.setCrop = function(cropName = null, cropRegion = null) {
    let crop = createObjectIfNotPresent(this.data, crop_constants.PROP_CROP);

    if (cropName) {
      crop[crop_constants.PROP_CROP_TITLE] = cropName;
    }
    if (cropRegion) {
      crop[crop_constants.PROP_CROP_REGION] = cropRegion;
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
      let weightValue = parseFloat(weight);
      factorObject[crop_constants.PROP_WEIGHT] = weightValue;
      factorObject[crop_constants.PROP_PERCENTAGE] = parseFloat(percentage);

      this.isValid &= weightValue < 1 && weightValue > 0;
    }
  };

  this.addRatingFromString = function(factor = null, key = null, rating) {
    if (factor && key) {
      let factorObject = this.getFactor(factor);

      let values = createArrayIfNotPresent(factorObject, crop_constants.PROP_VALUES);
      let entry = {};
      let ratingValue = parseInt(rating);
      entry[crop_constants.PROP_KEY] = key;
      entry[crop_constants.PROP_RATING] = ratingValue;

      this.isValid &= ratingValue <= 10 && ratingValue >= 0;

      values.push(entry);
    }
  };

  this.updateScores = function() {
    delete this.data[crop_constants.PROP_SCORES];
    let scores = createArrayIfNotPresent(this.data, crop_constants.PROP_SCORES);
    scores.push(...this.factors.values());

    let totalWeight = this.data[crop_constants.PROP_SCORES].reduce(
      (totalWeight, val) => totalWeight + val[crop_constants.PROP_WEIGHT],
      0
    );

    return totalWeight;
  };

  this.isCropValid = function() {
    return this.isValid;
  };

  this.get = function() {
    if (!(crop_constants.PROP_CROP in this.data)) {
      this.setCrop();
    }

    this.data[crop_constants.PROP_VALID] = this.isValid;

    let totalWeight = this.updateScores();

    this.data[crop_constants.PROP_TOTAL_WEIGHT] = totalWeight;
    this.data[crop_constants.PROP_SCORES].forEach(factor => {
      factor[crop_constants.PROP_PERCENTAGE] =
        (factor[crop_constants.PROP_WEIGHT] / totalWeight) * 100;
    });

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
  PROP_SCORE_MATRIX: 'scoreMatrix',
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

  this.setScoreMatrix = function(scoreMatrixSheet = null) {
    if (scoreMatrixSheet) {
      this.data[info_constants.PROP_SCORE_MATRIX] = scoreMatrixSheet;
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
