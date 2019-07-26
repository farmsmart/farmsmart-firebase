const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({ origin: true });
const app = express();

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  if (
    (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
    !(req.cookies && req.cookies.__session)
  ) {
    console.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.'
    );
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);
app.get('/hello', (req, res) => {
  res.send(`Hello ${req.user.name}`);
});
app.get('/document', async (req, res) => {
  if (req.query.docId && req.query.collection) {
    let docId = req.query.docId;
    let collection = req.query.collection;

    let db = admin.firestore();
    let colRef = db.collection(collection);
    let docRef = await colRef.doc(docId).get();

    if (docRef.exists) {
      //res.set('Cache-Control', 'public, max-age=120, s-maxage=120');
      res.set('Cache-Control', 'private, max-age=120, s-maxage=120');
      console.log(`Fetching $docId from $collection`);
      res.json(docRef.data());
    } else {
      console.log(`Document $docId is not found in $collection`);
      res.status(404).send(`Document not found`);
    }
  } else {
    res.status(400).send('Please supply collection and docId');
  }
});

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports = module.exports = functions.https.onRequest(app);
