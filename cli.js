#!/usr/bin/env node
const read = require('read');
const api = require('./index.js');


const help = () => {
  console.log('help'); // eslint-disable-line no-console
};

const promptLogin = (callback) => {
  read({ prompt: 'email: ' }, (error, email) => {
    read({ prompt: 'password: ', silent: true }, (error, password) => {
      callback(email, password);
    });
  });
};

const cacheSessionInfo = (cookieJar, dni) => {
  void(dni); // pleases the linter for now until we do something
};

/*
 * Logins and stores session info to cache.
 */
const login = () => {
  const loginCallback = (response) => {
    const { cookieJar, accountInfo } = response;
    console.log('account info:'); // eslint-disable-line no-console
    api.stringifyLog(accountInfo);
    const { dni } = accountInfo;
    cacheSessionInfo(cookieJar, dni);
  };
  const promptLoginCallback = (email, password) => {
    api.login(email, password, loginCallback);
  };
  promptLogin(promptLoginCallback);
};

const balance = () => {
  console.log('balance'); // eslint-disable-line no-console
};

const main = () => {
  const args = process.argv.slice(2);
  const arg2Function = arg => ({ login: login, balance: balance }[arg] || help);
  const arg = args[0].replace(/^--/, '');
  const fun = arg2Function(arg);
  fun();
};

const mainIsModule = (module, main) => main === module;
mainIsModule(require.main, module) ? main() : null;
