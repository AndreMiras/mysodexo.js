#!/usr/bin/env node
import * as api from "./index";
import { BASE_URL } from "./constants";
import { isApiError, isNodeError, ApiError, ApiErrorCodes } from "./errors";
import read from "read";
import * as path from "path";
import * as fs from "fs";

const APPLICATION_NAME = "mysodexo";
const SESSION_CACHE_FILENAME = "session.cache";

const asyncRead = (options: any): Promise<string> =>
  new Promise((resolve, reject) =>
    read(
      options,
      (error: any, result: string) =>
        (error && reject(error)) || resolve(result)
    )
  );

/*
 * Prompt user for credentials and the return them.
 */
const promptLogin = async () => {
  const email = await asyncRead({ prompt: "email: " });
  const password = await asyncRead({ prompt: "password: ", silent: true });
  return { email, password };
};

/*
 * Return OS dependent base data directory.
 */
const baseDataDir = () =>
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? process.env.HOME + "/Library/Preferences"
    : process.env.HOME + "/.local/share");

/*
 * Return file path used to store the session cookie.
 */
const getSessionCachePath = () =>
  path.join(exports.baseDataDir(), APPLICATION_NAME, SESSION_CACHE_FILENAME);

/*
 * Return session and DNI from cache.
 */
const getCachedSessionInfo = () =>
  JSON.parse(fs.readFileSync(exports.getSessionCachePath()).toString());

/*
 * Store session info to cache.
 */
const cacheSessionInfo = (cookie: string, dni: string) => {
  const sessionCachePath = exports.getSessionCachePath();
  const cachedSessionInfo = {
    cookie,
    dni,
  };
  fs.mkdirSync(path.dirname(sessionCachePath), { recursive: true });
  fs.writeFileSync(sessionCachePath, JSON.stringify(cachedSessionInfo));
};

/*
 * Login and return session info.
 */
const login = async () => {
  const { email, password } = await exports.promptLogin();
  const { cookie, accountInfo } = await api.login(email, password);
  const { dni } = accountInfo;
  return { cookie, dni };
};

/*
 * Login and store session info to cache.
 */
const processLogin = async () => {
  const { cookie, dni } = await exports.login();
  exports.cacheSessionInfo(cookie, dni);
  return { cookie, dni };
};

/**
 * Should login if the session file storing the cookie doesn't exist or if the session has expired.
 */
const shouldLogin = (error: unknown): boolean =>
  (isNodeError(error) && error.code === "ENOENT") ||
  (isApiError(error) && error.code === ApiErrorCodes.SESSION_EXPIRED);

/*
 * Retrieve session from cache or prompt login then store session.
 */
const getSessionOrLogin = async () => {
  try {
    const { cookie } = await exports.getCachedSessionInfo();
    // check the session hasn't expired and retrieve fresh account info
    return await api.loginFromSession(cookie);
  } catch (error: unknown) {
    return shouldLogin(error)
      ? exports.processLogin()
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
 * Retrieve and print balance per card.
 */
const processBalance = async () => {
  const { cookie, dni } = await exports.getSessionOrLogin();
  const cardList = await api.getCards(cookie, dni);
  const cardsDetails = await Promise.all(
    cardList.map(async (card: any) =>
      api.getDetailCard(cookie, card.cardNumber)
    )
  );
  printBalance(cardsDetails);
  return cardsDetails;
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
mainIsModule(require.main, module) && main(process.argv);
