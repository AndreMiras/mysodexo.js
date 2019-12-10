#!/usr/bin/env node
const api = require('./index.js');
const { BASE_URL } = require('./constants.js');
const request = require('request');
const read = require('read');
const path = require('path');
const fs = require('fs');



const APPLICATION_NAME = 'mysodexo';
const SESSION_CACHE_FILENAME = 'session.cache';

/*
 * Prompts user for credentials and the returns them through the callback.
 */
const promptLogin = (callback) => {
  read({ prompt: 'email: ' }, (error, email) => {
    read({ prompt: 'password: ', silent: true }, (error, password) => {
      callback(email, password);
    });
  });
};

/*
 * Returns OS dependent base data directory.
 */
const baseDataDir = () => (
  process.env.APPDATA || (
    process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")
);

/*
 * Returns file path used to store the session cookie.
 */
const getSessionCachePath = () => path.join(exports.baseDataDir(), APPLICATION_NAME, SESSION_CACHE_FILENAME);

/*
 * Returns session and DNI from cache.
 */
const getCachedSessionInfo = () => (
  JSON.parse(fs.readFileSync(exports.getSessionCachePath()))
);

/*
 * Stores session info to cache.
 */
const cacheSessionInfo = (cookieJar, dni) => {
  const sessionCachePath = exports.getSessionCachePath();
  const cookies = cookieJar.getCookieString(BASE_URL);
  const cachedSessionInfo = {
    cookies,
    dni,
  };
  fs.mkdirSync(path.dirname(sessionCachePath), { recursive: true });
  fs.writeFileSync(sessionCachePath, JSON.stringify(cachedSessionInfo));
};

/*
 * Logins and returns session info.
 */
const login = (callback) => {
  const loginCallback = (response) => {
    const { cookieJar, accountInfo } = response;
    const { dni } = accountInfo;
    callback(cookieJar, dni);
  };
  const promptLoginCallback = (email, password) => {
    api.login(email, password, loginCallback);
  };
  exports.promptLogin(promptLoginCallback);
};

/*
 * Logins and stores session info to cache.
 * Callback is optional.
 */
const processLogin = (callback) => {
  const loginCallback = (cookieJar, dni) => {
    exports.cacheSessionInfo(cookieJar, dni);
    typeof callback == 'function' && callback(cookieJar, dni);
  };
  exports.login(loginCallback);
};

/*
 * Retrieves session from cache or prompts login then stores session.
 */
const getSessionOrLogin = (callback) => {
  try {
    const { cookies, dni } = exports.getCachedSessionInfo();
    const cookieJar = request.jar();
    const cookie = request.cookie(cookies);
    cookieJar.setCookie(cookie, BASE_URL);
    callback(cookieJar, dni);
  } catch (exception) {
    exception.code === 'ENOENT' ? exports.processLogin(callback) : (() => {throw exception})();
  }
};

/*
 * Prints per card balance.
 */
const printBalance = (cardsDetails) => {
  cardsDetails.forEach((cardDetail) => {
    console.log(`${cardDetail.pan}: ${cardDetail.cardBalance}`); // eslint-disable-line no-console
  });
};

/*
 * Retrieves and prints balance per card.
 */
const processBalance = (callback) => {
  let cardsDetails = [];
  const processBalanceCallback = (cardsDetails) => {
    printBalance(cardsDetails);
    typeof callback == 'function' && callback(cardsDetails);
  };
  const getDetailCardCallback = (total) => (cardDetail) => {
    cardsDetails = cardsDetails.concat([cardDetail]);
    cardsDetails.length === total && processBalanceCallback(cardsDetails);
  };
  const getCardsCallback = (cookieJar) => (cardList) => {
    cardList.forEach((card) => {
      api.getDetailCard(cookieJar, card.cardNumber, getDetailCardCallback(cardList.length));
    });
  };
  const getSessionOrLoginCallback = (cookieJar, dni) => {
    api.getCards(cookieJar, dni, getCardsCallback(cookieJar));
  };
  exports.getSessionOrLogin(getSessionOrLoginCallback);
};

const help = () => {
  console.log( // eslint-disable-line no-console
    'Usage:\n' +
    'mysodexo --help\t\tthis message\n' +
    'mysodexo --login\tlogins and caches the session\n' +
    'mysodexo --balance\tprints the balance'
  );
};

const main = (argv) => {
  const args = argv.slice(2);
  const arg2FunctionMap = {
    login: exports.processLogin,
    balance: exports.processBalance,
    help: exports.help,
  };
  // defaults to help if unknown
  const arg2Function = arg => (arg2FunctionMap[arg] || exports.help);
  // defaults to help if no args provided
  const arg = args[0] ? args[0].replace(/^--/, '') : 'help';
  const fun = arg2Function(arg);
  fun();
};

const mainIsModule = (module, main) => main === module;

module.exports = {
  promptLogin,
  baseDataDir,
  getSessionCachePath,
  getCachedSessionInfo,
  cacheSessionInfo,
  login,
  processLogin,
  getSessionOrLogin,
  processBalance,
  help,
  main,
};
exports = module.exports;
mainIsModule(require.main, module) && main(process.argv);
