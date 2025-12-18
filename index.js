const { getTestSession,
    joinTestGame,
    setTestAnswer,
    getSessionTokenFromTest,
    endTestSession } = require("./src/api");

getTestSession(644569496).then(console.log)