node-smartimage
===============

A JavaScript client for [Smartimage](http://www.smartimage.com). Works in node and in
the browser!

(Note: It technically works in the browser only if you turn off CORS or use a
proxy like [corsproxy](https://www.npmjs.org/package/corsproxy) to bypass
CORS restrictions for now.)

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

[![Build
Status](http://img.shields.io/travis/Widen/node-smartimage.svg?style=flat)](https://travis-ci.org/Widen/node-smartimage)

[Documentation](http://widen.github.io/node-smartimage/)


----

# Quickstart

Just set your options up like below including the username and password.
Currently only basic authentication is supported by Smartimage's API.

All API methods are documented at [Apiary](http://docs.smartimage.apiary.io/).
All API methods are supported except for file uploads (which are planned for a future release).

```
var smartimage = require('./index');

var options = {
    protocol: 'https',
    host: 'my.smartimage.com',
    auth: {
        type: 'basic',
        username: process.env.SI_USERNAME,
        password: process.env.SI_PASSWORD
    }
};

smartimage('GET', '/collections', query, options, function(err, res){
        console.log(res);
});
```

# Asynchronous Response Handling

## Promises

Responses can be handled using promises thanks to [then/promise](https://github.com/then/promise).

```
// Promise
var success = function(res) {
    console.log("Promise success!");
};

var failure = function(err){
    console.log("Promise fail!");
}

var query = null;
smartimage('GET', '/collections', query, options).then(success, failure);
```

## Callbacks

Responses can also be handled using nodejs style callbacks:

```
// Callback
var cb = function(err, res){
    console.log("Callback success!");
};

var query = null;
smartimage('GET', '/collections', query, options, cb);
```

# Types of Results

The library can also return the response body in different ways. You can use
any of the following with callbacks or promises as well.

## Receive a [Stream](http://nodejs.org/api/stream.html#stream_class_stream_readable) of Data

By default, the `response` object passed into a successful promise or callback
is an instance of an [`http.IncomingMessage`](http://nodejs.org/api/http.html#http_http_incomingmessage) and, as such, the response body
is a
[`stream.Readable`](http://nodejs.org/api/stream.html#stream_class_stream_readable).

```
smartimage('GET', '/collections', null, options, cb);
```


## Receive a [Buffer](http://nodejs.org/api/buffer.html) of Data

You can also receive a Buffer of response data using the `buffer()` method.

```
smartimage.buffer('GET', '/collections', null, options, cb);
```

## Receive JSON Data

JSON data can be returned using the `json()` method:

```
// JSON Callback
var cb = function(err, res){
    console.log(res.body)
};

var query = null;
smartimage.json('GET', '/collections', query, options, cb);
```

```
// JSON Promise
var success = function(res) {
    console.log(res.body);
};

var query = null;
smartimage.json('GET', '/collections', query, options).then(success);
```

