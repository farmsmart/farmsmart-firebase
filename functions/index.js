const admin = require('firebase-admin');
const glob = require('glob');
const camelCase = require('camelcase');

try {
  admin.initializeApp();
} catch (err) {
  // firebase already initialised
}

const files = glob.sync('./**/*.f.js', { cwd: __dirname, ignore: './node_modules/**' });
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const functionName = camelCase(
    file
      .slice(0, -5)
      .split('/')
      .join('_')
  );
  if ((process.env.FUNCTION_NAME || functionName) === functionName) {
    exports[functionName] = require(file);
  }
}
