const Ajv = require('ajv');

const ajv = Ajv({ allErrors: true });

const getSchema = schema => {
  try {
    const filepath = `../model/schemas/${schema}.schema.json`;
    return require(filepath);
  } catch (error) {
    throw new Error(`Could not find schema. Schema: ${schema}`);
  }
};

const validateSchema = (schema, data) => {
  const jsonSchema = getSchema(schema);
  ajv.validate(jsonSchema, data);
  return ajv.errors;
};

exports = module.exports = {
  validateSchema,
};
