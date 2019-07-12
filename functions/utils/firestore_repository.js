const admin = require('firebase-admin');

const getDocument = path => {
  return admin
    .firestore()
    .doc(path)
    .get();
};

const writeDocument = (path, data) => {
  return admin
    .firestore()
    .doc(path)
    .set(data);
};

const deleteDocument = path => {
  return admin
    .firestore()
    .doc(path)
    .delete();
};

module.exports = {
  getDocument,
  writeDocument,
  deleteDocument,
};
