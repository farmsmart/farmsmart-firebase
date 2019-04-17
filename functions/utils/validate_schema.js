const Ajv = require('ajv');
const firestore = require('./firestore_repository');

const ajv = Ajv({ allErrors: true });

function validateSchema(data) {
  const { schema, fl_id } = data._fl_meta_;

  if (validateJsonSchema(schema, data)) {
    console.log(`Schema validation - doc: ${fl_id}, schema: ${schema}, result: PASSED`);
    return firestore.deleteDocument('fs_content_errors', fl_id);
  } else {
    console.log(`Schema validation - doc: ${fl_id}, schema: ${schema}, result: FAILED`);
    return firestore.writeDocument('fs_content_errors', fl_id, getContentError(data));
  }
}

function validateJsonSchema(schemaName, json) {
  try {
    const schemaPath = `../schemas/${schemaName}.schema.json`;
    const schema = require(schemaPath);
    return ajv.validate(schema, json);
  } catch (err) {
    throw new Error(`Could not find schema. Schema: ${schemaName}`);
  }
}

function getContentError(data) {
  return {
    name: data.name || data.title,
    fl_id: data._fl_meta_.fl_id,
    env: data._fl_meta_.env,
    locale: data._fl_meta_.locale,
    schema: data._fl_meta_.schema,
    errors: ajv.errors,
  };
}

exports = module.exports = {
  validateSchema: validateSchema,
};
