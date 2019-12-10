beforeEach(() => {
  jest.resetModules();
});

const requireCli = () => require('./cli.js');

const mockReadCredentials = (email, password) => {
  const read = require('read');
  read.mockImplementationOnce((options, callback) => callback({}, email));
  read.mockImplementationOnce((options, callback) => callback({}, password));
};

const mockApiLogin = (apiLoginResponse) => (
  jest.fn((email, password, loginCallback) => (
    loginCallback(apiLoginResponse))
  )
);

const mockProcessLogin = (cookieJar, dni) => jest.fn(
  (callback) => callback(cookieJar, dni)
);

const doMockApiLogin = (login) => jest.doMock('./index.js', () => ({ login }));

describe('promptLogin', () => {
  it('base', (done) => {
    jest.mock('read');
    const expectedEmail = 'foo@bar.com';
    const expectedPassword = 'password';
    mockReadCredentials(expectedEmail, expectedPassword);
    const callback = (email, password) => {
      expect(email).toEqual(expectedEmail);
      expect(password).toEqual(expectedPassword);
      done();
    };
    const { promptLogin } = requireCli();
    promptLogin(callback);
  });
});

describe('baseDataDir', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    setPlatformHelper(originalPlatform);
  });

  /*
   * Helper function to override `process.platform`.
   */
  const setPlatformHelper = (platform) => {
    Object.defineProperty(process, 'platform', {
      value: platform
    });
  };

  it.each([
    ['linux', '/.local/share'],
    ['darwin', '/Library/Preferences'],
  ])('platform (%s) expected (%s)', (platform, expected) => {
    const { baseDataDir } = requireCli();
    setPlatformHelper(platform);
    expect(baseDataDir().endsWith(expected)).toBe(true);
  });
});

describe('getSessionCachePath', () => {
  it('base', () => {
    const { getSessionCachePath } = requireCli();
    const expected = '/mysodexo/session.cache';
    expect(getSessionCachePath().endsWith(expected)).toBe(true);
  });
});

describe('getCachedSessionInfo', () => {
  afterEach(() => {
    jest.unmock('fs');
  });

  it('base', () => {
    const expected = { foo: 'bar' };
    const readFileSync = () => (JSON.stringify(expected));
    jest.doMock('fs', () => ({
      readFileSync,
    }));
    const { getCachedSessionInfo } = requireCli();
    expect(getCachedSessionInfo()).toEqual(expected);
  });
});

describe('cacheSessionInfo', () => {
  afterEach(() => {
    jest.unmock('fs');
  });

  it('base', () => {
    const expected = undefined;
    const mkdirSync = jest.fn();
    const writeFileSync = jest.fn();
    jest.doMock('fs', () => ({
      mkdirSync,
      writeFileSync,
    }));
    const { cacheSessionInfo } = requireCli();
    const getCookieString = jest.fn();
    const cookieJar = {
      getCookieString,
    };
    const dni = '123456789';
    expect(cacheSessionInfo(cookieJar, dni)).toEqual(expected);
    expect(mkdirSync.mock.calls.length).toBe(1);
    expect(mkdirSync.mock.calls[0][0].endsWith('/mysodexo')).toBe(true);
    expect(mkdirSync.mock.calls[0][1]).toEqual({ recursive: true });
    expect(writeFileSync.mock.calls.length).toBe(1);
    expect(writeFileSync.mock.calls[0][0].endsWith('/mysodexo/session.cache')).toBe(true);
    expect(writeFileSync.mock.calls[0][1]).toEqual(JSON.stringify({ dni }));
  });
});

describe('login', () => {
  afterEach(() => {
    jest.unmock('./index.js');
  });

  it('base', (done) => {
    const expected = undefined;
    const expectedEmail = 'foo@bar.com';
    const expectedPassword = 'password';
    const expectedCookieJar = {};
    const expectedDni = '123456789';
    const accountInfo = { dni: expectedDni };
    const apiLoginResponse = {
      cookieJar: expectedCookieJar,
      accountInfo,
    };
    const apiLogin = mockApiLogin(apiLoginResponse);
    doMockApiLogin(apiLogin);
    const promptLogin = (promptLoginCallback) => promptLoginCallback(expectedEmail, expectedPassword);
    const cli = requireCli();
    cli.promptLogin = promptLogin;
    const callback = (cookieJar, dni) => {
      expect(apiLogin.mock.calls.length).toBe(1);
      expect(apiLogin.mock.calls[0][0]).toEqual(expectedEmail);
      expect(apiLogin.mock.calls[0][1]).toEqual(expectedPassword);
      expect(cookieJar).toEqual(expectedCookieJar);
      expect(dni).toEqual(expectedDni);
      done();
    };
    expect(cli.login(callback)).toEqual(expected);
  });
});

describe('processLogin', () => {
  it('base', (done) => {
    const expected = undefined;
    const expectedCookieJar = {};
    const expectedDni = '123456789';
    const login = jest.fn((loginCallback) => loginCallback(expectedCookieJar, expectedDni));
    const cacheSessionInfo = jest.fn();
    const cli = requireCli();
    cli.login = login;
    cli.cacheSessionInfo = cacheSessionInfo;
    const callback = (cookieJar, dni) => {
      expect(login.mock.calls.length).toBe(1);
      expect(login.mock.calls[0][0]).toBeInstanceOf(Function)
      expect(cacheSessionInfo.mock.calls.length).toBe(1);
      expect(cacheSessionInfo.mock.calls[0]).toEqual([expectedCookieJar, expectedDni])
      expect(cookieJar).toEqual(expectedCookieJar);
      expect(dni).toEqual(expectedDni);
      done();
    };
    expect(cli.processLogin(callback)).toEqual(expected);
  });
});

describe('getSessionOrLogin', () => {
  afterEach(() => {
    jest.unmock('fs');
  });

  it('session file exists', (done) => {
    const expected = undefined;
    const cookies = 'cookieKey=cookieValue';
    const expectedDni = '123456789';
    const sessionInfo = { cookies, dni: expectedDni };
    const readFileSync = () => (JSON.stringify(sessionInfo));
    jest.doMock('fs', () => ({
      readFileSync,
    }));
    const { getSessionOrLogin } = requireCli();
    const callback = (cookieJar, dni) => {
      const { BASE_URL } = require('./constants.js');
      expect(cookieJar.getCookieString(BASE_URL)).toEqual(cookies);
      expect(dni).toEqual(expectedDni);
      done();
    };
    expect(getSessionOrLogin(callback)).toEqual(expected);
  });

  /*
   * The `getSessionOrLogin()` function should fallback to login
   * if session cache file isn't available.
   */
  it('session file does not exists', (done) => {
    const expected = undefined;
    const error = new Error();
    error.code = 'ENOENT';
    const readFileSync = () => { throw error };
    jest.doMock('fs', () => ({
      readFileSync,
    }));
    const expectedCookieJar = {};
    const expectedDni = '123456789';
    const processLogin = mockProcessLogin(expectedCookieJar, expectedDni);
    const cli = requireCli();
    cli.processLogin = processLogin;
    const callback = (cookieJar, dni) => {
      expect(processLogin.mock.calls.length).toBe(1);
      expect(processLogin.mock.calls[0][0]).toBeInstanceOf(Function)
      expect(cookieJar).toEqual(expectedCookieJar);
      expect(dni).toEqual(expectedDni);
      done();
    };
    expect(cli.getSessionOrLogin(callback)).toEqual(expected);
  });

  /*
   * The `getSessionOrLogin()` function should throw if an error != ENOENT is raised.
   */
  it('session file throw != ENOENT', (done) => {
    const error = new Error();
    const readFileSync = () => { throw error };
    jest.doMock('fs', () => ({
      readFileSync,
    }));
    const callback = () => {
      done.fail(new Error('Did not throw'));
    };
    const { getSessionOrLogin } = requireCli();
    try {
      getSessionOrLogin(callback);
      done.fail(new Error('Did not throw'));
    } catch (exception) {
      expect(exception).toEqual(error);
    }
    done();
  });
});

describe('processBalance', () => {
  afterEach(() => {
    jest.unmock('./index.js');
  });

  it('base', (done) => {
    const expected = undefined;
    const expectedCookieJar = {};
    const expectedDni = '123456789';
    const getSessionOrLogin = jest.fn((callback) => callback(expectedCookieJar, expectedDni));
    const expectedCardNumber = '1234567897901234';
    const expectedCard = {
      cardNumber: expectedCardNumber,
    };
    const expectedCardList = [
      expectedCard,
    ];
    const getCards = jest.fn((cookieJar, dni, getCardsCallback) => (
      getCardsCallback(expectedCardList))
    );
    const expectedCardDetail = {
      cardBalance: 13.37,
      pan: '123456******1234',
    };
    const expectedCardsDetails = [expectedCardDetail];
    const getDetailCard = jest.fn((cookieJar, cardNumber, getDetailCardCallback) => (
      getDetailCardCallback(expectedCardDetail))
    );
    const spyLog = jest.spyOn(console, 'log').mockImplementation();
    jest.doMock('./index.js', () => ({
      getCards,
      getDetailCard,
    }));
    const cli = requireCli();
    cli.getSessionOrLogin = getSessionOrLogin;
    const callback = (cardsDetails) => {
      expect(spyLog.mock.calls.length).toBe(1);
      expect(spyLog.mock.calls[0]).toEqual([
        '123456******1234: 13.37',
      ]);
      spyLog.mockRestore();
      expect(getSessionOrLogin.mock.calls.length).toBe(1);
      expect(getSessionOrLogin.mock.calls[0][0]).toBeInstanceOf(Function)
      expect(cardsDetails).toEqual(expectedCardsDetails);
      done();
    };
    expect(cli.processBalance(callback)).toEqual(expected);
  });
});
