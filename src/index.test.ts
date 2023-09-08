import fetch from "node-fetch";
import * as index from "./index";
import {
  LoginResponse,
  GetCardsResponse,
  GetDetailCardResponse,
  GetClearPinResponse,
} from "./types";
import { ApiError } from "./errors";

jest.mock("node-fetch", () => jest.fn());
const fetchMock = fetch as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("getFullEndpointUrl", () => {
  const testHelper = (endpoint: string, lang: string, expected: string) => {
    expect(index.getFullEndpointUrl(endpoint, lang)).toBe(expected);
  };

  it("base case", () => {
    const endpoint = "foo";
    const lang = "es";
    const expected = "https://sodexows.mo2o.com/es/foo";
    testHelper(endpoint, lang, expected);
  });

  it("removes leading slashes", () => {
    const endpoint = "//foo/bar/";
    const lang = "en";
    const expected = "https://sodexows.mo2o.com/en/foo/bar/";
    testHelper(endpoint, lang, expected);
  });
});

describe("handleCodeMsg", () => {
  it("passes silently if no error", () => {
    const handleCodeMsg = index.handleCodeMsg;
    const jsonResponse = {
      code: 100,
      msg: "OK",
    };
    const expected = undefined;
    expect(handleCodeMsg(jsonResponse)).toBe(expected);
  });

  it.each([
    [null, "OK"],
    [101, "OK"],
    [100, null],
    [100, "Error"],
    [null, null],
  ])("raises on unmatching code (%s) or msg (%s)", (code, msg) => {
    const handleCodeMsg = index.handleCodeMsg;
    const jsonResponse = { code, msg };
    const expected = ApiError;
    expect(() => {
      handleCodeMsg(jsonResponse);
    }).toThrow(expected);
  });
});

const fetchResponse = (
  responseJson: Record<string, any> = {},
  cookie = ""
) => ({
  ok: true,
  status: 200,
  headers: {
    raw: () => ({ "set-cookie": [cookie] }),
  },
  json: () => responseJson,
});

const mockFetch = (responseJson: Record<string, any> = {}, cookie = "") =>
  fetchMock.mockImplementation(() =>
    Promise.resolve(fetchResponse(responseJson, cookie))
  );

describe("sessionPost", () => {
  it("base", async () => {
    const endpoint = "/foo/bar";
    const jsonData = {};
    const expectedResponse = { key: "value" };
    const responseBody = {
      code: 100,
      msg: "OK",
      response: expectedResponse,
    };
    mockFetch(responseBody);
    const sessionPost = index.sessionPost;
    const cookie = "";
    const jsonResponse = await sessionPost(cookie, endpoint, jsonData);
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(fetchMock.mock.calls[0][0].endsWith(endpoint)).toBe(true);
    expect(fetchMock.mock.calls[0][1].body).toEqual(JSON.stringify(jsonData));
    expect(jsonResponse).toEqual(expectedResponse);
  });
});

const loginResponse: LoginResponse = {
  code: 100,
  msg: "OK",
  response: {
    beneficiaryCode: 12345,
    companyId: 12345,
    name: "Name",
    surname1: "Surname1",
    surname2: "Surname2",
    dni: "123456789",
    email: "foo@bar.com",
    password: "",
    dateBorn: "1987-01-23",
    gender: 0,
    mobile: "0012345678901",
    typeAddressJob: 0,
    nameAddressJob: "",
    complementaryDataJob: "",
    postalCodeJob: "12345",
    stateJob: 0,
    cityJob: 0,
    activated: 1,
    dateUp: "2017-12-34",
    internalCode: 2,
    newsletter: 0,
    cardCode4: "1234",
    securityDate: "31121987",
    matricula: "",
    acepto_terminos: 1,
    changePassword: 0,
    userData: {
      userId: 12345,
      nameAddress: "",
      typeAddress: 0,
      complementaryData: "",
      postalCode: "",
      state: 0,
      city: 0,
      typeWorkDay: 0,
      departmentId: 0,
      functionId: 0,
      netIncomeId: 0,
      hasChildren: 0,
    },
    interestCollection: [
      {
        idInteres: 0,
      },
    ],
  },
};

describe("login", () => {
  it("base", async () => {
    const email = "foo@bar.com";
    const password = "password";
    const expectedCookie = "PHPSESSID=0123456789abcdef0123456789";
    const extendedCookie = `${expectedCookie}; expires=Sat, 28-Jan-2023 13:37:00 GMT; Max-Age=7776000; path=/`;
    mockFetch(loginResponse, extendedCookie);
    const login = index.login;
    const response = await login(email, password);
    const { cookie, accountInfo } = response;
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(cookie).toEqual(expectedCookie);
    expect(accountInfo).toEqual(loginResponse.response);
  });
});

describe("loginFromSession", () => {
  it("base", async () => {
    const cookie = "PHPSESSID=0123456789abcdef0123456789";
    mockFetch(loginResponse);
    const loginFromSession = index.loginFromSession;
    const accountInfo = await loginFromSession(cookie);
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(accountInfo).toEqual(loginResponse.response);
  });
});

const getCardsResponse: GetCardsResponse = {
  code: 100,
  msg: "OK",
  response: {
    listCard: [
      {
        service: "Restaurante Pass",
        idCard: 219999,
        cardNumber: "1234567897901234",
        cardStatus: "ACTIVA",
        idCardStatus: "30",
        pan: "123456******1234",
        caducityDateCard: "",
        idProduct: 33,
        programFis: "",
        hasChip: 1,
        idCompany: 10183,
        arrFisToChange: [
          {
            key: "BLOCKED",
            value: "60",
          },
        ],
        idFisToChange: "60",
        fisToChangeState: "BLOCKED",
      },
    ],
  },
};

describe("getCards", () => {
  it("base", async () => {
    const cookie = "";
    const dni = "123456789";
    mockFetch(getCardsResponse);
    const getCards = index.getCards;
    const cardList = await getCards(cookie, dni);
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(cardList).toEqual(getCardsResponse.response.listCard);
  });
});

const getDetailCardResponse: GetDetailCardResponse = {
  code: 100,
  msg: "OK",
  response: {
    cardDetail: {
      idCard: 123456,
      cardNumber: "1234567897901234",
      idCardPayProvider: 0,
      idBeneficiary: 0,
      idCardStatus: "30",
      employeeName: "EMPLOYEE NAME",
      printerName: "EMPLOYEE NAME",
      legalNumber: "123456789",
      cardBalance: 13.37,
      caducityDateCard: "2022-12-31",
      cardStatus: "ACTIVA",
      idCompany: 12345,
      faceValue: 0,
      creationDate: "",
      idAddress: 0,
      addressReference: "",
      idCustomize: 0,
      perfil: "",
      description: "",
      itemType: 0,
      idProduct: 33,
      idContract: 20070,
      pan: "123456******1234",
      cardStatusDate: "2018-12-04",
      accountId: "",
      limitPassed: 0,
      idProfile: 0,
      maxValueOfConsum: 0,
      limiteConsumo: 0,
      programFis: "SDSC",
      hasChip: 1,
      balanceFis: {
        saldoDisponible: 13.37,
        apuntesPendientes: 0,
      },
      arrFisToChange: [
        {
          key: "BLOCKED",
          value: "60",
        },
      ],
      idFisToChange: "60",
      blockedAmount: "",
      totalBalance: "",
      maxLoad: 0,
      maxUsesDay: 0,
      infoBalanceRestriction: "",
      dayRestriction: "",
      useOnHoliday: "",
    },
  },
};

describe("getDetailCard", () => {
  it("base", async () => {
    const cookie = "";
    const cardNumber = "1234567897901234";
    mockFetch(getDetailCardResponse);
    const getDetailCard = index.getDetailCard;
    const cardList = await getDetailCard(cookie, cardNumber);
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(cardList).toEqual(getDetailCardResponse.response.cardDetail);
  });
});

const getClearPinResponse: GetClearPinResponse = {
  code: 100,
  msg: "OK",
  response: {
    clearPin: {
      pin: "1234",
    },
  },
};

describe("getClearPin", () => {
  it("base", async () => {
    const cookie = "";
    const cardNumber = "1234567897901234";
    mockFetch(getClearPinResponse);
    const getClearPin = index.getClearPin;
    const pin = await getClearPin(cookie, cardNumber);
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(pin).toEqual(getClearPinResponse.response.clearPin.pin);
  });
});

/*
 * Mock different response depending on the `perUrlResponseBody` and
 * `options.url` objects.
 */
const mockFetchPerUrl = (perUrlResponseBody: Record<string, any>) =>
  fetchMock.mockImplementation((url) => {
    return Promise.resolve(fetchResponse(perUrlResponseBody[url]));
  });

describe("main", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV }; // make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // restore old env
  });

  it("base", async () => {
    process.env = { ...OLD_ENV, EMAIL: "email@foo.bar", PASSWORD: "password" };
    // keeps the output clean, by mocking the `console.log()`
    const spyLog = jest.spyOn(console, "log").mockImplementation();
    const loginUrl = index.getFullEndpointUrl("v3/connect/login", "en");
    const getCardsUrl = index.getFullEndpointUrl("v3/card/getCards", "en");
    const getDetailCardUrl = index.getFullEndpointUrl(
      "v2/card/getDetailCard",
      "en"
    );
    const perUrlResponseBody = {
      [loginUrl]: loginResponse,
      [getCardsUrl]: getCardsResponse,
      [getDetailCardUrl]: getDetailCardResponse,
    };
    const post = mockFetchPerUrl(perUrlResponseBody);
    const main = index.main;
    await main();
    spyLog.mockRestore();
    expect(post.mock.calls.length).toBe(3);
    expect(fetchMock.mock.calls[0][0]).toBe(loginUrl);
    expect(fetchMock.mock.calls[1][0]).toBe(getCardsUrl);
    expect(fetchMock.mock.calls[2][0]).toBe(getDetailCardUrl);
  });
});
