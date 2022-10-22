import { ok } from "assert";
import request from "request";
import * as fs from "fs";
import * as path from "path";
import { BASE_URL } from "./constants";
import { GetClearPinResponse } from "./types";

const LOGIN_ENDPOINT = "v3/connect/login";
const GET_CARDS_ENDPOINT = "v3/card/getCards";
const GET_DETAIL_CARD_ENDPOINT = "v2/card/getDetailCard";
const GET_CLEAR_PIN_ENDPOINT = "v1/card/getClearPin";
const JSON_RESPONSE_OK_CODE = 100;
const JSON_RESPONSE_OK_MSG = "OK";
const DEFAULT_DEVICE_UID = "device_uid";
const DEFAULT_OS = 0;

const CERT_FILENAME = "sodexows.mo2o.com_client-android.crt.pem";
const KEY_FILENAME = "sodexows.mo2o.com_client-android.key.pem";
const certFilePath = path.resolve(__dirname, CERT_FILENAME);
const keyFilePath = path.resolve(__dirname, KEY_FILENAME);

/*
 * Indented JSON.stringify() alias.
 */
const stringify = (value: any) => JSON.stringify(value, null, "  ");

/*
 * Logs value to console as a JSON string.
 */
const stringifyLog = (value: any) => console.log(stringify(value)); // eslint-disable-line no-console

const stripEndpoint = (endpoint: string) => endpoint.replace(/^\/+/, "");

const getFullEndpointUrl = (endpoint: string, lang: string) =>
  `${BASE_URL}/${lang}/${stripEndpoint(endpoint)}`;

/*
 * Raises an error if any in the `jsonResponse`.
 */
const handleCodeMsg = ({
  code,
  msg,
}: {
  code: number | null;
  msg: string | null;
}) => {
  ok(code === JSON_RESPONSE_OK_CODE);
  ok(msg === JSON_RESPONSE_OK_MSG);
};

/*
 * Posts `jsonData` to `endpoint` using the `cookieJar`.
 * Handles errors and callback with the json response.
 */
const sessionPost = (
  cookieJar: any,
  endpoint: string,
  jsonData: any,
  callback: any
) => {
  const lang = "en";
  const url = getFullEndpointUrl(endpoint, lang);
  const options = {
    url,
    json: jsonData,
    jar: cookieJar,
    cert: fs.readFileSync(certFilePath),
    key: fs.readFileSync(keyFilePath),
  };
  const postCallback = (error: any, response: request.Response, body: any) => {
    ok(!error);
    ok(response && response.statusCode == 200, stringify(response));
    handleCodeMsg(body);
    callback(body.response);
  };
  request.post(options, postCallback);
};

/*
 * Logins with credentials and returns session and account info.
 */
const login = (email: string, password: string, callback: any) => {
  const endpoint = LOGIN_ENDPOINT;
  const cookieJar = request.jar();
  const jsonData = {
    username: email,
    pass: password,
    deviceUid: DEFAULT_DEVICE_UID,
    os: DEFAULT_OS,
  };
  sessionPost(cookieJar, endpoint, jsonData, (accountInfo: any) =>
    callback({ cookieJar, accountInfo })
  );
};

/*
 * Returns cards list and details using the cookie provided.
 */
const getCards = (cookieJar: any, dni: string, callback: any) => {
  const endpoint = GET_CARDS_ENDPOINT;
  const jsonData = { dni };
  sessionPost(
    cookieJar,
    endpoint,
    jsonData,
    ({ listCard }: { listCard: any[] }) => callback(listCard)
  );
};

/*
 * Returns card details.
 */
const getDetailCard = (cookieJar: any, cardNumber: string, callback: any) => {
  const endpoint = GET_DETAIL_CARD_ENDPOINT;
  const jsonData = { cardNumber };
  sessionPost(
    cookieJar,
    endpoint,
    jsonData,
    ({ cardDetail }: { cardDetail: any }) => callback(cardDetail)
  );
};

/*
 * Returns card pin.
 */
const getClearPin = (cookieJar: any, cardNumber: string, callback: any) => {
  const endpoint = GET_CLEAR_PIN_ENDPOINT;
  const jsonData = { cardNumber };
  const postCallBack = ({ clearPin }: GetClearPinResponse) =>
    callback(clearPin.pin);
  sessionPost(cookieJar, endpoint, jsonData, postCallBack);
};

/*
 * Given environment variable `EMAIL` and `PASSWORD` retries card details
 * and triggers `mainCallback`.
 */
const main = (mainCallback: any = null) => {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  ok(email);
  ok(password);
  const getDetailCardCallback = (cardDetail: any) => {
    const { cardNumber } = cardDetail;
    console.log(`details ${cardNumber}:`); // eslint-disable-line no-console
    stringifyLog(cardDetail);
    typeof mainCallback == "function" && mainCallback();
  };
  const getCardsCallback =
    (cookieJar: request.CookieJar) => (cardList: any[]) => {
      const cards = cardList;
      console.log("cards:"); // eslint-disable-line no-console
      stringifyLog(cardList);
      const card = cards[0];
      const { cardNumber } = card;
      getDetailCard(cookieJar, cardNumber, getDetailCardCallback);
    };
  const loginCallback = ({
    cookieJar,
    accountInfo,
  }: {
    cookieJar: request.CookieJar;
    accountInfo: any;
  }) => {
    console.log("account info:"); // eslint-disable-line no-console
    stringifyLog(accountInfo);
    getCards(cookieJar, accountInfo.dni, getCardsCallback(cookieJar));
  };
  login(email, password, loginCallback);
};

const mainIsModule = (module: any, main: any) => main === module;
mainIsModule(require.main, module) && main();

export {
  getFullEndpointUrl,
  handleCodeMsg,
  stringifyLog,
  sessionPost,
  login,
  getCards,
  getDetailCard,
  getClearPin,
  main,
};
