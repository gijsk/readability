var prettyPrint = require("html").prettyPrint;
var jsdom = require("jsdom").jsdom;
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var readability = require("../index.js");
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

var testPages = require("./bootstrap").getTestPages();

describe("Test page", function() {
  testPages.forEach(function(testPage) {
    describe(testPage.dir, function() {
      var doc, jsdomDoc, result, jsdomResult;

      var uri = {
        spec: "http://fakehost/test/page.html",
        host: "fakehost",
        prePath: "http://fakehost",
        scheme: "http",
        pathBase: "http://fakehost/test/"
      };

      before(function() {
        doc = new JSDOMParser().parse(testPage.source);
        jsdomDoc = jsdom(testPage.source);
        result = new Readability(uri, doc).parse();
        jsdomResult = new Readability(uri, jsdomDoc).parse();
      });

      it("should return a result object", function() {
        expect(result).to.include.keys("content", "title", "excerpt", "byline");
        expect(jsdomResult).to.include.keys("content", "title", "excerpt", "byline");
      });

      it("should extract expected content with JSDOMParser", function() {
        expect(testPage.expectedContent).eql(prettyPrint(result.content));
      });
      it("should extract expected content with jsdom", function() {
        expect(testPage.expectedContent).eql(prettyPrint(jsdomResult.content));
      });

      it("should extract expected title", function() {
        expect(testPage.expectedMetadata.title).eql(result.title);
        expect(testPage.expectedMetadata.title).eql(jsdomResult.title);
      });

      it("should extract expected byline", function() {
        expect(testPage.expectedMetadata.byline).eql(result.byline);
        expect(testPage.expectedMetadata.byline).eql(jsdomResult.byline);
      });

      it("should extract expected excerpt", function() {
        expect(testPage.expectedMetadata.excerpt).eql(result.excerpt);
        expect(testPage.expectedMetadata.excerpt).eql(jsdomResult.excerpt);
      });
    });
  });
});
