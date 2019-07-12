const chai = require('chai');
const assert = chai.assert;
const expected = chai.expect;

const sinon = require('sinon');

describe('datahelper', () => {
  let datahelper;
  beforeAll(() => {
    datahelper = require('./datahelper');
  });

  describe('getScoreChange', () => {
    test('should return change when document is deleted', () => {
      let score = datahelper.getScoreChange(null, { crop: { dataHash: 'AAA' } });
      expected(score).is.not.null;
      expected(score).has.property('doc').is.not.null;
      expected(score).has.property('isChange').is.true;
      expected(score).has.property('isDelete').is.true;
      expected(score).has.property('isInsert').is.false;
    });
    test('should return true when document is created', () => {
      let score = datahelper.getScoreChange({ crop: { dataHash: 'AAA' } }, null);
      expected(score).is.not.null;
      expected(score).has.property('doc').is.not.null;
      expected(score).has.property('isChange').is.true;
      expected(score).has.property('isInsert').is.true;
      expected(score).has.property('isDelete').is.false;
    });
    test('should return false when document is invalid', () => {
      expected(datahelper.getScoreChange({}, {}), 'both invalid documents').is.null;
      expected(datahelper.getScoreChange({ crop: {} }, { crop: {} }), 'only one has crop').is.null;
      expected(
        datahelper.getScoreChange({ crop: { dataHash: {} } }, { crop: {} }),
        'only one has last update'
      ).is.not.null;
      expected(
        datahelper.getScoreChange({ crop: {} }, { crop: { dataHash: {} } }),
        'only one has last update'
      ).is.null;
    });
    test('should return true when both documents are valid and not equal', () => {
      let score = datahelper.getScoreChange(
        { crop: { dataHash: 'A12', name: 'B', values: { extra: true } } },
        { crop: { dataHash: 'A12', name: 'B', values: {} } }
      );
      expected(score, 'same name and dataHash').has.property('isChange').is.false;
      score = datahelper.getScoreChange(
        { crop: { dataHash: 'A12', name: 'A', values: { one: 1 } } },
        { crop: { dataHash: 'B34', name: 'A', values: {} } }
      );
      expected(score, 'difference in dataHash').has.property('isChange').is.true;
      score = datahelper.getScoreChange(
        { crop: { dataHash: 'A12', name: 'C', values: { one: 1 } } },
        { crop: { dataHash: 'A12', name: 'A', values: {} } }
      );
      expected(score, 'difference in name').has.property('isChange').is.true;
    });
  });
  describe('getCmsCropChange', () => {
    test('should return change for insert', () => {
      let change = datahelper.getCmsCropChange({ _fl_meta_: { schema: 'crop' } }, null);
      expected(change).is.not.null;
      expected(change).has.property('isChange').is.true;
      expected(change).has.property('isInsert').is.true;
      expected(change).has.property('isDelete').is.false;
      expected(change).has.property('doc').is.not.null;
    });
    test('should return change for delete', () => {
      let change = datahelper.getCmsCropChange(null, { _fl_meta_: { schema: 'crop' } });
      expected(change).is.not.null;
      expected(change).has.property('isChange').is.true;
      expected(change).has.property('isInsert').is.false;
      expected(change).has.property('isDelete').is.true;
      expected(change).has.property('doc').is.not.null;
    });
    test('should return null for invalid or unexpected documents', () => {
      let change;

      change = datahelper.getCmsCropChange({ _fl_meta_: { schema: 'not-a-crop' } }, null);
      expected(change, 'not a crop schema').is.null;
      change = datahelper.getCmsCropChange({ someotherproperty: { schema: 'not-a-crop' } }, null);
      expected(change, 'missing _fl_meta_').is.null;
      change = datahelper.getCmsCropChange({ _fl_meta_: { invalidschema: 'crop' } }, null);
      expected(change, 'missing schema property').is.null;
      change = datahelper.getCmsCropChange({ _fl_meta_: { schema: 'crop' } }, null);
      expected(change, 'valid schema').is.not.null;
    });
    test('should populate document information for a valid change', () => {
      let main = datahelper.getCmsCropChange(
        {
          _fl_meta_: {
            schema: 'crop',
            docId: 'AAA',
            fl_id: 'AAA',
          },
        },
        null
      );
      expected(main, 'valid schema').is.not.null;
      expected(main).has.property('isMainDocument').is.true;
      expected(main)
        .has.property('docId')
        .is.eql('AAA');
      expected(main)
        .has.property('docId')
        .is.eql('AAA');
      expected(main).has.property('isPublished').is.false;
      expected(main).has.property('isChange').is.true;

      let alternative = datahelper.getCmsCropChange(
        {
          _fl_meta_: {
            schema: 'crop',
            docId: 'BBB',
            fl_id: 'AAA',
          },
          status: 'PUBLISHED',
        },
        null
      );
      expected(alternative, 'valid schema').is.not.null;
      expected(alternative).has.property('isMainDocument').is.false;
      expected(alternative)
        .has.property('docId')
        .is.eql('BBB');
      expected(alternative)
        .has.property('cropDocId')
        .is.eql('AAA');
      expected(alternative).has.property('isPublished').is.true;
      expected(alternative).has.property('isChange').is.true;
    });
  });
  test('should detect change only to the status or the name of main document', () => {
    let main = datahelper.getCmsCropChange(
      {
        _fl_meta_: {
          schema: 'crop',
          docId: 'AAA',
          fl_id: 'AAA',
        },
        status: '',
        name: 'Okra',
      },
      {
        _fl_meta_: {
          schema: 'crop',
          docId: 'AAA',
          fl_id: 'AAA',
        },
        status: 'PUBLISHED',
        name: 'Okra',
      }
    );
    expected(main).has.property('isPublished').is.false;
    expected(main).has.property('isChange').is.true;
    main = datahelper.getCmsCropChange(
      {
        _fl_meta_: {
          schema: 'crop',
          docId: 'AAA',
          fl_id: 'AAA',
        },
        status: 'PUBLISHED',
        name: 'Okra',
      },
      {
        _fl_meta_: {
          schema: 'crop',
          docId: 'AAA',
          fl_id: 'AAA',
        },
        status: 'PUBLISHED',
        name: 'Okras',
      }
    );
    expected(main).has.property('isPublished').is.true;
    expected(main).has.property('isChange').is.true;
    main = datahelper.getCmsCropChange(
      {
        _fl_meta_: {
          schema: 'crop',
          docId: 'AAA',
          fl_id: 'AAA',
        },
        status: 'PUBLISHED',
        name: 'Okra',
      },
      {
        _fl_meta_: {
          schema: 'crop',
          docId: 'AAA',
          fl_id: 'AAA',
        },
        status: 'PUBLISHED',
        name: 'Okra',
      }
    );
    expected(main).has.property('isPublished').is.true;
    expected(main).has.property('isChange').is.false;
  });
});
