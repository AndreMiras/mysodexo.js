# Mysodexo JavaScript client

[![Build Status](https://travis-ci.com/AndreMiras/mysodexo.js.svg?branch=develop)](https://travis-ci.com/AndreMiras/mysodexo.js)
[![Coverage Status](https://coveralls.io/repos/github/AndreMiras/mysodexo.js/badge.svg?branch=develop)](https://coveralls.io/github/AndreMiras/mysodexo.js?branch=develop)
[![npm version](https://badge.fury.io/js/mysodexo.svg)](https://badge.fury.io/js/mysodexo)

A Javascript client for the Mysodexo [reverse engineered API](https://medium.com/@andre.miras/reverse-engineering-sodexos-api-d13710b7bf0d).


## Install & Usage
Install it with npm.
```sh
npm install mysodexo
```
Then use the command line client.
```sh
mysodexo --balance
```
Or the library.
```js
const { login } = require('mysodexo');
const loginCallback = (response) => {
  const { cookieJar, accountInfo } = response;
  console.log('account info:', accountInfo);
};
login('foo@bar.com', 'password', loginCallback);
```
