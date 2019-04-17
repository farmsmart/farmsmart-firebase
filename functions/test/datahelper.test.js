const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const sinon = require('sinon');

describe('#datahelper()', () => {
    let datahelper;
    before(() => {
        datahelper = require('../datahelper');
    });

    describe('#getScoreChange()', () => {
        it ('will return change when document is deleted', (done) => {
            let score = datahelper.getScoreChange(null, {crop : {dataHash: 'AAA'}});
            expect(score).is.not.null;
            expect(score).has.property('doc').is.not.null;
            expect(score).has.property('isChange').is.true;
            expect(score).has.property('isDelete').is.true;
            expect(score).has.property('isInsert').is.false;
            done();
        });
        it ('will return true when document is created', (done) => {
            let score = datahelper.getScoreChange({crop : {dataHash: 'AAA'}}, null);
            expect(score).is.not.null;
            expect(score).has.property('doc').is.not.null;
            expect(score).has.property('isChange').is.true;
            expect(score).has.property('isInsert').is.true;
            expect(score).has.property('isDelete').is.false;

            done();
        });
        it ('will return false when document is invalid', (done) => {
            
            expect(datahelper.getScoreChange({}, {}), "both invalid documents").is.null;
            expect(datahelper.getScoreChange({crop : {}}, {crop : {}}), "only one has crop").is.null;
            expect(datahelper.getScoreChange({crop : { dataHash : {} }}, {crop : {}}), "only one has last update").is.not.null;
            expect(datahelper.getScoreChange({crop : {}}, {crop : { dataHash : {} }}), "only one has last update").is.null;
            
            done();
        });
        it ('will return true when both documents are valid and not equal', (done) => {
            let score = datahelper.getScoreChange(
                {crop : {dataHash : "A12", title: "B", values : { extra: true}}}, 
                {crop : {dataHash : "A12", title: "B", values:  {} }});
            expect(score, "same title and dataHash").has.property('isChange').is.false;
            score = datahelper.getScoreChange(
                {crop : {dataHash : "A12", title: "A", values : {"one": 1}}}, 
                {crop : {dataHash : "B34", title: "A", values :  {}}});
            expect(score, "difference in dataHash").has.property('isChange').is.true;
            score = datahelper.getScoreChange(
                {crop : {dataHash : "A12", title: "C", values : {"one": 1}}}, 
                {crop : {dataHash : "A12", title: "A", values :  {}}});
            expect(score, "difference in title").has.property('isChange').is.true;    
            done();
        });
    })
    describe('#getCmsCropChange', () => {
        it('will return change for insert', (done) => {
            let change = datahelper.getCmsCropChange({"_fl_meta_" : { schema: 'crop'}}, null);
            expect(change).is.not.null;
            expect(change).has.property('isChange').is.true;
            expect(change).has.property('isInsert').is.true;
            expect(change).has.property('isDelete').is.false;
            expect(change).has.property('doc').is.not.null;

            done();
        });
        it('will return change for delete', (done) => {
            let change = datahelper.getCmsCropChange(null, {"_fl_meta_" : { schema: 'crop'}});
            expect(change).is.not.null;
            expect(change).has.property('isChange').is.true;
            expect(change).has.property('isInsert').is.false;
            expect(change).has.property('isDelete').is.true;
            expect(change).has.property('doc').is.not.null;

            done();
        });
        it('will return null for invalid or unexpected documents', (done) => {
            let change;
            
            change = datahelper.getCmsCropChange({"_fl_meta_" : { schema: 'not-a-crop'}}, null);
            expect(change, 'not a crop schema').is.null;
            change = datahelper.getCmsCropChange({"someotherproperty" : { schema: 'not-a-crop'}}, null);
            expect(change, 'missing _fl_meta_').is.null;
            change = datahelper.getCmsCropChange({"_fl_meta_" : { invalidschema : 'crop'}}, null);
            expect(change, 'missing schema property').is.null;
            change = datahelper.getCmsCropChange({"_fl_meta_" : { schema: 'crop'}}, null);
            expect(change, 'valid schema').is.not.null;
            
            done();
        });
        it('will populate document information for a valid change', (done) => {
            
            let main = datahelper.getCmsCropChange({
                "_fl_meta_" : { 
                    schema: 'crop',
                    docId : 'AAA',
                    fl_id : 'AAA'
                }}, null);
            expect(main, 'valid schema').is.not.null;
            expect(main).has.property('isMainDocument').is.true;
            expect(main).has.property('docId').is.eql('AAA');
            expect(main).has.property('docId').is.eql('AAA');
            expect(main).has.property('isPublished').is.false;
            expect(main).has.property('isChange').is.true;
                

            let alternative = datahelper.getCmsCropChange({
                "_fl_meta_" : { 
                    schema: 'crop',
                    docId : 'BBB',
                    fl_id : 'AAA'
                }, 
                status : 'PUBLISHED'}, null);
            expect(alternative, 'valid schema').is.not.null;
            expect(alternative).has.property('isMainDocument').is.false;
            expect(alternative).has.property('docId').is.eql('BBB');
            expect(alternative).has.property('cropDocId').is.eql('AAA');
            expect(alternative).has.property('isPublished').is.true;
            expect(alternative).has.property('isChange').is.true;

            done();
        });
    });
    it('will detect change only to the status or the name of main document', (done) => {
        let main = datahelper.getCmsCropChange({
            "_fl_meta_" : { 
                schema: 'crop',
                docId : 'AAA',
                fl_id : 'AAA'
            }, status : '', name : 'Okra'}, {
            "_fl_meta_" : { 
                schema: 'crop',
                docId : 'AAA',
                fl_id : 'AAA'
            }, status : 'PUBLISHED', name : 'Okra'});
        expect(main).has.property('isPublished').is.false;
        expect(main).has.property('isChange').is.true;
        main = datahelper.getCmsCropChange({
            "_fl_meta_" : { 
                schema: 'crop',
                docId : 'AAA',
                fl_id : 'AAA'
            }, status : 'PUBLISHED', name : 'Okra'}, {
            "_fl_meta_" : { 
                schema: 'crop',
                docId : 'AAA',
                fl_id : 'AAA'
            }, status : 'PUBLISHED', name : 'Okras'});
        expect(main).has.property('isPublished').is.true;
        expect(main).has.property('isChange').is.true;
        main = datahelper.getCmsCropChange({
            "_fl_meta_" : { 
                schema: 'crop',
                docId : 'AAA',
                fl_id : 'AAA'
            }, status : 'PUBLISHED', name : 'Okra'}, {
            "_fl_meta_" : { 
                schema: 'crop',
                docId : 'AAA',
                fl_id : 'AAA'
            }, status : 'PUBLISHED', name : 'Okra'});
        expect(main).has.property('isPublished').is.true;
        expect(main).has.property('isChange').is.false;

        done();
    });
});