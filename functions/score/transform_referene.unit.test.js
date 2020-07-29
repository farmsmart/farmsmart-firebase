const chai = require('chai');
const assert = chai.assert;
const expected = chai.expect;

const sinon = require('sinon');

describe('Transform Score Matrix', () => {
  let transformer;
  let constants;
  beforeAll(() => {
    transformer = require('./transform_reference');
    constants = require('./score_model').CropScoreConstants;
  });

  describe('transforming reference', () => {
    test('should transform sample data.json', () => {
      let rawJson = require('./data/sheet_reference.json');
      let requestISO = 'KE';
      let data = transformer.transformFactors(rawJson, requestISO);

      validateCrop(data);
    });
  });
});

function validateCrop(data, name) {
  expected(data)
    .to.have.property('scores')
    .with.length(8);

  validateFactor(data.scores[0], 'Skill level', 3, ['Beginner', 'Intermediate', 'Advanced']);
  validateFactor(data.scores[1], 'Location', 47);
  validateFactor(data.scores[2], 'Agro zone', 7);
  validateFactor(data.scores[3], 'Land size', 5);
  validateFactor(data.scores[4], 'Soil type', 5);
  validateFactor(data.scores[5], 'Irrigation', 2);
  validateFactor(data.scores[6], 'Month', 12, [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]);
  validateFactor(data.scores[7], 'Intention', 3, ['Sales', 'Subsistence', 'Both']);
}

function validateFactor(data, factor, length, values) {
  expected(data)
    .to.have.property('factor')
    .is.equals(factor);

  expected(data)
    .to.have.property('values')
    .has.length(length);

  // Check supplied options
  if (values) {
    expected(data.values.map(d => d.key)).is.eql(values);
  }
}
