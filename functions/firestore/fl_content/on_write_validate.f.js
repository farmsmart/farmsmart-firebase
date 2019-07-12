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

const writeErrorLog = (id, schema, errors) => {
  return firestore.writeDocument(errorPath(id), { schema: schema, errors: errors });
};

const clearErrorLog = id => {
  return firestore.deleteDocument(errorPath(id));
};

const sendAlert = msg => {
  return slack.post(msg);
};

const validateDocumentSchema = async (id, data) => {
  if (data.status === 'PUBLISHED') {
    const schema = data._fl_meta_.schema;
    const errors = validateSchema(schema, data);
    const msg = result => `Schema validation - doc: ${id}, schema: ${schema}, result: ${result}`;

    if (errors) {
      await writeErrorLog(id, schema, errors);
      await sendAlert(msg('FAILED'));
      throw Error(msg('FAILED'));
    } else {
      console.log(msg('PASSED'));
      return clearErrorLog(id);
    }
  }
};

module.exports = functions.firestore.document('fl_content/{id}').onWrite((change, context) => {
  if (!change.after.exists) {
    return firestore.deleteDocument(errorPath(change.before.id));
  }

  return validateDocumentSchema(change.after.id, change.after.data());
});
