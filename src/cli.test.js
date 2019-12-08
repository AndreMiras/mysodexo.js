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

describe('promptLogin', () => {
  it('base', (done) => {
    jest.mock('read');
    const read = require('read');
    const expectedEmail = 'foo@bar.com';
    const expectedPassword = 'password';
    read.mockImplementationOnce((options, callback) => callback({}, expectedEmail));
    read.mockImplementationOnce((options, callback) => callback({}, expectedPassword));
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
