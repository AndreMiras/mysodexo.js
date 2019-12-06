const assert = require('assert');
const rewire = require('rewire');


beforeEach(() => {
  jest.resetModules();
});

/*
 * Exposes getFullEndpointUrl() for unit tests.
 */
const getFullEndpointUrl = (endpoint, lang) => {
  const index = rewire('./src/index.js');
  return index.__get__('getFullEndpointUrl')(endpoint, lang);
};

describe('getFullEndpointUrl', () => {

  const testHelper = (endpoint, lang, expected) => {
    expect(getFullEndpointUrl(endpoint, lang)).toBe(expected);
  };

  it('base case', () => {
    const endpoint = 'foo';
    const lang = 'es';
    const expected = 'https://sodexows.mo2o.com/es/foo';
    testHelper(endpoint, lang, expected);
  });

  it('removes leading slashes', () => {
    const endpoint = '//foo/bar/';
    const lang = 'en';
    const expected = 'https://sodexows.mo2o.com/en/foo/bar/';
    testHelper(endpoint, lang, expected);
  });
});

describe('handleCodeMsg', () => {
  it('passes silently if no error', () => {
    const index = rewire('./src/index.js');
    const handleCodeMsg = index.__get__('handleCodeMsg');
    const jsonResponse = {
      code: 100,
      msg: 'OK'
    };
    const expected = undefined;
    expect(handleCodeMsg(jsonResponse)).toBe(expected);
  });

  it.each([
    [null, 'OK'],
    [101, 'OK'],
    [100, null],
    [100, 'Error'],
    [null, null]
  ])('raises on unmatching code (%s) or msg (%s)', (code, msg) => {
    const index = rewire('./src/index.js');
    const handleCodeMsg = index.__get__('handleCodeMsg');
    const jsonResponse = { code, msg };
    const expected = assert.AssertionError;
    expect(() => {
      handleCodeMsg(jsonResponse)
    }).toThrow(expected);
  });
});

const mockRequestPost = (responseBody) => jest.fn(
  (options, callback) => {
    const error = null;
    const response = {
      statusCode: 200,
    };
    callback(error, response, responseBody)
  }
);

const mockRequest = (post, jar) => {
  jar = typeof jar !== 'undefined' ? jar : {};
  jest.doMock('request', () => (
    {
      post,
      jar,
    }
  ));
};

describe('sessionPost', () => {

  it('base', (done) => {
    const endpoint = '/foo/bar';
    const jsonData = {};
    const expected = {};
    const responseBody = {
      code: 100,
      msg: 'OK',
      response: {},
    };
    const post = mockRequestPost(responseBody);
    mockRequest(post);
    // const index = rewire('./index.js');
    // const sessionPost = index.__get__('sessionPost');
    const index = require('./index.js');
    const sessionPost = index.sessionPost;
    const cookieJar = {};
    const callback = (jsonResponse) => {
      expect(post.mock.calls.length).toBe(1);
      expect(post.mock.calls[0][0].url.endsWith(endpoint)).toBe(true);
      expect(post.mock.calls[0][0].json).toBe(jsonData);
      expect(jsonResponse).toEqual(expected);
      done();
    };
    expect(sessionPost(cookieJar, endpoint, jsonData, callback)).toBe(undefined);
  });
});

const loginResponse = {
  code: 100,
  msg: 'OK',
  response: {
    beneficiaryCode: 12345,
    companyId: 12345,
    name: 'Name',
    surname1: 'Surname1',
    surname2: 'Surname2',
    dni: '123456789',
    email: 'foo@bar.com',
    password: '',
    dateBorn: '1987-01-23',
    gender: 0,
    mobile: '0012345678901',
    typeAddressJob: 0,
    nameAddressJob: '',
    complementaryDataJob: '',
    postalCodeJob: '12345',
    stateJob: 0,
    cityJob: 0,
    activated: 1,
    dateUp: '2017-12-34',
    internalCode: 2,
    newsletter: 0,
    cardCode4: '1234',
    securityDate: '31121987',
    matricula: '',
    acepto_terminos: 1,
    changePassword: 0,
    userData: {
      userId: 12345,
      nameAddress: '',
      typeAddress: 0,
      complementaryData: '',
      postalCode: '',
      state: 0,
      city: 0,
      typeWorkDay: 0,
      departmentId: 0,
      functionId: 0,
      netIncomeId: 0,
      hasChildren: 0
    },
    interestCollection: [
      {
        idInteres: 0
      }
    ]
  }
};

describe('login', () => {
  it('base', (done) => {
    const email = 'foo@bar.com';
    const password = 'password';
    const expectedCookieJar = {};
    const post = mockRequestPost(loginResponse);
    const jar = () => ( expectedCookieJar );
    mockRequest(post, jar);
    const index = require('./index.js');
    const login = index.login;
    const callback = (response) => {
      const { cookieJar, accountInfo } = response;
      expect(post.mock.calls.length).toBe(1);
      expect(cookieJar).toEqual(expectedCookieJar);
      expect(accountInfo).toEqual(loginResponse.response);
      done();
    };
    expect(login(email, password, callback)).toBe(undefined);
  });
});

const getCardsResponse = {
  code: 100,
  msg: 'OK',
  response: {
    listCard: [{
      service: 'Restaurante Pass',
      idCard: 219999,
      cardNumber: '1234567897901234',
      cardStatus: 'ACTIVA',
      idCardStatus: '30',
      pan: '123456******1234',
      caducityDateCard: '',
      idProduct: 33,
      programFis: '',
      hasChip: 1,
      idCompany: 10183,
      arrFisToChange: [{
        key: 'BLOCKED',
        value: '60'
      }],
      idFisToChange: '60',
      fisToChangeState: 'BLOCKED'
    }],
  },
};

describe('getCards', () => {
  it('base', (done) => {
    const cookieJar = {};
    const dni = '123456789';
    const post = mockRequestPost(getCardsResponse);
    mockRequest(post);
    const index = require('./index.js');
    const getCards = index.getCards;
    const callback = (cardList) => {
      expect(cardList).toEqual(getCardsResponse.response.listCard);
      done();
    };
    expect(getCards(cookieJar, dni, callback)).toBe(undefined);
  });
});

const getDetailCardResponse = {
  code: 100,
  msg: 'OK',
  response: {
    cardDetail: {
      idCard: 123456,
      cardNumber: '1234567897901234',
      idCardPayProvider: 0,
      idBeneficiary: 0,
      idCardStatus: '30',
      employeeName: 'EMPLOYEE NAME',
      printerName: 'EMPLOYEE NAME',
      legalNumber: '123456789',
      cardBalance: 13.37,
      caducityDateCard: '2022-12-31',
      cardStatus: 'ACTIVA',
      idCompany: 12345,
      faceValue: 0,
      creationDate: '',
      idAddress: 0,
      addressReference: '',
      idCustomize: 0,
      perfil: '',
      description: '',
      itemType: 0,
      idProduct: 33,
      idContract: 20070,
      pan: '123456******1234',
      cardStatusDate: '2018-12-04',
      accountId: '',
      limitPassed: 0,
      idProfile: 0,
      maxValueOfConsum: 0,
      limiteConsumo: 0,
      programFis: 'SDSC',
      hasChip: 1,
      balanceFis: {
        saldoDisponible: 13.37,
        apuntesPendientes: 0
      },
      arrFisToChange: [
        {
          key: 'BLOCKED',
          value: '60'
        }
      ],
      idFisToChange: '60',
      blockedAmount: '',
      totalBalance: '',
      maxLoad: 0,
      maxUsesDay: 0,
      infoBalanceRestriction: '',
      dayRestriction: '',
      useOnHoliday: '',
    },
  },
};

describe('getDetailCard', () => {
  it('base', (done) => {
    const cookieJar = {};
    const cardNumber = '1234567897901234';
    const post = mockRequestPost(getDetailCardResponse);
    mockRequest(post);
    const index = require('./index.js');
    const getDetailCard = index.getDetailCard;
    const callback = (cardList) => {
      expect(post.mock.calls.length).toBe(1);
      expect(cardList).toEqual(getDetailCardResponse.response.cardDetail);
      done();
    };
    expect(getDetailCard(cookieJar, cardNumber, callback)).toBe(undefined);
  });
});

describe('getClearPin', () => {
  it('base', (done) => {
    const cookieJar = {};
    const cardNumber = '1234567897901234';
    const expectedPin = '1234';
    const responseBody = {
      code: 100,
      msg: 'OK',
      response: {
        clearPin: {
          pin: expectedPin,
        },
      },
    };
    const post = mockRequestPost(responseBody);
    mockRequest(post);
    const index = require('./index.js');
    const getClearPin = index.getClearPin;
    const callback = (pin) => {
      expect(post.mock.calls.length).toBe(1);
      expect(pin).toEqual(expectedPin);
      done();
    };
    expect(getClearPin(cookieJar, cardNumber, callback)).toBe(undefined);
  });
});

/*
 * Mocks different response depending on the `perUrlResponseBody` and
 * `options.url` objects.
 */
const mockRequestPostPerUrl = (perUrlResponseBody) => jest.fn(
  (options, callback) => {
    const responseBody = perUrlResponseBody[options.url];
    mockRequestPost(responseBody)(options, callback);
  }
);

describe('main', () => {
  it('base', (done) => {
    // keeps the output clean, by mocking the `console.log()`
    const spyLog = jest.spyOn(console, 'log').mockImplementation();
    const loginUrl = getFullEndpointUrl('v3/connect/login', 'en');
    const getCardsUrl = getFullEndpointUrl('v3/card/getCards', 'en');
    const getDetailCardUrl = getFullEndpointUrl('v2/card/getDetailCard', 'en');
    const perUrlResponseBody = {
      [loginUrl]: loginResponse,
      [getCardsUrl]: getCardsResponse,
      [getDetailCardUrl]: getDetailCardResponse,
    };
    const post = mockRequestPostPerUrl(perUrlResponseBody);
    const jar = () => ( {} );
    mockRequest(post, jar);
    const index = require('./index.js');
    const main = index.main;
    const callback = () => {
      spyLog.mockRestore();
      expect(post.mock.calls.length).toBe(3);
      expect(post.mock.calls[0][0].url).toBe(loginUrl);
      expect(post.mock.calls[1][0].url).toBe(getCardsUrl);
      expect(post.mock.calls[2][0].url).toBe(getDetailCardUrl);
      done();
    };
    expect(main(callback)).toBe(undefined);
  });
});
