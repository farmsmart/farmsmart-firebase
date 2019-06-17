const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { validateSchema } = require('../../validate/validate_schema');
const firestore = require('../../utils/firestore_repository');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

exports = module.exports = functions.firestore
  .document('fl_content/{id}')
  .onWrite((change, context) => {
    const data = change.after.data();

    if (change.after.exists && data.status === 'PUBLISHED') {
      return validateSchema(data);
    } else {
      return firestore.deleteDocument('fs_content_errors', change.before.id);
    }
  });
