// const rewire = require('rewire');


beforeEach(() => {
  jest.resetModules();
});

// const rewireCli = () => rewire('./src/cli.js');

/*
 * Exposes promptLogin() for unit tests.
 */
const promptLogin = (callback) => (
  // using rewire to expose it makes it difficult to later use `jest.mock()`
  // rewireCli().__get__('promptLogin')(callback)
  require('./cli.js').promptLogin(callback)
);

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
    const { baseDataDir } = require('./cli.js');
    setPlatformHelper(platform);
    expect(baseDataDir().endsWith(expected)).toBe(true);
  });
});

describe('getSessionCachePath', () => {
  it('base', () => {
    const { getSessionCachePath } = require('./cli.js');
    const expected = '/mysodexo/session.cache';
    expect(getSessionCachePath().endsWith(expected)).toBe(true);
  });
});

describe('getCachedSessionInfo', () => {
  it('base', () => {
    const expected = { foo: 'bar' };
    const readFileSync = () => (JSON.stringify(expected));
    jest.doMock('fs', () => ({
      readFileSync
    }));
    const { getCachedSessionInfo } = require('./cli.js');
    expect(getCachedSessionInfo()).toEqual(expected);
  });
});

describe('cacheSessionInfo', () => {
  it('base', () => {
    const expected = undefined;
    const mkdirSync = jest.fn();
    const writeFileSync = jest.fn();
    jest.doMock('fs', () => ({
      mkdirSync,
      writeFileSync,
    }));
    const { cacheSessionInfo } = require('./cli.js');
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
  it('base', (done) => {
    const expected = undefined;
    const expectedEmail = 'foo@bar.com';
    const expectedPassword = 'password';
    mockReadCredentials(expectedEmail, expectedPassword);
    const expectedCookieJar = {};
    const expectedDni = '123456789';
    const accountInfo = { dni: expectedDni };
    const apiLoginResponse = {
      cookieJar: expectedCookieJar,
      accountInfo,
    };
    const apiLogin = mockApiLogin(apiLoginResponse);
    doMockApiLogin(apiLogin);
    const { login } = require('./cli.js');
    const callback = (cookieJar, dni) => {
      expect(apiLogin.mock.calls.length).toBe(1);
      expect(apiLogin.mock.calls[0][0]).toEqual(expectedEmail);
      expect(apiLogin.mock.calls[0][1]).toEqual(expectedPassword);
      expect(cookieJar).toEqual(expectedCookieJar);
      expect(dni).toEqual(expectedDni);
      done();
    };
    expect(login(callback)).toEqual(expected);
  });
});

describe('processLogin', () => {
  it('base', (done) => {
    const expected = undefined;
    const expectedEmail = 'foo@bar.com';
    const expectedPassword = 'password';
    mockReadCredentials(expectedEmail, expectedPassword);
    const getCookieString = jest.fn();
    const expectedCookieJar = {
      getCookieString,
    };
    const expectedDni = '123456789';
    const accountInfo = { dni: expectedDni };
    const apiLoginResponse = {
      cookieJar: expectedCookieJar,
      accountInfo,
    };
    const apiLogin = mockApiLogin(apiLoginResponse);
    doMockApiLogin(apiLogin);
    const mkdirSync = jest.fn();
    const writeFileSync = jest.fn();
    jest.doMock('fs', () => ({
      mkdirSync,
      writeFileSync,
    }));
    const { processLogin } = require('./cli.js');
    const callback = (cookieJar, dni) => {
      expect(apiLogin.mock.calls.length).toBe(1);
      expect(apiLogin.mock.calls[0][0]).toEqual(expectedEmail);
      expect(apiLogin.mock.calls[0][1]).toEqual(expectedPassword);
      expect(cookieJar).toEqual(expectedCookieJar);
      expect(dni).toEqual(expectedDni);
      done();
    };
    expect(processLogin(callback)).toEqual(expected);
  });
});

describe('getSessionOrLogin', () => {
  it('session file exists', (done) => {
    const expected = undefined;
    const cookies = 'cookieKey=cookieValue';
    const expectedDni = '123456789';
    const sessionInfo = { cookies, dni: expectedDni };
    const readFileSync = () => (JSON.stringify(sessionInfo));
    jest.doMock('fs', () => ({
      readFileSync
    }));
    const { getSessionOrLogin } = require('./cli.js');
    const callback = (cookieJar, dni) => {
      const { BASE_URL } = require('./constants.js');
      expect(cookieJar.getCookieString(BASE_URL)).toEqual(cookies);
      expect(dni).toEqual(expectedDni);
      done();
    };
    expect(getSessionOrLogin(callback)).toEqual(expected);
  });
});
