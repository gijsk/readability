var path = require("path");
var fs = require("fs");

var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var readability = require("../index.js");
var JSDOMParser = readability.JSDOMParser;

var BASETESTCASE = '<html><body><p>Some text and <a class="someclass" href="#">a link</a></p>' +
                   '<div id="foo">With a <script>With < fancy " characters in it because' +
                   '</script> that is fun.<span>And another node to make it harder</span></div><form><input type="text"/><input type="number"/>Here\'s a form</form></body></html>';

var baseDoc = new JSDOMParser().parse(BASETESTCASE);

describe("Test JSDOM functionality", function() {
  function nodeExpect(actual, expected) {
    try {
      expect(actual).eql(expected);
    } catch (ex) {
      throw ex.message;
    }
  }
  it("should work for basic operations using the parent child hierarchy and innerHTML", function() {
    expect(baseDoc.childNodes.length).eql(1);
    expect(baseDoc.getElementsByTagName("*").length).eql(10);
    var foo = baseDoc.getElementById("foo");
    expect(foo.parentNode.localName).eql("body");
    nodeExpect(baseDoc.body, foo.parentNode);
    nodeExpect(baseDoc.body.parentNode, baseDoc.documentElement);
    expect(baseDoc.body.childNodes.length).eql(3);

    var generatedHTML = baseDoc.getElementsByTagName("p")[0].innerHTML;
    expect(generatedHTML).eql('Some text and <a class="someclass" href="#">a link</a>');
    var scriptNode = baseDoc.getElementsByTagName("script")[0];
    generatedHTML = scriptNode.innerHTML;
    expect(generatedHTML).eql('With < fancy " characters in it because');
    expect(scriptNode.textContent).eql('With < fancy " characters in it because');

  });

  it("should deal with script tags", function() {
    // Check our script parsing worked:
    var scripts = baseDoc.getElementsByTagName("script");
    expect(scripts.length).eql(1);
    expect(scripts[0].textContent).eql("With < fancy \" characters in it because");
  });

  it("should have working sibling/first+lastChild properties", function() {
    var foo = baseDoc.getElementById("foo");

    nodeExpect(foo.previousSibling.nextSibling, foo);
    nodeExpect(foo.nextSibling.previousSibling, foo);
    nodeExpect(foo.nextSibling, foo.nextElementSibling);
    nodeExpect(foo.previousSibling, foo.previousElementSibling);

    var beforeFoo = foo.previousSibling;
    var afterFoo = foo.nextSibling;

    nodeExpect(baseDoc.body.lastChild, afterFoo);
    nodeExpect(baseDoc.body.firstChild, beforeFoo);
  });

  it("should have working removeChild and appendChild functionality", function() {
    var foo = baseDoc.getElementById("foo");
    var beforeFoo = foo.previousSibling;
    var afterFoo = foo.nextSibling;

    var removedFoo = foo.parentNode.removeChild(foo);
    nodeExpect(foo, removedFoo);
    nodeExpect(foo.parentNode, null);
    nodeExpect(foo.previousSibling, null);
    nodeExpect(foo.nextSibling, null);
    nodeExpect(foo.previousElementSibling, null);
    nodeExpect(foo.nextElementSibling, null);

    expect(beforeFoo.localName).eql("p");
    nodeExpect(beforeFoo.nextSibling, afterFoo);
    nodeExpect(afterFoo.previousSibling, beforeFoo);
    nodeExpect(beforeFoo.nextElementSibling, afterFoo);
    nodeExpect(afterFoo.previousElementSibling, beforeFoo);

    expect(baseDoc.body.childNodes.length).eql(2);

    baseDoc.body.appendChild(foo);

    expect(baseDoc.body.childNodes.length).eql(3);
    nodeExpect(afterFoo.nextSibling, foo);
    nodeExpect(foo.previousSibling, afterFoo);
    nodeExpect(afterFoo.nextElementSibling, foo);
    nodeExpect(foo.previousElementSibling, afterFoo);

    // This should reorder back to sanity:
    baseDoc.body.appendChild(afterFoo);
    nodeExpect(foo.previousSibling, beforeFoo);
    nodeExpect(foo.nextSibling, afterFoo);
    nodeExpect(foo.previousElementSibling, beforeFoo);
    nodeExpect(foo.nextElementSibling, afterFoo);

    nodeExpect(foo.previousSibling.nextSibling, foo);
    nodeExpect(foo.nextSibling.previousSibling, foo);
    nodeExpect(foo.nextSibling, foo.nextElementSibling);
    nodeExpect(foo.previousSibling, foo.previousElementSibling);
  });

  it("should have working insertBefore functionality when inserting with ref to element", function() {
    var foo = baseDoc.getELementById("foo");
    var kids = foo.parentNode.childNodes.length;
    var elementKids = foo.parentNode.children.length;
    var fooPreviousEl = foo.previousElementSibling;
    var fooPrevious = foo.previousSibling;

    var extraTextNode = baseDoc.createTextNode("Ohi");
    foo.parentNode.insertBefore(extraTextNode, foo);
    nodeExpect(foo.previousSibling, extraTextNode);
    nodeExpect(extraTextNode.nextSibling, foo);
    nodeExpect(fooPrevious, extraTextNode.previousSibling);
    nodeExpect(fooPreviousEl, foo.previousElementSibling);

    expect(elementKids).eql(foo.parentNode.children.length);
    expect(kids + 1).eql(foo.parentNode.childNodes.length);
    extraTextNode.parentNode.removeChild(extraTextNode);

    var extraElement = baseDoc.createElement("b");
    foo.parentNode.insertBefore(extraElement, foo);
    nodeExpect(foo.previousSibling, extraElement);
    nodeExpect(extraElement.nextSibling, foo);
    nodeExpect(fooPrevious, extraElement.previousSibling);
    nodeExpect(fooPreviousEl, extraElement.previousElementSibling);
    nodeExpect(extraElement, foo.previousElementSibling);
    nodeExpect(foo, extraElement.nextElementSibling);

    expect(elementKids + 1).eql(foo.parentNode.children.length);
    expect(kids + 1).eql(foo.parentNode.childNodes.length);
    bar.parentNode.removeChild(bar);
  });

  it("should have working insertBefore functionality when inserting with ref to non-element", function() {
    var doc = new JSDOMParser().parse("<p><a href='http://www.mozilla.org/'>Mozilla</a> is <strong>awesome</strong>!</p>");

    var textNode = baseDoc.getElementsByTagName("a")[0].nextSibling;
    var kids = textNode.parentNode.childNodes.length;
    var elementKids = textNode.parentNode.children.length;
    var link = textNode.previousSibling;
    var linkNextEl = link.nextElementSibling;
    var textNodePrev = textNode.previousSibling;

    var extraTextNode = baseDoc.createTextNode("Ohi");
    textNode.parentNode.insertBefore(extraTextNode, textNode);
    nodeExpect(textNode.previousSibling, extraTextNode);
    nodeExpect(extraTextNode.nextSibling, textNode);
    nodeExpect(textNodePrev, extraTextNode.previousSibling);

    expect(elementKids).eql(textNode.parentNode.children.length);
    expect(kids + 1).eql(textNode.parentNode.childNodes.length);
    extraTextNode.parentNode.removeChild(extraTextNode);

    var extraElement = baseDoc.createElement("b");
    textNode.parentNode.insertBefore(extraElement, textNode);
    nodeExpect(textNode.previousSibling, extraElement);
    nodeExpect(extraElement.nextSibling, textNode);
    nodeExpect(textNodePrev, extraElement.previousSibling);

    nodeExpect(link, extraElement.previousElementSibling);
    nodeExpect(link.nextElementSibling, extraElement);
    nodeExpect(extraElement, linkNextEl.previousElementSibling);
    nodeExpect(extraElement.nextElementSibling, linkNextEl);

    expect(elementKids + 1).eql(textNode.parentNode.children.length);
    expect(kids + 1).eql(textNode.parentNode.childNodes.length);
    extraElement.parentNode.removeChild(extraElement);
  });

  it("should handle attributes", function() {
    var link = baseDoc.getElementsByTagName("a")[0];
    expect(link.getAttribute("href")).eql("#");
    expect(link.getAttribute("class")).eql(link.className);
    var foo = baseDoc.getElementById("foo");
    expect(foo.id).eql(foo.getAttribute("id"));
  });

  it("should have a working replaceChild", function() {
    var parent = baseDoc.getElementsByTagName('div')[0];
    var p = baseDoc.createElement("p");
    p.setAttribute("id", "my-replaced-kid");
    var childCount = parent.childNodes.length;
    var childElCount = parent.children.length;
    for (var i = 0; i < parent.childNodes.length; i++) {
      var replacedNode = parent.childNodes[i];
      var replacedAnElement = replacedNode.nodeType === replacedNode.ELEMENT_NODE;
      var oldNext = replacedNode.nextSibling;
      var oldNextEl = replacedNode.nextElementSibling;
      var oldPrev = replacedNode.previousSibling;
      var oldPrevEl = replacedNode.previousElementSibling;

      parent.replaceChild(p, replacedNode);

      // Check siblings and parents on both nodes were set:
      nodeExpect(p.nextSibling, oldNext);
      nodeExpect(p.previousSibling, oldPrev);
      nodeExpect(p.parentNode, parent);

      nodeExpect(replacedNode.parentNode, null);
      nodeExpect(replacedNode.nextSibling, null);
      nodeExpect(replacedNode.previousSibling, null);
      // if the old node was an element, element siblings should now be null
      if (replacedAnElement) {
        nodeExpect(replacedNode.nextElementSibling, null);
        nodeExpect(replacedNode.previousElementSibling, null);
      }

      // Check the siblings were updated
      if (oldNext)
        nodeExpect(oldNext.previousSibling, p);
      if (oldPrev)
        nodeExpect(oldPrev.nextSibling, p);

      // check the array was updated
      nodeExpect(parent.childNodes[i], p);

      // Now check element properties/lists:
      var kidElementIndex = parent.children.indexOf(p);
      // should be in the list:
      expect(kidElementIndex).not.eql(-1);

      if (kidElementIndex > 0) {
        nodeExpect(parent.children[kidElementIndex - 1], p.previousElementSibling);
        nodeExpect(p.previousElementSibling.nextElementSibling, p);
      } else {
        nodeExpect(p.previousElementSibling, null);
      }
      if (kidElementIndex < parent.children.length - 1) {
        nodeExpect(parent.children[kidElementIndex + 1], p.nextElementSibling);
        nodeExpect(p.nextElementSibling.previousElementSibling, p);
      } else {
        nodeExpect(p.nextElementSibling, null);
      }

      if (replacedAnElement) {
        nodeExpect(oldNextEl, p.nextElementSibling);
        nodeExpect(oldPrevEl, p.previousElementSibling);
      }

      expect(parent.childNodes.length).eql(childCount);
      expect(parent.children.length).eql(replacedAnElement ? childElCount : childElCount + 1);

      parent.replaceChild(replacedNode, p);

      nodeExpect(oldNext, replacedNode.nextSibling);
      nodeExpect(oldNextEl, replacedNode.nextElementSibling);
      nodeExpect(oldPrev, replacedNode.previousSibling);
      nodeExpect(oldPrevEl, replacedNode.previousElementSibling);
      if (replacedNode.nextSibling)
        nodeExpect(replacedNode.nextSibling.previousSibling, replacedNode);
      if (replacedNode.previousSibling)
        nodeExpect(replacedNode.previousSibling.nextSibling, replacedNode);
      if (replacedAnElement) {
        if (replacedNode.previousElementSibling)
          nodeExpect(replacedNode.previousElementSibling.nextElementSibling, replacedNode);
        if (replacedNode.nextElementSibling)
          nodeExpect(replacedNode.nextElementSibling.previousElementSibling, replacedNode);
      }
    }
  });
});

describe("Test HTML escaping", function() {
  var baseStr = "<p>Hello, everyone &amp; all their friends, &lt;this&gt; is a &quot; test with &apos; quotes.</p>";
  var doc = new JSDOMParser().parse(baseStr);
  var p = doc.getElementsByTagName("p")[0];
  var txtNode = p.firstChild;
  it("should handle encoding HTML correctly", function() {
    // This /should/ just be cached straight from reading it:
    expect("<p>" + p.innerHTML + "</p>").eql(baseStr);
    expect("<p>" + txtNode.innerHTML + "</p>").eql(baseStr);
  });

  it("should have decoded correctly", function() {
    expect(p.textContent).eql("Hello, everyone & all their friends, <this> is a \" test with ' quotes.");
    expect(txtNode.textContent).eql("Hello, everyone & all their friends, <this> is a \" test with ' quotes.");
  });

  it("should handle updates via textContent correctly", function() {
    // Because the initial tests might be based on cached innerHTML values,
    // let's manipulate via textContent in order to test that it alters
    // the innerHTML correctly.
    txtNode.textContent = txtNode.textContent + " ";
    expect("<p>" + txtNode.innerHTML + "</p>").eql(baseStr.replace("</p>", " </p>"));
    expect("<p>" + p.innerHTML + "</p>").eql(baseStr.replace("</p>", " </p>"));

  });

  it("should handle decimal and hex escape sequences", function() {
    var doc = new JSDOMParser().parse("<p>&#32;&#x20;</p>");
    expect(doc.getElementsByTagName("p")[0].textContent).eql("  ");
  });
});


describe("Script parsing", function() {
  it("should strip ?-based comments within script tags", function() {
    var html = '<script><?Silly test <img src="test"></script>';
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });

  it("should strip !-based comments within script tags", function() {
    var html = '<script><!--Silly test > <script src="foo.js"></script>--></script>';
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });

  it("should strip any other nodes within script tags", function() {
    var html = "<script><div>Hello, I'm not really in a </div></script>";
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("<div>Hello, I'm not really in a </div>");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });

  it("should not be confused by partial closing tags", function() {
    var html = "<script>var x = '<script>Hi<' + '/script>';</script>";
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("var x = '<script>Hi<' + '/script>';");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });
});

describe("Tag local name case handling", function() {
  it("should lowercase tag names", function() {
    var html = "<DIV><svG><clippath/></svG></DIV>";
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("DIV");
    expect(doc.firstChild.localName).eql("div");
    expect(doc.firstChild.firstChild.tagName).eql("SVG");
    expect(doc.firstChild.firstChild.localName).eql("svg");
    expect(doc.firstChild.firstChild.firstChild.tagName).eql("CLIPPATH");
    expect(doc.firstChild.firstChild.firstChild.localName).eql("clippath");
  });
});
