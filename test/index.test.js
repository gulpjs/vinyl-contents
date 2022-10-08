'use strict';

var expect = require('expect');
var Vinyl = require('vinyl');

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

var expectedBuffer = Buffer.from('var a = 1;');

describe('vinyl-contents', function () {
  it('errors if not given a vinyl object', function (done) {
    vinylContents({}, function (err, contents) {
      expect(err).toBeInstanceOf(Error);
      expect(contents).toBeUndefined();
      done();
    });
  });

  it('returns the contents of a Vinyl file with Buffer contents', function (done) {
    var file = makeBufferFile();

    vinylContents(file, function (err, contents) {
      expect(err).toBeFalsy();
      expect(contents).toEqual(expectedBuffer);
      done();
    });
  });

  it('returns empty contents if Vinyl file has no contents', function (done) {
    var file = makeEmptyFile();

    vinylContents(file, function (err, contents) {
      expect(err).toBeFalsy();
      expect(contents).toBeUndefined();
      done();
    });
  });

  function streamSuite(moduleName) {
    var stream = require(moduleName);

    function makeStreamFile() {
      return new Vinyl({
        path: 'test.js',
        contents: stream.Readable.from([
          Buffer.from('var a'),
          Buffer.from(' = '),
          Buffer.from('1;'),
        ]),
      });
    }

    function makeImmediateErrorStreamFile() {
      var contents = new stream.Readable({
        read: function (cb) {
          var err = new Error('boom!');
          if (typeof cb === 'function') {
            return cb(err);
          }

          this.destroy(err);
        },
      });

      return new Vinyl({
        path: 'test.js',
        contents: contents,
      });
    }

    function makeErrorStreamFile() {
      var items = [Buffer.from('var a'), Buffer.from(' = '), Buffer.from('1;')];
      var contents = new stream.Readable({
        read: function (cb) {
          var chunk = items.shift();
          if (chunk) {
            this.push(chunk);
            if (typeof cb === 'function') {
              cb();
            }
            return;
          }

          var err = new Error('boom!');
          if (typeof cb === 'function') {
            return cb(err);
          }

          this.destroy(err);
        },
      });

      return new Vinyl({
        path: 'test.js',
        contents: contents,
      });
    }

    describe('with (' + moduleName + ')', function () {
      it('returns the contents of a Vinyl file with Streaming contents', function (done) {
        var file = makeStreamFile();

        vinylContents(file, function (err, contents) {
          expect(err).toBeFalsy();
          expect(contents.toString()).toEqual(expectedBuffer.toString());
          done();
        });
      });

      it('works with String(contents)', function (done) {
        var file = makeStreamFile();

        vinylContents(file, function (err, contents) {
          expect(err).toBeFalsy();
          expect(String(contents)).toEqual(expectedBuffer.toString());
          done();
        });
      });

      it('surfaces immediate errors within content stream', function (done) {
        var file = makeImmediateErrorStreamFile();

        vinylContents(file, function (err, contents) {
          expect(err).toBeInstanceOf(Error);
          expect(contents).toBeUndefined();
          done();
        });
      });

      it('surfaces errors anywhere within content stream', function (done) {
        var file = makeErrorStreamFile();

        vinylContents(file, function (err, contents) {
          expect(err).toBeInstanceOf(Error);
          expect(contents).toBeUndefined();
          done();
        });
      });

      it('works with a cloned file that has streaming contents', function (done) {
        var file = makeStreamFile();

        var file2 = file.clone();

        vinylContents(file2, function (err, contents) {
          expect(err).toBeFalsy();
          expect(contents.toString()).toEqual(expectedBuffer.toString());
          done();
        });
      });
    });
  }

  streamSuite('stream');
  streamSuite('streamx');
  streamSuite('readable-stream');
});
