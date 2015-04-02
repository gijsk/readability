var prettyPrint = require("html").prettyPrint;
var jsdom = require("jsdom").jsdom;
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var readability = require("../index.js");
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

var testPages = require("./bootstrap").getTestPages();

function suite(result, expectedContent, expectedMetadata) {
  it("should return a result object", function() {
    expect(result).to.include.keys("content", "title", "excerpt", "byline");
  });

  it("should extract expected content", function() {
    expect(expectedContent).eql(prettyPrint(result.content));
  });

  it("should extract expected title", function() {
    expect(expectedMetadata.title).eql(result.title);
  });

  it("should extract expected byline", function() {
    expect(expectedMetadata.byline).eql(result.byline);
  });

  it("should extract expected excerpt", function() {
    expect(expectedMetadata.excerpt).eql(result.excerpt);
  });
}

function removeCommentNodesRecursively(node) {
  [].forEach.call(node.childNodes, function(child) {
    if (child.nodeType === child.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === child.ELEMENT_NODE) {
      removeCommentNodesRecursively(child);
    }
  });
}

describe("Test page", function() {
  testPages.forEach(function(testPage) {
    describe(testPage.dir, function() {
      var uri = {
        spec: "http://fakehost/test/page.html",
        host: "fakehost",
        prePath: "http://fakehost",
        scheme: "http",
        pathBase: "http://fakehost/test/"
      };

      describe("jsdom", function() {
        var doc = jsdom(testPage.source);
        removeCommentNodesRecursively(doc);
        var result = new Readability(uri, doc).parse();
        suite(result, testPage.expectedContent, testPage.expectedMetadata);
      });

      describe("JSDOMParser", function() {
        var doc = new JSDOMParser().parse(testPage.source);
        var result = new Readability(uri, doc).parse();
        suite(result, testPage.expectedContent, testPage.expectedMetadata);
      });
    });
  });
});
