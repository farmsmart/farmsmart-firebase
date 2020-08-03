const chai = require('chai');
const assert = chai.assert;
const expected = chai.expect;

const sinon = require('sinon');

describe('Transform Score Matrix', () => {
  let transformer;
  let constants;
  beforeAll(() => {
    transformer = require('./transform_scorev2');
    constants = require('./score_model').CropScoreConstants;
  });

  describe('transforming score matrix', () => {
    test('should transform sample sheet_score_matrix.json', () => {
      let rawJson = require('./data/sheet_score_matrix.json');

      let data = transformer.transformCropScores(rawJson);

      expected(data).with.length(5);

      // There are 7 crops with 2 invalid ones.
      validateCrop(data[0], 'Chillies');
      validateCrop(data[1], 'Cowpeas');
      validateCrop(data[2], 'Cucumber');
      validateCrop(data[3], 'Small Urban Rotation (50m2)');
      validateCrop(data[4], 'Beetroot');
      //validateCrop(data[5], 'Tomatoes'); invalid weight
      //validateCrop(data[6], 'Sorghum'); invalid score
    });
  });
});

function validateCrop(data, qualifierName) {
  expected(data).to.have.property('crop');
  let crop = data.crop;
  expected(crop)
    .to.have.property('qualifierName')
    .equals(qualifierName);
  expected(crop).to.have.property('dataHash');

  expected(data)
    .to.have.property('scores')
    .with.length(8);

  validateFactor(data.scores[0], 'Skill level', 4, [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Trainer',
  ]);
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
    .is.eql(factor);
  expected(data).to.have.property('weight');
  expected(data.weight).is.lt(1);
  expected(data.weight).is.gte(0);

  expected(data).to.have.property('percentage');

  expected(data)
    .to.have.property('values')
    .has.length(length);

  // Check supplied options
  if (values) {
    expected(data.values.map(d => d.key)).is.eql(values);
  }

  // Check the scores
  data.values.forEach(element => {
    expected(element.rating).is.lte(10);
    expected(element.rating).is.gte(0);
  });
}
