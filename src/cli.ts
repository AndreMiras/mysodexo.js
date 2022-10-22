#!/usr/bin/env node
import * as api from "./index";
import { BASE_URL } from "./constants";
import * as request from "request";
import read from "read";
import * as path from "path";
import * as fs from "fs";

const APPLICATION_NAME = "mysodexo";
const SESSION_CACHE_FILENAME = "session.cache";

interface PromptLoginCallbackType {
  (email: string, password: string): void;
}
interface LoginCallbackType {
  (cookieJar: request.CookieJar, dni: string): void;
}
interface GetSessionOrLoginCallbackType {
  (cookieJar: request.CookieJar, dni: string): void;
}

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error;

/*
 * Prompts user for credentials and the returns them through the callback.
 */
const promptLogin = (callback: PromptLoginCallbackType) => {
  read({ prompt: "email: " }, (error: any, email: string) => {
    read(
      { prompt: "password: ", silent: true },
      (error: any, password: string) => {
        callback(email, password);
      }
    );
  });
};

/*
 * Returns OS dependent base data directory.
 */
const baseDataDir = () =>
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? process.env.HOME + "/Library/Preferences"
    : process.env.HOME + "/.local/share");

/*
 * Returns file path used to store the session cookie.
 */
const getSessionCachePath = () =>
  path.join(exports.baseDataDir(), APPLICATION_NAME, SESSION_CACHE_FILENAME);

/*
 * Returns session and DNI from cache.
 */
const getCachedSessionInfo = () =>
  JSON.parse(fs.readFileSync(exports.getSessionCachePath()).toString());

/*
 * Stores session info to cache.
 */
const cacheSessionInfo = (cookieJar: request.CookieJar, dni: string) => {
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
const login = (callback: LoginCallbackType) => {
  const loginCallback = (response: any) => {
    const { cookieJar, accountInfo } = response;
    const { dni } = accountInfo;
    callback(cookieJar, dni);
  };
  const promptLoginCallback = (email: string, password: string) => {
    api.login(email, password, loginCallback);
  };
  exports.promptLogin(promptLoginCallback);
};

/*
 * Logins and stores session info to cache.
 * Callback is optional.
 */
const processLogin = (callback: any) => {
  const loginCallback = (cookieJar: request.CookieJar, dni: string) => {
    exports.cacheSessionInfo(cookieJar, dni);
    typeof callback == "function" && callback(cookieJar, dni);
  };
  exports.login(loginCallback);
};

/*
 * Retrieves session from cache or prompts login then stores session.
 */
const getSessionOrLogin = (callback: GetSessionOrLoginCallbackType) => {
  try {
    const { cookies, dni } = exports.getCachedSessionInfo();
    const cookieJar = request.jar();
    const cookie = request.cookie(cookies);
    cookieJar.setCookie(cookie!, BASE_URL);
    callback(cookieJar, dni);
  } catch (error: unknown) {
    isNodeError(error) && error.code === "ENOENT"
      ? exports.processLogin(callback)
      : (() => {
          throw error;
        })();
  }
};

/*
 * Prints per card balance.
 */
const printBalance = (cardsDetails: any[]) => {
  cardsDetails.forEach((cardDetail: any) => {
    console.log(`${cardDetail.pan}: ${cardDetail.cardBalance}`); // eslint-disable-line no-console
  });
};

/*
 * Retrieves and prints balance per card.
 */
const processBalance = (callback: any) => {
  let cardsDetails: any[] = [];
  const processBalanceCallback = (cardsDetails: any) => {
    printBalance(cardsDetails);
    typeof callback == "function" && callback(cardsDetails);
  };
  const getDetailCardCallback = (total: number) => (cardDetail: any) => {
    cardsDetails = cardsDetails.concat([cardDetail]);
    cardsDetails.length === total && processBalanceCallback(cardsDetails);
  };
  const getCardsCallback =
    (cookieJar: request.CookieJar) => (cardList: any[]) => {
      cardList.forEach((card: any) => {
        api.getDetailCard(
          cookieJar,
          card.cardNumber,
          getDetailCardCallback(cardList.length)
        );
      });
    };
  const getSessionOrLoginCallback = (
    cookieJar: request.CookieJar,
    dni: string
  ) => {
    api.getCards(cookieJar, dni, getCardsCallback(cookieJar));
  };
  exports.getSessionOrLogin(getSessionOrLoginCallback);
};

const version = () => console.log(process.env.npm_package_version);

const help = () => {
  console.log(
    // eslint-disable-line no-console
    "Usage:\n" +
      "mysodexo --help\t\tthis message\n" +
      "mysodexo --login\tlogins and caches the session\n" +
      "mysodexo --balance\tprints the balance\n" +
      "mysodexo --version\tprints the version"
  );
};

const main = (argv: string[]) => {
  const args = argv.slice(2);
  const arg2FunctionMap: { [key: string]: any } = {
    login: exports.processLogin,
    balance: exports.processBalance,
    help: exports.help,
    version: exports.version,
  };
  // defaults to help if unknown
  const arg2Function = (arg: string) => arg2FunctionMap[arg] || exports.help;
  // defaults to help if no args provided
  const arg = args[0] ? args[0].replace(/^--/, "") : "help";
  const fun = arg2Function(arg);
  fun();
};

const mainIsModule = (module: any, main: any) => main === module;

export type { PromptLoginCallbackType };

export {
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
  version,
  main,
};
exports = module.exports;
mainIsModule(require.main, module) && main(process.argv);
