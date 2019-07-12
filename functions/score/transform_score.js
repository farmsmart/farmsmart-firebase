const model = require('./score_model');

const tpl = {
  name: { row: 1, col: 1 },
  header: { row: 3 },
  data: { row: 4 },
  factor: { col: 1 },
  weight: { col: 2 },
  percent: { col: 3 },
};

exports.transformCropScore = function(data) {
  let cropBuilder = new model.CropScoreBuilder();

  cropBuilder.setCrop(data.values[tpl.name.row][tpl.name.col]);

  // retrieve the indexes of all factors
  let ratingLookup = new Map();
  let headerRow = data.values[tpl.header.row];
  for (let col = 5; col < headerRow.length; col++) {
    // rating is preceded by the name of the factor
    if (headerRow[col] === 'Rating') {
      let factor = headerRow[col - 1];
      ratingLookup.set(col - 1, factor);
      cropBuilder.addFactor(factor);
    }
  }

  // extract the data from the remainder of the rows
  for (let rowIdx = tpl.data.row; rowIdx < data.values.length; rowIdx++) {
    let row = data.values[rowIdx];
    cropBuilder.addWeightingFromString(
      row[tpl.factor.col],
      row[tpl.weight.col],
      row[tpl.percent.col]
    );

    for (let [key_idx, value] of ratingLookup.entries()) {
      if (row.length > key_idx + 1) {
        cropBuilder.addRatingFromString(value, row[key_idx], row[key_idx + 1]);
      }
    }
  }

  return cropBuilder.get();
};
