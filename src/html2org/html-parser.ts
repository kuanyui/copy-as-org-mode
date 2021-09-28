/*!
 * This file is derived from `turndown` by Dom Christie
 * @see https://github.com/mixmark-io/turndown
 *
 * MIT License
 *
 * Copyright (c) 2021 ono ono (kuanyui)
 * Copyright (c) 2017 Dom Christie
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


/**
 * Set up window for Node.js
 */

var root: any = (typeof window !== 'undefined' ? window : {})

/*
 * Parsing HTML strings
 */

function canParseHTMLNatively () {
  // @ts-ignore
  var Parser = root.DOMParser
  var canParse = false

  // Adapted from https://gist.github.com/1129031
  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if (new Parser().parseFromString('', 'text/html')) {
      canParse = true
    }
  } catch (e) {}

  return canParse
}

function createHTMLParser () {
  var Parser = function () {}
  // @ts-ignore
  if (process.browser) {
    if (shouldUseActiveX()) {
      Parser.prototype.parseFromString = function (str: string) {
        // @ts-ignore
        var doc = new window.ActiveXObject('htmlfile')
        doc.designMode = 'on' // disable on-page scripts
        doc.open()
        doc.write(str)
        doc.close()
        return doc
      }
    } else {
      Parser.prototype.parseFromString = function (str: string) {
        var doc = document.implementation.createHTMLDocument('')
        doc.open()
        doc.write(str)
        doc.close()
        return doc
      }
    }
  } else {
    throw new Error('[To Developer] Currently need not this.')
    // var domino = require('domino')
    // Parser.prototype.parseFromString = function (str: string) {
    //   return domino.createDocument(str)
    // }
  }
  return Parser
}

function shouldUseActiveX () {
  var useActiveX = false
  try {
    document.implementation.createHTMLDocument('').open()
  } catch (e) {
    // @ts-ignore
    if (window.ActiveXObject) useActiveX = true
  }
  return useActiveX
}


// export default function getDOMParserCtor(): DOMParser {
//   const parser: DOMParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser()
//   return parser
// }

const AvailableParser: DOMParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser()
export default AvailableParser