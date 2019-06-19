const Ajv = require('ajv');
const firestore = require('../utils/firestore_repository');
const slack = require('../utils/slack_alert');
const fs = require('fs');
const path = require('path');

const ajv = Ajv({ allErrors: true });

function validateSchema(data) {
  const { schema, fl_id } = data._fl_meta_;

  const jsonSchema = getSchema(schema);
  const valid = ajv.validate(jsonSchema, data);
  const msg = `Schema validation - doc: ${fl_id}, schema: ${schema}, result: `;

  if (valid) {
    console.log(`${msg} PASSED`);
    return firestore.deleteDocument('fs_content_errors', fl_id);
  } else {
    console.log(`${msg} FAILED`);
    slack.post(`${msg} FAILED`);
    return firestore.writeDocument('fs_content_errors', fl_id, getContentError(data));
  }
}

function getSchema(schema) {
  const filepath = path.resolve(__dirname, `../model/schemas/${schema}.schema.json`);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } else {
    const msg = `Could not find schema. Schema: ${schema}`;
    slack.post(msg);
    throw new Error(msg);
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
