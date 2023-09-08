import assert from "assert";
import https from "https";
import fetch, { Response } from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import {
  LoginResponse,
  LoginFunctionResponse,
  CardResponseItem,
  CardDetail,
} from "./types";
import { BASE_URL } from "./constants";
import { ApiError } from "./errors";

const LOGIN_ENDPOINT = "v3/connect/login";
const LOGIN_FROM_SESSION_ENDPOINT = "v3/connect/loginFromSession";
const GET_CARDS_ENDPOINT = "v3/card/getCards";
const GET_DETAIL_CARD_ENDPOINT = "v2/card/getDetailCard";
const GET_CLEAR_PIN_ENDPOINT = "v1/card/getClearPin";
const JSON_RESPONSE_OK_CODE = 100;
const JSON_RESPONSE_OK_MSG = "OK";
const DEFAULT_DEVICE_UID = "device_uid";
const DEFAULT_OS = 0;

const CERT_FILENAME = "sodexows.mo2o.com_client-android.p12";
const certFilePath = path.resolve(__dirname, CERT_FILENAME);
const CERT_PASSPHRASE = "0d43f1b6ceb6456193975ec4f9459c0d";

interface CodeMsg {
  code: number | null;
  msg: string | null;
}

interface PostResponse {
  response: Record<string, any>;
  cookie: string;
}

/*
 * Indented JSON.stringify() alias.
 */
const stringify = (
  value: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
) => JSON.stringify(value, null, "  ");

/*
 * Log value to console as a JSON string.
 */
const stringifyLog = (
  value: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
) => console.log(stringify(value)); // eslint-disable-line no-console

const stripEndpoint = (endpoint: string) => endpoint.replace(/^\/+/, "");

const getFullEndpointUrl = (endpoint: string, lang: string) =>
  `${BASE_URL}/${lang}/${stripEndpoint(endpoint)}`;

const isResponseOk = ({ code, msg }: CodeMsg) =>
  JSON.stringify({ code, msg }) ===
  JSON.stringify({ code: JSON_RESPONSE_OK_CODE, msg: JSON_RESPONSE_OK_MSG });

/*
 * Raise an error if any in the `jsonResponse`.
 */
const handleCodeMsg = ({ code, msg }: CodeMsg) => {
  isResponseOk({ code, msg }) ||
    (() => {
      throw new ApiError(msg || "", code || 0);
    })();
};

const parseCookies = (response: Response): string => {
  const raw = response.headers.raw()["set-cookie"] || [];
  return raw
    .map((entry) => {
      const parts = entry.split(";");
      const cookiePart = parts[0];
      return cookiePart;
    })
    .join(";");
};

/*
 * Post `jsonData` to `endpoint`.
 * Handle errors and return the `response` key of the body as well as the cookies.
 */
const post = async (
  cookie: string,
  endpoint: string,
  jsonData: Record<string, any>
): Promise<PostResponse> => {
  const lang = "en";
  const url = getFullEndpointUrl(endpoint, lang);
  const pfx = fs.readFileSync(certFilePath);
  const passphrase = CERT_PASSPHRASE;
  const agent = new https.Agent({ pfx, passphrase });
  const headers = {
    "content-type": "application/json",
    accept: "application/json",
    cookie,
  };
  const options = {
    method: "POST",
    agent,
    body: JSON.stringify(jsonData),
    headers,
  };
  const response = await fetch(url, options);
  const data = await response.json();
  handleCodeMsg(data as CodeMsg);
  return { response: data.response, cookie: parseCookies(response) };
};

/*
 * Wrap `post()` and only return the response (omit the cookie).
 */
const sessionPost = async (
  cookie: string,
  endpoint: string,
  jsonData: Record<string, any>
): Promise<Record<string, any>> => {
  return (await post(cookie, endpoint, jsonData)).response;
};

/*
 * Login with credentials and return session and account info.
 */
const login = async (
  email: string,
  password: string
): Promise<LoginFunctionResponse> => {
  const endpoint = LOGIN_ENDPOINT;
  const cookies = "";
  const jsonData = {
    username: email,
    pass: password,
    deviceUid: DEFAULT_DEVICE_UID,
    os: DEFAULT_OS,
  };
  const { response: accountInfo, cookie } = await post(
    cookies,
    endpoint,
    jsonData
  );
  return { accountInfo: accountInfo as LoginResponse["response"], cookie };
};

/*
 * Login from session and return account info.
 */
const loginFromSession = async (
  cookie: string
): Promise<LoginResponse["response"]> => {
  const endpoint = LOGIN_FROM_SESSION_ENDPOINT;
  const jsonData = {};
  const accountInfo = await sessionPost(cookie, endpoint, jsonData);
  return accountInfo as LoginResponse["response"];
};

/*
 * Return cards list and details using the cookie provided.
 */
const getCards = async (
  cookie: string,
  dni: string
): Promise<CardResponseItem[]> => {
  const endpoint = GET_CARDS_ENDPOINT;
  const jsonData = { dni };
  const { listCard } = await sessionPost(cookie, endpoint, jsonData);
  return listCard;
};

/*
 * Return card details.
 */
const getDetailCard = async (
  cookie: string,
  cardNumber: string
): Promise<CardDetail> => {
  const endpoint = GET_DETAIL_CARD_ENDPOINT;
  const jsonData = { cardNumber };
  const { cardDetail } = await sessionPost(cookie, endpoint, jsonData);
  return cardDetail;
};

/*
 * Return card pin.
 */
const getClearPin = async (cookie: string, cardNumber: string) => {
  const endpoint = GET_CLEAR_PIN_ENDPOINT;
  const jsonData = { cardNumber };
  const { clearPin } = await sessionPost(cookie, endpoint, jsonData);
  return clearPin.pin;
};

/*
 * Given environment variable `EMAIL` and `PASSWORD` retrieve card details.
 */
const main = async () => {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  assert.ok(email);
  assert.ok(password);
  const { cookie, accountInfo } = await login(email, password);
  console.log("account info:"); // eslint-disable-line no-console
  stringifyLog(accountInfo);
  const cards = await getCards(cookie, accountInfo.dni);
  console.log("cards:"); // eslint-disable-line no-console
  stringifyLog(cards);
  const card = cards[0];
  const { cardNumber } = card;
  console.log(`details ${cardNumber}:`); // eslint-disable-line no-console
  const cardDetail = await getDetailCard(cookie, cardNumber);
  stringifyLog(cardDetail);
};

const mainIsModule = (module: any, main: NodeModule) => main === module;
mainIsModule(require.main, module) && main();

export type {
  LoginResponse,
  LoginFunctionResponse,
  CardResponseItem,
  CardDetail,
};

export {
  getFullEndpointUrl,
  handleCodeMsg,
  stringifyLog,
  sessionPost,
  login,
  loginFromSession,
  getCards,
  getDetailCard,
  getClearPin,
  main,
};
