const cheerio = require("cheerio")
const axios = require("axios")
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

/**
 * Получает данные теста по сессии
 * @param {string} userSession Сессия пользователя проходящего тест
 * @returns 
 */
async function getTestSession(userSession) {
    const response = await client.get(`https://naurok.com.ua/api2/test/sessions/${session}`, {
        headers: {
            "sec-ch-ua": "\"Microsoft Edge\";v=\"142\", \"Chromium\";v=\"142\", \"Not A(Brand\";v=\"22\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "upgrade-insecure-requests": "1"
        },
    });

    if (response.status !== 200) throw Error(`HTTP: ${response.status}; Text: ${response.statusText}`);

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
 * @param {string} id Айди пользователя
 * @param {string} name Имя пользователя
 * @returns 
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

    return csrf;
}

/**
 * Отвечает на вопрос
 * @param {string} sessionId  Сессия пользователя проходящего тест
 * @param {string} answerId Айди ответа
 * @param {string} questionId Айди вопроса
 * @returns 
 */
async function setTestAnswer(sessionId, answerId, questionId) {
    const response = await fetch("https://naurok.com.ua/api2/test/responses/answer", {
        method: "PUT",
        mode: "cors",
        credentials: "include",
        referrerPolicy: "strict-origin-when-cross-origin",
        headers: {
            "accept": "application/json, text/plain, */*",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin"
        },
        body: JSON.stringify({
            session_id: sessionId,
            answer: [answerId],
            question_id: questionId,
            show_answer: 0,
            type: "quiz",
            point: "2",
            homeworkType: 1,
            homework: false
        })
    })

    return response.json()
}

/**
 * Завершает тест
 * @param {string} userSession Сессия пользователя проходящего тест
 * @returns 
 */
function endTestSession(userSession) {
    return axios.post(`https://naurok.com.ua/api2/test/sessions/end/${session}`, {
        method: "PUT",
        headers: {
            "accept": "application/json, text/plain, */*",
        },
    })
}

module.exports = {
    getTestSession,
    joinTestGame,
    setTestAnswer,
    getSessionTokenFromTest,
    endTestSession
}