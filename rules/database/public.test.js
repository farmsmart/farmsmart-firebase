const firebase = require("@firebase/testing");
const fs = require("fs");

const databaseName = `database-${Date.now()}`;
const rules = fs.readFileSync("database/database.rules.json", "utf8");
let app;

// Database emulator must be running
// firebase serve --only database

describe("Realtime Database public access", () => {
  beforeAll(async () => {
    app = await firebase.initializeTestApp({
      databaseName: databaseName
    });

    await firebase.loadDatabaseRules({
      databaseName: databaseName,
      rules: rules
    });
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });

  it("should deny reads", async () => {
    await firebase.assertFails(
      app
        .database()
        .ref("secret")
        .once("value")
    );
  });

  it("should deny writes", async () => {
    await firebase.assertFails(
      app
        .database()
        .ref("secret")
        .once("value")
    );
  });
});
