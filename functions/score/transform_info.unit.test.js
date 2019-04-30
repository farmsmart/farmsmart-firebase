const chai = require('chai');
const assert = chai.assert;
const expected = chai.expect;

const sinon = require('sinon');

describe('Transform Info', () => {
  let transformer;
  let constants;
  beforeAll(() => {
    transformer = require('./transform_info');
    constants = require('./score_model').SheetInfoConstants;
  });

  describe('transforming info', () => {
    test('should transform sample sheet_info.json', () => {
      let rawJson = require('./data/sheet_info.json');

      let data = transformer.transformSpreadsheetDoc(rawJson);

      expected(data)
        .to.have.property('title')
        .equals('Recommendations Engine');
      expected(data)
        .to.have.property('spreadsheetId')
        .equals('LR6NolCGM7wc2lFpLZ5JyYggD1QgqVeUKNY65C7hE');

      let sheetProperty = 'cropSheets';
      expected(data).to.have.property(sheetProperty);
      expected(data[sheetProperty]).is.eql([
        { title: 'Tomato', sheet: 'Tomato Scores' },
        { title: 'Okra', sheet: 'Okra Scores' },
      ]);

      expected(data).to.have.property('dataHash');
    });
  });
});
