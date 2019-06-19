const { validateSchema } = require('./validate_schema');
const firestore = require('../utils/firestore_repository');
const validDocument = require('../model/json/crop.sample.json');
const slack = require('../utils/slack_alert');

jest.mock('../utils/firestore_repository');
jest.mock('../utils/slack_alert');

describe('Validate schema', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should write to error log if validation fails', () => {
    validateSchema(invalidDocument);
    expect(firestore.writeDocument).toBeCalled();
  });

  it('should post a slack alert if validation fails', () => {
    validateSchema(invalidDocument);
    expect(slack.post).toBeCalled();
  });

  it('should delete existing error log if validation passes', () => {
    validateSchema(validDocument);
    expect(firestore.deleteDocument).toBeCalled();
  });

  it('should throw an error if no JSON schema is found', () => {
    expect(() => validateSchema(noSchemaDocument)).toThrow();
  });

  it('should post a slack alert if no JSON schema is found', () => {
    try {
      validateSchema(noSchemaDocument);
    } catch (error) {
      expect(slack.post).toBeCalled();
    }
  });
});

const invalidDocument = {
  _fl_meta_: {
    schema: 'crop',
  },
  noName: 'tomato',
  status: 'PUBLISHED',
};

const noSchemaDocument = {
  _fl_meta_: {
    schema: 'noSchema',
    env: 'Production',
  },
  name: 'tomato',
  status: 'PUBLISHED',
};
