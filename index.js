const { getTestSession, joinTestGame } = require("./src/api");

const TEST_CODE = "8807037";

joinTestGame(TEST_CODE, "pizda").then(console.log)