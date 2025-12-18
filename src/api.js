const cheerio = require("cheerio")
const axios = require("axios")
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

/**
 * Получает данные теста по сессии
 * @param {number} userSession Сессия пользователя проходящего тест
 * @returns 
 */
async function getTestSession(userSession) {
    const response = await client.get(`https://naurok.com.ua/api2/test/sessions/${userSession}`);

    if (response.status !== 200)
        throw Error(`HTTP: ${response.status}; Text: ${response.statusText}`);

    return await response.data;
}

/**
 * Получает сессию пользователя
 * @param {string} html Содержимое страницы с тестом
 * @returns {string} Сессия пользователя проходящего тест
 */
function getSessionTokenFromTest(html) {
    const $ = cheerio.load(html);
    const ngInit = $('div[ng-app="testik"]').attr("ng-init");
    return ngInit.split(",")[1];
}

/**
 * Заходит на тест по указанному айди
 * @param {string} id Айди теста
 * @param {string} name Имя пользователя
 * @example
 * joinTestGame("8807037", "Джони Депп")
 */
async function joinTestGame(id, name) {
    const testResponse = await client.get(`https://naurok.com.ua/test/join?gamecode=${id}`);

    const $ = cheerio.load(await testResponse.data);

    const csrf = $('meta[name="csrf-token"]').attr("content");

    const formData = new FormData();
    formData.append('_csrf', csrf);
    formData.append('JoinForm[gamecode]', id);
    formData.append('JoinForm[name]', name);

    const joinResponse = await client.post(`https://naurok.com.ua/test/join`, formData, {
        headers: {
            'Cookie': testResponse.headers['set-cookie']
        }
    });

    if (joinResponse.status !== 200)
        throw Error(`HTTP: ${joinResponse.status}; Text: ${joinResponse.statusText}`);
}

/**
 * Отвечает на вопрос
 * @param {number} userSession  Сессия пользователя проходящего тест
 * @param {string} questionId Айди вопроса
 * @param {Array<string>} answerIds Айди ответов
 * @returns {object}
 * @example
 * setTestAnswer(123469499, "12342633", ["123440569"]).then(console.log)
 */
async function setTestAnswer(userSession, questionId, answerIds) {
    const answerResponse = await client.put(
        "https://naurok.com.ua/api2/test/responses/answer",
        {
            session_id: userSession,
            answer: answerIds,
            question_id: questionId,
            show_answer: 1,
            type: "quiz",
            point: "2",
            homeworkType: 1,
            homework: true
        }
    );


    if (answerResponse.status !== 200)
        throw Error(`HTTP: ${answerResponse.status}; Text: ${answerResponse.statusText}`);

    return await answerResponse.data
}

/**
 * Завершает тест
 * @param {number} userSession Сессия пользователя проходящего тест
 * @example
 * endTestSession("622275507")
 */
async function endTestSession(userSession) {
    const endTestResponse = await axios.post(`https://naurok.com.ua/api2/test/sessions/end/${userSession}`, {
        method: "PUT",
        headers: {
            "accept": "application/json, text/plain, */*",
        },
    });

    if (endTestResponse.status !== 200)
        throw Error(`HTTP: ${endTestResponse.status}; Text: ${endTestResponse.statusText}`);
}

module.exports = {
    getTestSession,
    joinTestGame,
    setTestAnswer,
    getSessionTokenFromTest,
    endTestSession
}