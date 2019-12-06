const assert = require('assert');
const request = require('request');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sodexows.mo2o.com';
const LOGIN_ENDPOINT = 'v3/connect/login';
const GET_CARDS_ENDPOINT = 'v3/card/getCards';
const GET_DETAIL_CARD_ENDPOINT = 'v2/card/getDetailCard';
const GET_CLEAR_PIN_ENDPOINT = 'v1/card/getClearPin';
const JSON_RESPONSE_OK_CODE = 100;
const JSON_RESPONSE_OK_MSG = 'OK';
const DEFAULT_DEVICE_UID = 'device_uid';
const DEFAULT_OS = 0;

const CERT_FILENAME = 'sodexows.mo2o.com_client-android.crt.pem';
const KEY_FILENAME = 'sodexows.mo2o.com_client-android.key.pem';
const certFilePath = path.resolve(__dirname, CERT_FILENAME);
const keyFilePath = path.resolve(__dirname, KEY_FILENAME);


/*
 * Indented JSON.stringify() alias.
 */
const stringify = (value) => JSON.stringify(value, null, '  ');

/*
 * Logs value to console as a JSON string.
 */
const stringifyLog = (value) => {
  console.log(stringify(value)); // eslint-disable-line no-console
};

const stripEndpoint = (endpoint) => (endpoint.replace(/^\/+/, ''));

const getFullEndpointUrl = (endpoint, lang) => (
  `${BASE_URL}/${lang}/${stripEndpoint(endpoint)}`
);

/*
 * Raises an error if any in the `jsonResponse`.
 */
const handleCodeMsg = (jsonResponse) => {
  const { code, msg } = jsonResponse;
  assert(code === JSON_RESPONSE_OK_CODE, [code, msg]);
  assert(msg === JSON_RESPONSE_OK_MSG, [code, msg]);
};

/*
 * Posts `jsonData` to `endpoint` using the `cookieJar`.
 * Handles errors and callback with the json response.
 */
const sessionPost = (cookieJar, endpoint, jsonData, callback) => {
  const lang = 'en';
  const url = getFullEndpointUrl(endpoint, lang);
  const options = {
    url,
    json: jsonData,
    jar: cookieJar,
    cert: fs.readFileSync(certFilePath),
    key: fs.readFileSync(keyFilePath),
  };
  request.post(options, function (error, response, body) {
    assert(!error, error);
    assert(response && response.statusCode == 200, stringify(response));
    handleCodeMsg(body);
    callback(body.response);
  });
};

/*
 * Logins with credentials and returns session and account info.
 */
const login = (email, password, callback) => {
  const endpoint = LOGIN_ENDPOINT
  const cookieJar = request.jar();
  const jsonData = {
      username: email,
      pass: password,
      deviceUid: DEFAULT_DEVICE_UID,
      os: DEFAULT_OS,
  };
  sessionPost(cookieJar, endpoint, jsonData, (accountInfo) => {
    const data = {
      cookieJar,
      accountInfo,
    };
    callback(data);
  });
};

/*
 * Returns cards list and details using the cookie provided.
 */
const getCards = (cookieJar, dni, callback) => {
  const endpoint = GET_CARDS_ENDPOINT;
  const jsonData = { dni };
  sessionPost(cookieJar, endpoint, jsonData, (response) => {
    const cardList = response.listCard;
    callback(cardList);
  });
};

/*
 * Returns card details.
 */
const getDetailCard = (cookieJar, cardNumber, callback) => {
  const endpoint = GET_DETAIL_CARD_ENDPOINT;
  const jsonData = { cardNumber };
  sessionPost(cookieJar, endpoint, jsonData, (response) => {
    const { cardDetail } = response;
    callback(cardDetail);
  });
};

/*
 * Returns card pin.
 */
const getClearPin = (cookieJar, cardNumber, callback) => {
  const endpoint = GET_CLEAR_PIN_ENDPOINT;
  const jsonData = { cardNumber };
  sessionPost(cookieJar, endpoint, jsonData, (response) => {
    const { pin } = response.clearPin;
    callback(pin);
  });
};

/*
 * Given environment variable `EMAIL` and `PASSWORD` retries card details
 * and triggers `mainCallback`.
 */
const main = (mainCallback) => {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const getDetailCardCallback = (cardDetail) => {
    const { cardNumber } = cardDetail;
    console.log(`details ${cardNumber}:`); // eslint-disable-line no-console
    stringifyLog(cardDetail);
    typeof mainCallback == 'function' && mainCallback();
  };
  const getCardsCallback = (cookieJar) => (cardList) => {
    const cards = cardList;
    console.log('cards:'); // eslint-disable-line no-console
    stringifyLog(cardList);
    const card = cards[0];
    const { cardNumber } = card;
    getDetailCard(cookieJar, cardNumber, getDetailCardCallback);
  };
  const loginCallback = (response) => {
    const { cookieJar, accountInfo } = response;
    console.log('account info:'); // eslint-disable-line no-console
    stringifyLog(accountInfo);
    const { dni } = accountInfo;
    getCards(cookieJar, dni, getCardsCallback(cookieJar));
  };
  login(email, password, loginCallback);
};

const mainIsModule = (module, main) => main === module;
mainIsModule(require.main, module) ? main() : null;

module.exports = { stringifyLog, sessionPost, login, getCards, getDetailCard, getClearPin, main };
