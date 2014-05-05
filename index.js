'use strict';

var http = require('http'),
    https = require('https'),
    qs = require('querystring'),
    url = require('url'),
    assert = require('assert');

var debug = require('debug')('smartimage'),
    Promise = require('promise');

var STATUS_CODES = http.STATUS_CODES,
    PROTOCOLS = { http: http, https: https },
    PORTS = { http: 80, https: 443 };

/**
 * request
 *
 * Make a simple request to the Smartimage REST API.
 *
 * @param method    String      An HTTP method corresponding to the request
 *                              (can be GET, POST, PUT, PATCH, HEAD, or DELETE).
 * @param path      String      The path. See developer.github.com/api/v3/
 * @param query     Object      Any query data. Will be sent as query string
 *                              for GET/DELETE/HEAD, or body for others.
 * @param options   Object      Any other request options. See node's HTTP
 *                              module.
 * @param callback  Function    An optional callback. If not provided, a
 *                              promise is returned instead.
 *
 * @return Promise
 */
var request = function(method, path, query, options, callback){

   return new Promise(function(resolve, reject) {
        options = JSON.parse(JSON.stringify(options || {}));

        var protocol = options.protocol || 'https',
            host = options.host || 'my.smartimage.com';

        assert(['https', 'http'].indexOf(protocol) !== -1, 'Only http and ' +
               'https are supported.');

        method = method.toUpperCase();
        assert(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']
               .indexOf(method) !== -1, 'Only protocols supported are ' +
               'GET, POST, PUT, DELETE, HEAD, and PATCH');

        assert(query === null || typeof query === 'object', 'Query must be an ' +
               'object or null');

        // interpolate query with key/val pairs
        query = JSON.parse(JSON.stringify(query));
        path = path.replace(/\:([^\/\.]+)/g, function(_,p ){
            //path = path.replace(/\:\w+(?=\/?)/g, function(_, p){
            if (query[p]){
                var ret = query[p];
                delete query[p];
                return ret;
            }
        });

        var headers = {
            'user-agent': 'node-smartimage',
            'content-length': 0,
            'accept': 'application/json'
        };

        var hasBody = query !== null &&
            ('GET|DELETE|HEAD'.indexOf(method) === -1) ? true : false;

        var body;
        if (hasBody){
            debug('Detected request body');
            body = JSON.stringify(query) + '\n';
            headers['content-length'] = Buffer.byteLength(body, 'utf-8');
            headers['content-type'] = 'application/json; charset=utf-8';
        } else if (query !== null){
            debug('Detected URL query data');
            headers['content-type'] = 'text/plain; charset=utf-8';
            body = qs.stringify(query);
            if (body.length){
                path+='?'+body;
            }
        }

        if (options.auth) {
            debug('Detected auth');
            switch (options.auth.type) {
                case 'oauth':
                    debug('Detected oauth');
                    path += (path.indexOf('?') === -1 ? '?' : '&') + 'access_token=' + encodeURIComponent(options.auth.token);
                    break;
                case 'basic':
                    debug('Detected basic auth');
                    headers.authorization = 'Basic ' + new Buffer(
                        options.auth.username +
                        ':' +
                        options.auth.password, 'ascii').toString('base64');
                    break;
                case 'bearer':
                    debug('Detected bearer token');
                    headers.Authorization = 'Bearer ' + options.auth.bearer;
                    break;
                default:
                    /* jshint -W027 */
                    throw new Error('Auth type of `' +
                                    options.auth.type + '` is not recognised.');
                    break;
            }
        }

        if (options.headers) {
            Object.keys(options.headers).forEach(function (key) {
                headers[key] = options.headers[key];
            });
        }

        debug('Host: ' + host);
        debug('Port: ' + PORTS[protocol]);
        debug('Method: ' + method);
        debug('Path: /api' + path);

        var req = PROTOCOLS[protocol].request({
            host: host,
            //port: PORTS[protocol],
            method: method,
            path: '/api'+path,
            headers: headers,
            withCredentials: false
        }, function(res){
            debug('STATUS: ' + res.statusCode);
            if ('301|302|307'.indexOf(res.statusCode) !== -1) {
                debug("Recevied redirect");
                var location = url.parse(res.headers.location);
                options.protocol = location.protocol.substring(0, location.protocol.length - 1);
                options.host = location.host;
                return resolve(request(method, location.pathname, query, options));
            }
            if (res.statusCode >= 400) {
                debug("Recevied error");
                var buf = [],
                    buffer;
                res.on('data', function(d) {
                    buf.push(d);
                });
                res.on('end', function(){
                    buffer = new Buffer.concat(buf);

                    try {
                        body = buffer.toString('utf-8');
                        var err = new Error(method + ': ' + path + ' returned ' + body.message);
                        err.name = STATUS_CODES[res.statusCode].replace(/ /g, '');
                        err.statusCode = (err.code = res.statusCode);
                        err.res = res;
                        res.body = body;
                        reject(err);
                    } catch (exception) {
                        var err = new Error(method + ': ' + path + ' returned ' + body.toString());
                        err.name = STATUS_CODES[res.statusCode].replace(/ /g, '');
                        err.statusCode = (err.code = res.statusCode);
                        err.res = res;
                        res.body = body;
                        reject(err);
                    }

                });
            }
            resolve(res);
        });

        if (options.timeout) {
            req.setTimeoput(options.timeout);
        }

        req.on('error', function(e){
            debug('Error', e);
            reject(e);
        });

        if (hasBody){
            debug('Writing body');
            req.write(body);
        }
        req.end();

   }).nodeify(callback);

};

/**
 * buffer
 *
 * Same parameters as `request`. The response body will be a Buffer
 * containing the entire response.
 *
 * @return Promise  A Promise where the request body is a buffer
 */
var buffer = function (method, path, query, options, callback){

    return request(method, path, query, options).then(function (res) {
            return new Promise(function(resolve, reject){
                var buf = [],
                    buffer;
                res.on('data', function(d) {
                    buf.push(d);
                });
                res.on('end', function(){
                    buffer = new Buffer.concat(buf);
                    res.body = buffer;
                    resolve(res);
                });
                res.on('error', function(e){
                    reject(e);
                });
            });
        }).nodeify(callback);
};

/**
 * json
 *
 * Same parameters as `request`. The response body will be a JSON object
 * containing the entire parsed response.
 *
 * @return Promise  A Promise where the request body is JSON.
 */
var json = function(method, path, query, options, callback) {

    return buffer(method, path, query, options).then(function(res){
            res.body = JSON.parse(res.body.toString('utf-8'));
            return res;
        }).nodeify(callback);
};

exports = ( module.exports = request );
exports.json = json;
exports.buffer = buffer;
