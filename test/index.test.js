'use strict';

var expect = require('expect');
var Vinyl = require('vinyl');
var from = require('from2');

var vinylContents = require('../');

function makeEmptyFile() {
  return new Vinyl({
    path: 'test.js',
    contents: null,
  });
}

function makeBufferFile() {
  return new Vinyl({
    path: 'test.js',
    contents: Buffer.from('var a = 1;'),
  });
}

function makeStreamFile() {
  return new Vinyl({
    path: 'test.js',
    contents: from([
      Buffer.from('var a'),
      Buffer.from(' = '),
      Buffer.from('1;'),
    ]),
  });
}

function makeErrorStreamFile() {
  return new Vinyl({
    path: 'test.js',
    contents: from([
      new Error('boom!'),
    ]),
  });
}

var expectedBuffer = Buffer.from('var a = 1;');

describe('vinyl-contents', function() {

  it('errors if not given a vinyl object', function(done) {
    vinylContents({}, function(err, contents) {
      expect(err).toBeInstanceOf(Error);
      expect(contents).toBeUndefined();
      done();
    });
  });

  it('returns the contents of a Vinyl file with Buffer contents', function(done) {
    var file = makeBufferFile();

    vinylContents(file, function(err, contents) {
      expect(err).toBeFalsy();
      expect(contents).toEqual(expectedBuffer);
      done();
    });
  });

  it('returns the contents of a Vinyl file with Streaming contents', function(done) {
    var file = makeStreamFile();

    vinylContents(file, function(err, contents) {
      expect(err).toBeFalsy();
      expect(contents.toString()).toEqual(expectedBuffer.toString());
      done();
    });
  });

  it('works with String(contents)', function(done) {
    var file = makeStreamFile();

    vinylContents(file, function(err, contents) {
      expect(err).toBeFalsy();
      expect(String(contents)).toEqual(expectedBuffer.toString());
      done();
    });
  });

  it('returns empty contents if Vinyl file has no contents', function(done) {
    var file = makeEmptyFile();

    vinylContents(file, function(err, contents) {
      expect(err).toBeFalsy();
      expect(contents).toBeUndefined();
      done();
    });
  });

  it('surfaces errors within content stream', function(done) {
    var file = makeErrorStreamFile();

    vinylContents(file, function(err, contents) {
      expect(err).toBeInstanceOf(Error);
      expect(contents).toBeUndefined();
      done();
    });
  });
});
