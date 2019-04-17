const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const sinon = require('sinon');

describe('#transform_score()', () => {
    let transformer;
    let constants;
    before(() => {
        transformer = require('../transform_score');
        constants = require('../score_model').CropScoreConstants
    });

    describe('#transform_score()', () => {
        it ('will transform sample sheet_score_data.json', (done) => {

            let rawJson = require('./data/sheet_score_data.json');

            let data = transformer.transformCropScore(rawJson);

            expect(data).to.have.property('crop')
            let crop = data.crop;
            expect(crop).to.have.property('title').equals('Okra');
            expect(crop).to.have.property('dataHash');
            
            expect(data).to.have.property('scores').with.length(6);

            validateFactor(data.scores[0], 'Location', 47);
            validateFactor(data.scores[1], 'Land Size', 5);
            validateFactor(data.scores[2], 'Soil Type', 5);
            validateFactor(data.scores[3], 'Irrigation', 2, [
                {key : 'Yes', rating: 10},
                {key : 'No', rating: 6}
            ]);
            validateFactor(data.scores[4], 'Season', 3);
            validateFactor(data.scores[5], 'Intention', 3, [
                {key : 'Sales', rating: 7},
                {key : 'Subsistence', rating: 5},
                {key : 'Both', rating: 8}
            ]);

            done();
        });
    })
});

function validateFactor(data, factor, length, values) {
    expect(data).to.have.property('factor').is.eql(factor);
    expect(data).to.have.property('weight');
    expect(data).to.have.property('percentage');
    expect(data).to.have.property('values').has.length(length);
    if (values) {
        expect(data.values).is.eql(values);
    }
}