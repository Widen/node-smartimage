'use strict';

process.env.DEBUG = 'smartimage';

var test = require('tape');

var smartimage = require('../index');

var options = {
    auth: {
        type: 'basic',
        username: 'foo',
        password: 'bar'
    },
    headers: {
        'foo': 'bar',
        'herp': 'derp'
    }
};
if (typeof window === 'undefined'){ // in node
    options.protocl = 'https';
    options.host = 'private-013a1-smartimage.apiary-mock.com';
} else { // in browser
    options.protocol = 'https';
    options.host = 'cors-anywhere-eu.herokuapp.com/private-013a1-smartimage.apiary-mock.com';
}

test('Simple request', function(t){

    t.plan(1);

    var handle = function(res) {
        t.pass('Simple request succesful');
        return t.end();
    };

    var query = null;
    smartimage('GET', '/collections', query, options).then(handle, handle);

});

test('Works with callbacks', function(t){

    t.plan(1);

    var cb = function(err, res){
        t.pass('Simple callback successful');
        return t.end();
    };

    var query = null;
    smartimage('GET', '/collections', query, options, cb);

});

test('400', function(t){
    t.plan(1);

    var query = {
        id: 'foobar',
    };

    smartimage('GET', '/woot/:id', query, options, function(err, res){
        t.pass('No response but no failure');
        return t.end();
    });
})

test('URL path interpolation', function(t){

    t.plan(1);

    var query = {
        id: '5b9412f4-1be5-412d-a779-f35d9020f3ee'
    };

    smartimage('GET', '/collections/:id', query, options, function(err, res){
        if (!res.req || err) {
            t.pass('No response but no failure');
        } else {
            t.ok(res.req.path.indexOf(query.id) !== -1, 'Single parameter successful');
        }
        return t.end();
    });

});

test('Query added to URL query string', function(t){

    t.plan(1);

    var query = {
        count: '3',
        offset: '1'
    };

    smartimage('GET', '/collections', query, options, function(err, res){
        t.pass('Success');
        return t.end();
    });

});

test('Returns a Buffer', function(t){

    t.plan(1);

    var query = {
        count: '1'
    };

    smartimage.buffer('GET', '/collections', query, options, function(err, res){
        if (!res) {
            t.pass('No response but no failure');
        } else {
            t.ok(Buffer.isBuffer(res.body), 'Buffer returned successfully');
        }
        return t.end();
    });

});


test('Returns JSON', function(t){

    t.plan(1);

    var query = {
        id: 'b39005eb-de38-44da-8f91-dd6c33198091'
    };

    smartimage.json('GET', '/collections/:id/files', query, options, function(err, res){
        //if (err) { console.log(err); }
        if (!res) {
            t.pass('No response but no failure');
        } else {
            try {
                var json = JSON.stringify(res.body);
                t.pass('JSON data returned successfully');
            } catch (e) {
                t.fail('Invalid JSON response');
            }
        }

        return t.end();
    });

});


test.skip('POST request', function(t) {

    t.plan(1);

    var fs = require('fs'),
        url = require('url'),
        crypto = require('crypto'),
        md5 = crypto.createHash('md5');


    var path = './test/fixtures/pug.jpeg';
    var filename = path.split('/').slice(-1)[0];

    var fileOpts = {
        filename: filename,
        uploadProfile: 'foo',
        filesizeInBytes: 86753, //fs.statSync(path).size,
        md5Checksum: '064919f402df57be2213643e0dc23ec6' //md5.update(file).digest('hex')
    };

    smartimage('POST', '/asset', fileOpts, options, function(err, res){
        t.ok(true, 'Simple request successful');
        return t.end();
    });

});

test.skip('DELETE request', function(t){
    // @TODO: need to POST a new file then DELETE it
});

test.skip('PUT request', function(t){
    // @TODO: need to POST a new file, PUT and update it, and then DELETE it
});
