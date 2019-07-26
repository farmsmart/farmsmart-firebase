const model = require('./score_model');

const tpl = {
  names: { row: 0 },
  data: { col: 1, row: 1 },
};

exports.transformFactors = function(data) {
  // Create a list of crop builders for all crops
  const factorsBuilder = new model.CropScoreBuilder();

  factorsBuilder.setCrop('factors');

  const factors = data.values[tpl.names.row];
  factors.forEach(factor => factorsBuilder.addWeightingFromString(factor, 1));

  for (let row = tpl.data.row; row < data.values.length; row++) {
    const rowValues = data.values[row];
    if (rowValues.length == 0) {
      // stop processing if the length is not expected
      break;
    }

    rowValues.forEach((value, index) => {
      if (value && index < factors.length) {
        factorsBuilder.addRatingFromString(factors[index], value, 0);
      }
    });
  }

  return factorsBuilder.get();
};
