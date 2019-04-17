const chai = require('chai');
const assert = chai.assert;

// mock library
const sinon = require('sinon');

// 1. for offline tests, At the top of test/index.test.js
const admin = require('firebase-admin');
const test = require('firebase-functions-test')();

describe('Cloud Functions', () => {
    let myFunctions, adminInitStub;

    before(() => {
        
        adminInitStub = sinon.stub(admin, 'initializeApp');
        // Now we can require index.js and save the exports inside a namespace called myFunctions.
        myFunctions = require('../index');
    });

    after(() => {
        adminInitStub.restore();

        test.cleanup();
    });

    describe('#helloWorld', () => { 
        before(() => {});
        after(() => {});
        
        it('should return 200 and a Hello', (done) => {

            // [START assertHTTP]
            // A fake request object, with req.query.text set to 'input'
            const req = { query: {text: 'input'} };
            // A fake response object, with stubbed send which asserts that it is called
            const res = {
                send: (data) => {
                    assert.equal(data, "Hello from Firebase!");
                    done();
                }
            };

            myFunctions.helloWorld(req, res);
        });
    });

    describe('#attachCropScoreToCms', () => {
        it('should update the document', (done) => {
            // TODO: Add test here
            done();
        });
    });
});