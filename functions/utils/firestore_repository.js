const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

async function writeDocument(collection, documentId, data) {
  return await admin
    .firestore()
    .collection(collection)
    .doc(documentId)
    .set(data);
}

async function deleteDocument(collection, documentId) {
  return await admin
    .firestore()
    .collection(collection)
    .doc(documentId)
    .delete();
}

exports = module.exports = {
  writeDocument: writeDocument,
  deleteDocument: deleteDocument,
};
