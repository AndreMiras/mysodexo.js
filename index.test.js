const assert = require('assert');
const rewire = require('rewire');


test('getFullEndpointUrl', () => {
  const index = rewire('./index.js');
  const getFullEndpointUrl = index.__get__('getFullEndpointUrl');
  const endpoint = 'foo';
  const lang = 'es';
  const expected = 'https://sodexows.mo2o.com/es/foo';
  expect(getFullEndpointUrl(endpoint, lang)).toBe(expected);
});

test('getFullEndpointUrl, removes leading slashes', () => {
  const index = rewire('./index.js');
  const getFullEndpointUrl = index.__get__('getFullEndpointUrl');
  const endpoint = '//foo/bar/';
  const lang = 'en';
  const expected = 'https://sodexows.mo2o.com/en/foo/bar/';
  expect(getFullEndpointUrl(endpoint, lang)).toBe(expected);
});

test('handleCodeMsg, passes silently if no error', () => {
  const index = rewire('./index.js');
  const handleCodeMsg = index.__get__('handleCodeMsg');
  const jsonResponse = {
    code: 100,
    msg: "OK"
  };
  const expected = undefined;
  expect(handleCodeMsg(jsonResponse)).toBe(expected);
});

test('handleCodeMsg, raises unmatching code', () => {
  const index = rewire('./index.js');
  const handleCodeMsg = index.__get__('handleCodeMsg');
  const jsonResponse = {
    code: 101,
    msg: "OK"
  };
  const expected = assert.AssertionError;
  expect(() => {
    handleCodeMsg(jsonResponse)
  }).toThrow(expected);
});

test('handleCodeMsg, raises unmatching msg', () => {
  const index = rewire('./index.js');
  const handleCodeMsg = index.__get__('handleCodeMsg');
  const jsonResponse = {
    code: 100,
    msg: "Error"
  };
  const expected = assert.AssertionError;
  expect(() => {
    handleCodeMsg(jsonResponse)
  }).toThrow(expected);
});

describe('sessionPost', () => {
  it('sessionPost', (done) => {
    jest.resetModules();
    const endpoint = '/foo/bar';
    const jsonData = {};
    const expected = {};
    jest.doMock('request', () => {
      return {
        post: jest.fn((req, callback) => {
          const error = null;
          const response = {
            statusCode: 200,
          };
          const body = {
            code: 100,
            msg: 'OK',
            response: {}
          };
          callback(error, response, body)
        }),
      }
    });
    // const index = rewire('./index.js');
    // const sessionPost = index.__get__('sessionPost');
    const index = require('./index.js');
    const sessionPost = index.sessionPost;
    const cookieJar = {};
    const callback = (jsonResponse) => {
      expect(jsonResponse).toEqual(expected);
      done();
    };
    expect(sessionPost(cookieJar, endpoint, jsonData, callback)).toBe(undefined);
  });
});

describe('login', () => {
  it('login', (done) => {
    jest.resetModules();
    jest.unmock('request');
    const email = 'foo@bar.com';
    const password = 'password';
    const jsonData = {};
    const expectedCookieJar = {};
    const expectedAccountInfo = {foo: 'bar'};
    jest.doMock('request', () => {
      return {
        post: jest.fn((req, callback) => {
          const error = null;
          const response = {
            statusCode: 200,
          };
          const body = {
            code: 100,
            msg: 'OK',
            response: expectedAccountInfo
          };
          callback(error, response, body)
        }),
        jar: () => { return {} }
      }
    });
    const index = require('./index.js');
    const login = index.login;
    const callback = (response) => {
      const { cookieJar, accountInfo } = response;
      expect(cookieJar).toEqual(expectedCookieJar);
      expect(accountInfo).toEqual(expectedAccountInfo);
      done();
    };
    expect(login(email, password, callback)).toBe(undefined);
  });
});
