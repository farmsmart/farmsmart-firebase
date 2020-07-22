const model = require('./score_model');

const tpl = {
  names: { row: 0 },
  data: { col: 1, row: 1, start: 3 },
  factor: { col: 0 },
  option: { col: 1 },
  weight: { col: 1 },
  territory: { col: 2 },
};

exports.territoryLocale = function(data) {
  const territoryPosition = 2;
  let cropTerritoryLocale = data.values[territoryPosition][tpl.territory.col];
  return cropTerritoryLocale;
};

exports.transformCropScores = function(data) {
  // Create a list of crop builders for all crops
  let cropBuilders = [];
  let cropNames = data.values[tpl.names.row].slice(tpl.data.start);
  for (let idx = 0; idx < cropNames.length; idx++) {
    let builder = new model.CropScoreBuilder();
    const cropTerritory = this.territoryLocale(data).trim();
    builder.setCrop(cropNames[idx].trim() + '_' + cropTerritory.trim(), cropTerritory);
    cropBuilders.push(builder);
  }

  for (let row = tpl.data.row; row < data.values.length; row++) {
    // eslint-disable-next-line eqeqeq
    if (data.values[row].length == 0) {
      // stop processing if the length is not expected
      break;
    }

    let currentFactor = data.values[row][tpl.factor.col];
    let factorOption = data.values[row][tpl.option.col];
    let cropsValues = data.values[row].slice(tpl.data.start); // slice the values to that of the start

    if (!currentFactor || !factorOption) {
      // stop processing when an empty factor is encoutered
      break;
    }

    // limit the processing of columns to match the available crop columns only.
    for (let idx = 0; idx < cropNames.length; idx++) {
      cropBuilders[idx].addFactor(currentFactor);
      if (factorOption.toLowerCase() === 'weighting') {
        // Add the weights row
        cropBuilders[idx].addWeightingFromString(currentFactor, cropsValues[idx]);
      } else {
        // Add the score rows
        cropBuilders[idx].addRatingFromString(currentFactor, factorOption, cropsValues[idx]);
      }
    }
  }

  // Returns crops, ignores crops that has invalid scores or weighting
  return cropBuilders.filter(builder => builder.isCropValid()).map(builder => builder.get());
};
