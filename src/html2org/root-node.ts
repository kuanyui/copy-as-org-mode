/*!
 * This file is derived from `turndown` by Dom Christie
 * @see https://github.com/mixmark-io/turndown
 *
 * MIT License
 *
 * Copyright (c) 2021 ono ono (kuanyui)
 * Copyright (c) 2017 Dom Christie
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import collapseWhitespace from './collapse-whitespace'
import { Html2OrgOptions } from './turndown'
import { isBlock, isVoid } from './utilities'

export default function RootNode (input: string | Node, options: Html2OrgOptions): Node {
  var root
  if (typeof input === 'string') {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body id="html2org-root">
          ${input}
        </body>
      </html>
      `,
      'text/html'
    )
    root = doc.getElementById('html2org-root')!
    root.querySelectorAll('pre').forEach(el => {
      // NOTE: DOMParser + innerText is a fucking shit and some newlines will disappeared in Element.innerText / Node.textContent .  So add \n to each <br/>
      // @see https://stackoverflow.com/questions/56082077/is-there-some-way-to-render-br-tags-with-javascripts-domparser
      el.innerHTML = el.innerHTML.replace(/< *?br *?\/? *?>/gi, '<br />\n')
    })
  } else {
    root = input.cloneNode(true)
  }
  if (!root) { throw new Error('ERROR: Why root node is not existed?') }
  collapseWhitespace({
    element: root,
    isBlock: isBlock,
    isVoid: isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  })

  return root
}
let _htmlParser: DOMParser
function htmlParser () {
  _htmlParser = _htmlParser || new window.DOMParser()
  return _htmlParser
}

function isPreOrCode (node: Node) {
  return node.nodeName === 'PRE' || node.nodeName === 'CODE'
}

// Copied from https://stackoverflow.com/questions/55804438/interesting-conversion-of-br-between-innerhtml-and-innertext
function htmlToElem (html: string): HTMLElement {
  const div = document.createElement('div');
  document.body.append(div);
  div.innerHTML = html;
  return div;
}
function htmlToText (html: string): string {
  const div = document.createElement('div');
  document.body.append(div);
  div.innerHTML = html;
  const text = div.innerText;
  div.remove();
  return text;
}
