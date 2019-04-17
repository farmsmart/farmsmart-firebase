const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const sinon = require('sinon');

describe('#transform_info()', () => {
    let transformer;
    let constants;
    before(() => {
        transformer = require('../transform_info');
        constants = require('../score_model').SheetInfoConstants
    });

    describe('#transform_info()', () => {
        it ('will transform sample sheet_info.json', (done) => {

            let rawJson = require('./data/sheet_info.json');

            let data = transformer.transformSpreadsheetDoc(rawJson);

            expect(data).to.have.property('title')
                .equals('Recommendations Engine');
            expect(data).to.have.property('spreadsheetId')
                .equals('LR6NolCGM7wc2lFpLZ5JyYggD1QgqVeUKNY65C7hE');
            
            
            let sheetProperty = 'cropSheets';
            expect(data).to.have.property(sheetProperty);
            expect(data[sheetProperty]).is.eql([
                {title:"Tomato", sheet:"Tomato Scores"},
                {title:"Okra", sheet:"Okra Scores"}
            ]);

            expect(data).to.have.property('dataHash');
            
            done();
        });
    })
});