const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({ origin: true });
const app = express();

const {
  validateFirebaseIdTokenMiddleware,
  helloService,
  documentService,
} = require('../rest/app_api');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

// Middlewares
app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdTokenMiddleware);

// Services
app.get('/hello', helloService);
app.get('/document', documentService);

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports = module.exports = functions.https.onRequest(app);
