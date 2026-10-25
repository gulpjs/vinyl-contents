"use strict";

var assert = require("node:assert");
var { describe, it } = require("node:test");

var Vinyl = require("vinyl");

var vinylContents = require("../");

function makeEmptyFile() {
  return new Vinyl({
    path: "test.js",
    contents: null,
  });
}

function makeBufferFile() {
  return new Vinyl({
    path: "test.js",
    contents: Buffer.from("var a = 1;"),
  });
}

var expectedBuffer = Buffer.from("var a = 1;");

describe("vinyl-contents", function () {
  it("errors if not given a vinyl object", function (t, done) {
    vinylContents({}, function (err, contents) {
      assert.ok(err instanceof Error);
      assert.deepStrictEqual(contents, undefined);
      done();
    });
  });

  it("returns the contents of a Vinyl file with Buffer contents", function (t, done) {
    var file = makeBufferFile();

    vinylContents(file, function (err, contents) {
      assert.ok(!err);
      assert.deepStrictEqual(contents, expectedBuffer);
      done();
    });
  });

  it("returns empty contents if Vinyl file has no contents", function (t, done) {
    var file = makeEmptyFile();

    vinylContents(file, function (err, contents) {
      assert.ok(!err);
      assert.deepStrictEqual(contents, undefined);
      done();
    });
  });

  function streamSuite(moduleName) {
    var stream = require(moduleName);

    function makeStreamFile() {
      return new Vinyl({
        path: "test.js",
        contents: stream.Readable.from([
          Buffer.from("var a"),
          Buffer.from(" = "),
          Buffer.from("1;"),
        ]),
      });
    }

    function makeImmediateErrorStreamFile() {
      var contents = new stream.Readable({
        read: function (cb) {
          var err = new Error("boom!");
          if (typeof cb === "function") {
            return cb(err);
          }

          this.destroy(err);
        },
      });

      return new Vinyl({
        path: "test.js",
        contents: contents,
      });
    }

    function makeErrorStreamFile() {
      var items = [Buffer.from("var a"), Buffer.from(" = "), Buffer.from("1;")];
      var contents = new stream.Readable({
        read: function (cb) {
          var chunk = items.shift();
          if (chunk) {
            this.push(chunk);
            if (typeof cb === "function") {
              cb();
            }
            return;
          }

          var err = new Error("boom!");
          if (typeof cb === "function") {
            return cb(err);
          }

          this.destroy(err);
        },
      });

      return new Vinyl({
        path: "test.js",
        contents: contents,
      });
    }

    describe("with (" + moduleName + ")", function () {
      it("returns the contents of a Vinyl file with Streaming contents", function (t, done) {
        var file = makeStreamFile();

        vinylContents(file, function (err, contents) {
          assert.ok(!err);
          assert.deepStrictEqual(
            contents.toString(),
            expectedBuffer.toString(),
          );
          done();
        });
      });

      it("works with String(contents)", function (t, done) {
        var file = makeStreamFile();

        vinylContents(file, function (err, contents) {
          assert.ok(!err);
          assert.deepStrictEqual(String(contents), expectedBuffer.toString());
          done();
        });
      });

      it("surfaces immediate errors within content stream", function (t, done) {
        var file = makeImmediateErrorStreamFile();

        vinylContents(file, function (err, contents) {
          assert.ok(err instanceof Error);
          assert.ok(!contents);
          done();
        });
      });

      it("surfaces errors anywhere within content stream", function (t, done) {
        var file = makeErrorStreamFile();

        vinylContents(file, function (err, contents) {
          assert.ok(err instanceof Error);
          assert.ok(!contents);
          done();
        });
      });

      it("works with a cloned file that has streaming contents", function (t, done) {
        var file = makeStreamFile();

        var file2 = file.clone();

        vinylContents(file2, function (err, contents) {
          assert.ok(!err);
          assert.deepStrictEqual(
            contents.toString(),
            expectedBuffer.toString(),
          );
          done();
        });
      });
    });
  }

  streamSuite("stream");
  streamSuite("streamx");
  streamSuite("readable-stream");
});
