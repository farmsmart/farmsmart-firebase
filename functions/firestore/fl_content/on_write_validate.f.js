const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { validateSchema } = require('../../validate/validate_schema');
const firestore = require('../../utils/firestore_repository');
const slack = require('../../utils/slack_alert');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

const errorPath = id => `fs_content_errors/${id}`;

const validationFailed = (id, schema, errors) => {
  return firestore.writeDocument(errorPath(id), { schema: schema, errors: errors });
};

const validationPassed = id => {
  return firestore.deleteDocument(errorPath(id));
};

const alert = msg => {
  return slack.post(msg);
};

const validateSchemaOnWrite = async change => {
  const data = change.after.data();
  const schema = data._fl_meta_.schema;

  if (data.status === 'PUBLISHED') {
    const errors = validateSchema(schema, data);
    const msg = result =>
      `Schema validation - doc: ${change.after.id}, schema: ${schema}, result: ${result}`;

    if (errors) {
      await validationFailed(change.after.id, schema, errors);
      await alert(msg('FAILED'));
      throw Error(msg('FAILED'));
    } else {
      console.log(msg('PASSED'));
      return validationPassed(change.after.id);
    }
  }
};

module.exports = functions.firestore.document('fl_content/{id}').onWrite((change, context) => {
  if (!change.after.exists) {
    return firestore.deleteDocument(errorPath(change.before.id));
  }

  return validateSchemaOnWrite(change);
});
