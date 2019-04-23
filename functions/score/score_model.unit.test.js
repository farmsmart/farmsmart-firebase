const chai = require('chai');
const expected = chai.expect;

const sinon = require('sinon');

describe('Score Model', () => {
  let model;

  beforeAll(() => {
    model = require('./score_model');
  });

  describe('SheetInfoBuilder', () => {
    test('should set crop properties', () => {
      let builder = new model.SheetInfoBuilder();
      let date = new Date();
      builder.setInfo('test title', 'SPREADSHEET_ID', date);

      let data = builder.get();

      expected(data)
        .to.have.property(model.SheetInfoConstants.PROP_TITLE)
        .equals('test title');
      expected(data)
        .to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID)
        .equals('SPREADSHEET_ID');
      expected(data)
        .to.have.property(model.SheetInfoConstants.PROP_LAST_FETCH)
        .equals(date);

      expected(data['dataHash']).is.eql(builder.get()['dataHash']);
    });
    test('should create default object', () => {
      let builder = new model.SheetInfoBuilder();
      let data = builder.get();
      expected(data).to.have.property(model.SheetInfoConstants.PROP_TITLE);
      expected(data).to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID);
      expected(data).to.not.have.property(model.SheetInfoConstants.PROP_LAST_FETCH);

      expected(data['dataHash']).is.eql(builder.get()['dataHash']);
    });
    test('should not create entries for invalid sheets', () => {
      let builder = new model.SheetInfoBuilder();

      builder.addCrop();
      builder.setReference();

      let data = builder.get();
      expected(data).to.have.property(model.SheetInfoConstants.PROP_TITLE);
      expected(data).to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID);
      expected(data).to.not.have.property(model.SheetInfoConstants.PROP_LAST_FETCH);

      expected(data).to.have.property(model.SheetInfoConstants.PROP_CROP_SHEETS);
      expected(data[model.SheetInfoConstants.PROP_CROP_SHEETS]).has.length(0);
      expected(data).to.not.have.property(model.SheetInfoConstants.PROP_REFERENCE);

      expected(data['dataHash']).is.eql(builder.get()['dataHash']);
    });
    test('should accept valid sheets', () => {
      let builder = new model.SheetInfoBuilder();

      builder.addCrop('CROP', 'CROP SCORE SHEET');
      builder.setReference('REFERENCE SHEET');

      let data = builder.get();
      expected(data).to.have.property(model.SheetInfoConstants.PROP_TITLE);
      expected(data).to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID);
      expected(data).to.not.have.property(model.SheetInfoConstants.PROP_LAST_FETCH);

      expected(data).to.have.property(model.SheetInfoConstants.PROP_CROP_SHEETS);
      expected(data[model.SheetInfoConstants.PROP_CROP_SHEETS]).is.eql([
        { title: 'CROP', sheet: 'CROP SCORE SHEET' },
      ]);
      expected(data)
        .to.have.property(model.SheetInfoConstants.PROP_REFERENCE)
        .is.eql('REFERENCE SHEET');

      expected(data['dataHash']).is.eql(builder.get()['dataHash']);
    });
  });
  describe('CropScoreBuilder', () => {
    test('should create crop with no factors', () => {
      let builder = new model.CropScoreBuilder();
      builder.setCrop('TEST CROP');

      let data = builder.get();

      expected(data).to.have.property('crop');
      expected(data)
        .to.have.property('scores')
        .has.length(0);

      let crop = data.crop;
      expected(crop)
        .to.have.property('title')
        .equals('TEST CROP');
      expected(crop).to.have.property('dataHash');

      // Same hash code is generated if get is invoked again.
      expected(crop.dataHash).is.eql(builder.get().crop.dataHash);
    });

    test('should add factors if not present', () => {
      let builder = new model.CropScoreBuilder();
      builder.setCrop('TEST CROP');

      builder.addFactor('first');
      builder.addFactor('second');
      builder.addFactor(); // should be ignored
      builder.addFactor(''); // should be ignored
      builder.addFactor('first'); // should have no duplicates

      let data = builder.get();

      expected(data).to.have.property('crop');
      let crop = data.crop;
      // Same hash code is generated if get is invoked again.
      expected(crop.dataHash).is.eql(builder.get().crop.dataHash);

      expected(data).to.have.property('scores');
      expected(data.scores).is.eqls([{ factor: 'first' }, { factor: 'second' }]);
    });
    test('should add factors with weighting', () => {
      let builder = new model.CropScoreBuilder();
      builder.setCrop('TEST CROP');

      builder.addFactor('first');
      builder.addFactor('second');
      builder.addWeightingFromString('second', '1.1', '30.30%');
      builder.addWeightingFromString('first', '0.1', '21.30%');

      let data = builder.get();

      expected(data).to.have.property('crop');
      let crop = data.crop;
      // Same hash code is generated if get is invoked again.
      expected(crop.dataHash).is.eql(builder.get().crop.dataHash);

      expected(data).to.have.property('scores');
      expected(data.scores).is.eqls([
        { factor: 'first', weight: 0.1, percentage: 21.3 },
        { factor: 'second', weight: 1.1, percentage: 30.3 },
      ]);
    });
    test('should add rating values to factors', () => {
      let builder = new model.CropScoreBuilder();
      builder.setCrop('TEST CROP');

      builder.addFactor('first');
      builder.addFactor('second');
      builder.addFactor('third');
      builder.addRatingFromString('third'); // ignored rating
      builder.addRatingFromString('second', 'True', '9');
      builder.addRatingFromString('first', 'Capital', '8');
      builder.addRatingFromString('second', 'Yes', '4');

      let data = builder.get();

      expected(data).to.have.property('crop');
      let crop = data.crop;
      // Same hash code is generated if get is invoked again.
      expected(crop.dataHash).is.eql(builder.get().crop.dataHash);

      expected(data).to.have.property('scores');
      expected(data.scores).is.eqls([
        { factor: 'first', values: [{ key: 'Capital', rating: 8 }] },
        { factor: 'second', values: [{ key: 'True', rating: 9 }, { key: 'Yes', rating: 4 }] },
        { factor: 'third' },
      ]);
    });
    test('should create score factor with rating and values', () => {
      let builder = new model.CropScoreBuilder();
      builder.setCrop('TEST CROP');

      builder.addFactor('first');
      builder.addWeightingFromString('first', '1.1', '30.30%');
      // values treated as a list of strings.
      builder.addRatingFromString('first', 'Capital', '8');
      builder.addRatingFromString('first', 'Capital', '7');

      let data = builder.get();

      expected(data).to.have.property('crop');
      let crop = data.crop;
      // Same hash code is generated if get is invoked again.
      expected(crop.dataHash).is.eql(builder.get().crop.dataHash);

      expected(data).to.have.property('scores');
      expected(data.scores).is.eqls([
        {
          factor: 'first',
          weight: 1.1,
          percentage: 30.3,
          values: [{ key: 'Capital', rating: 8 }, { key: 'Capital', rating: 7 }],
        },
      ]);
    });
  });
});
