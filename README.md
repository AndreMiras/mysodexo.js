# Mysodexo JavaScript client

[![Tests](https://github.com/AndreMiras/mysodexo.js/workflows/Tests/badge.svg)](https://github.com/AndreMiras/mysodexo.js/actions/workflows/tests.yml)
[![Coverage Status](https://coveralls.io/repos/github/AndreMiras/mysodexo.js/badge.svg?branch=main)](https://coveralls.io/github/AndreMiras/mysodexo.js?branch=main)
[![Documentation](https://github.com/AndreMiras/mysodexo.js/workflows/Documentation/badge.svg)](https://github.com/AndreMiras/mysodexo.js/actions/workflows/documentation.yml)
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
import { login } from "mysodexo";
login("foo@bar.com", "password").then(({ accountInfo }) =>
  console.log(accountInfo)
);
```
