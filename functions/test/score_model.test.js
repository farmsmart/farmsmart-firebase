const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const sinon = require('sinon');

describe('#score_model()', () => {
    let model;

    before(() => {
        model = require('../score_model');
    });

    describe('#SheetInfoBuilder()', () => {
        it('will set crop properties', (done) => {
            let builder = new model.SheetInfoBuilder();
            let date = new Date();
            builder.setInfo("test title", "SPREADSHEET_ID", date);

            let data = builder.get();

            expect(data).to.have.property(model.SheetInfoConstants.PROP_TITLE)
                .equals("test title");
            expect(data).to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID)
                .equals("SPREADSHEET_ID");
            expect(data).to.have.property(model.SheetInfoConstants.PROP_LAST_FETCH)
                .equals(date);

            expect(data['dataHash']).is.eql(builder.get()['dataHash']);

            done();
        });
        it('will create default object', (done) => {
            let builder = new model.SheetInfoBuilder();
            let data = builder.get();
            expect(data).to.have.property(model.SheetInfoConstants.PROP_TITLE);
            expect(data).to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID);
            expect(data).to.not.have.property(model.SheetInfoConstants.PROP_LAST_FETCH);
            
            expect(data['dataHash']).is.eql(builder.get()['dataHash']);

            
            done();
        });
        it('will not create entries for invalid sheets', (done) => {
            let builder = new model.SheetInfoBuilder();

            builder.addCrop();
            builder.setReference();

            let data = builder.get();
            expect(data).to.have.property(model.SheetInfoConstants.PROP_TITLE);
            expect(data).to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID);
            expect(data).to.not.have.property(model.SheetInfoConstants.PROP_LAST_FETCH);

            expect(data).to.have.property(model.SheetInfoConstants.PROP_CROP_SHEETS);
            expect(data[model.SheetInfoConstants.PROP_CROP_SHEETS]).has.length(0);
            expect(data).to.not.have.property(model.SheetInfoConstants.PROP_REFERENCE);

            expect(data['dataHash']).is.eql(builder.get()['dataHash']);

            done();
        });
        it('will accept valid sheets', (done) => {
            let builder = new model.SheetInfoBuilder();

            builder.addCrop("CROP", "CROP SCORE SHEET");
            builder.setReference("REFERENCE SHEET");

            let data = builder.get();
            expect(data).to.have.property(model.SheetInfoConstants.PROP_TITLE);
            expect(data).to.have.property(model.SheetInfoConstants.PROP_SPREADSHEET_ID);
            expect(data).to.not.have.property(model.SheetInfoConstants.PROP_LAST_FETCH);

            expect(data).to.have.property(model.SheetInfoConstants.PROP_CROP_SHEETS);
            expect(data[model.SheetInfoConstants.PROP_CROP_SHEETS]).is.eql([
                { title: "CROP", sheet: "CROP SCORE SHEET" }])
            expect(data).to.have.property(model.SheetInfoConstants.PROP_REFERENCE)
                .is.eql("REFERENCE SHEET");

            expect(data['dataHash']).is.eql(builder.get()['dataHash']);


            done();
        });
    })
    describe('#CropScoreBuilder()', () => {
        it('will create crop with no factors', (done) => {
            let builder = new model.CropScoreBuilder();
            builder.setCrop("TEST CROP");

            let data = builder.get();

            expect(data).to.have.property('crop');
            expect(data).to.have.property('scores').has.length(0);

            let crop = data.crop;
            expect(crop).to.have.property('title')
                .equals("TEST CROP");
            expect(crop).to.have.property('dataHash');

            // Same hash code is generated if get is invoked again.
            expect(crop.dataHash).is.eql(builder.get().crop.dataHash);


            done();
        });

        it('will add factors if not present', (done) => {
            let builder = new model.CropScoreBuilder();
            builder.setCrop("TEST CROP");

            builder.addFactor("first");
            builder.addFactor("second");
            builder.addFactor(); // should be ignored
            builder.addFactor(''); // should be ignored
            builder.addFactor("first"); // should have no duplicates
            

            let data = builder.get();
            
            expect(data).to.have.property('crop');
            let crop = data.crop;
            // Same hash code is generated if get is invoked again.
            expect(crop.dataHash).is.eql(builder.get().crop.dataHash);

            expect(data).to.have.property('scores');
            expect(data.scores).is.eqls([
                {factor : 'first'},
                {factor : 'second'}])

            done();
        });
        it('will add factors with weighting', (done) => {
            let builder = new model.CropScoreBuilder();
            builder.setCrop("TEST CROP");

            builder.addFactor("first");
            builder.addFactor("second");
            builder.addWeightingFromString("second", "1.1", "30.30%");
            builder.addWeightingFromString("first", "0.1", "21.30%");
            
            let data = builder.get();
            
            expect(data).to.have.property('crop');
            let crop = data.crop;
            // Same hash code is generated if get is invoked again.
            expect(crop.dataHash).is.eql(builder.get().crop.dataHash);

            expect(data).to.have.property('scores');
            expect(data.scores).is.eqls([
                {factor : "first", weight : 0.1, percentage : 21.30},
                {factor : "second", weight : 1.1, percentage : 30.30}])

            done();
        });
        it('will add rating values to factors', (done) => {
            let builder = new model.CropScoreBuilder();
            builder.setCrop("TEST CROP");

            builder.addFactor("first");
            builder.addFactor("second");
            builder.addFactor("third");
            builder.addRatingFromString("third"); // ignored rating
            builder.addRatingFromString("second", "True", "9");
            builder.addRatingFromString("first", "Capital", "8");
            builder.addRatingFromString("second", "Yes", "4");
            
            let data = builder.get();
            
            expect(data).to.have.property('crop');
            let crop = data.crop;
            // Same hash code is generated if get is invoked again.
            expect(crop.dataHash).is.eql(builder.get().crop.dataHash);

            expect(data).to.have.property('scores');
            expect(data.scores).is.eqls([
                {factor : "first", values : [{key : "Capital", rating : 8}]},
                {factor : "second", values : [
                    {key : "True", rating : 9},
                    {key : "Yes", rating : 4}]},
                {factor : "third"},
            ])

            done();
        });
        it('will create score factor with rating and values', (done) => {
            let builder = new model.CropScoreBuilder();
            builder.setCrop("TEST CROP");

            builder.addFactor("first");
            builder.addWeightingFromString("first", "1.1", "30.30%");
            // values treated as a list of strings. 
            builder.addRatingFromString("first", "Capital", "8");
            builder.addRatingFromString("first", "Capital", "7");
            

            let data = builder.get();
            
            expect(data).to.have.property('crop');
            let crop = data.crop;
            // Same hash code is generated if get is invoked again.
            expect(crop.dataHash).is.eql(builder.get().crop.dataHash);

            expect(data).to.have.property('scores');
            expect(data.scores).is.eqls([{
                factor : "first", 
                weight : 1.1, 
                percentage : 30.30,
                values : [
                    {key : "Capital", rating : 8},
                    {key : "Capital", rating : 7}]}
            ])

            done();
        });
        
    })
});