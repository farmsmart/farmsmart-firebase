const firebase = require("@firebase/testing");
const fs = require("fs");

const projectId = `project-${Date.now()}`;
let app;

// Firestore emulator must be running
// firebase serve --only firestore

describe("Firestore authenticated access", () => {
  beforeAll(async () => {
    app = await firebase.initializeTestApp({
      projectId: projectId,
      auth: { uid: "alice", email: "alice@example.com" }
    });

    await firebase.loadFirestoreRules({
      projectId: projectId,
      rules: fs.readFileSync("firestore/firestore.rules", "utf8")
    });
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });

  it("should allow reads", async () => {
    await firebase.assertSucceeds(
      app
        .firestore()
        .collection("private")
        .doc("super-secret-document")
        .get()
    );
  });

  it("should allow writes", async () => {
    await firebase.assertSucceeds(
      app
        .firestore()
        .collection("private")
        .doc("super-secret-document")
        .set({ key: "value" })
    );
  });
});
