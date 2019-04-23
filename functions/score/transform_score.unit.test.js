const chai = require('chai');
const assert = chai.assert;
const expected = chai.expect;

const sinon = require('sinon');

describe('Transform Score', () => {
  let transformer;
  let constants;
  beforeAll(() => {
    transformer = require('./transform_score');
    constants = require('./score_model').CropScoreConstants;
  });

  describe('transforming score', () => {
    test('should transform sample sheet_score_data.json', () => {
      let rawJson = require('./data/sheet_score_data.json');

      let data = transformer.transformCropScore(rawJson);

      expected(data).to.have.property('crop');
      let crop = data.crop;
      expected(crop)
        .to.have.property('title')
        .equals('Okra');
      expected(crop).to.have.property('dataHash');

      expected(data)
        .to.have.property('scores')
        .with.length(6);

      validateFactor(data.scores[0], 'Location', 47);
      validateFactor(data.scores[1], 'Land Size', 5);
      validateFactor(data.scores[2], 'Soil Type', 5);
      validateFactor(data.scores[3], 'Irrigation', 2, [
        { key: 'Yes', rating: 10 },
        { key: 'No', rating: 6 },
      ]);
      validateFactor(data.scores[4], 'Season', 3);
      validateFactor(data.scores[5], 'Intention', 3, [
        { key: 'Sales', rating: 7 },
        { key: 'Subsistence', rating: 5 },
        { key: 'Both', rating: 8 },
      ]);
    });
  });
});

function validateFactor(data, factor, length, values) {
  expected(data)
    .to.have.property('factor')
    .is.eql(factor);
  expected(data).to.have.property('weight');
  expected(data).to.have.property('percentage');
  expected(data)
    .to.have.property('values')
    .has.length(length);
  if (values) {
    expected(data.values).is.eql(values);
  }
}
