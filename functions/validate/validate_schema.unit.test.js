const { validateSchema } = require('./validate_schema');

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

describe('Validate schema', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return errors if schema is invalid', () => {
    const errors = validateSchema('crop', invalidDocument);
    expect(errors).toBeTruthy();
  });

  it('should throw an error if no JSON schema is found', () => {
    expect(() => validateSchema('noShema', noSchemaDocument)).toThrow();
  });
});
