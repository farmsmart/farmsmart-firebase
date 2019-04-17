const { validateSchema } = require('./validate_schema');
const firestore = require('./firestore_repository');

jest.mock('./firestore_repository');

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

  it('should delete existing error log if validaiton passes', () => {
    validateSchema(validDocument);
    expect(firestore.deleteDocument).toBeCalled();
  });

  it('should throw an error if no JSON schema is found', () => {
    expect(() => validateSchema(noSchemaDocument)).toThrow();
  });
});

const validDocument = {
  _fl_meta_: {
    schema: 'crop',
  },
  name: 'tomato',
  status: 'PUBLISHED',
};

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
