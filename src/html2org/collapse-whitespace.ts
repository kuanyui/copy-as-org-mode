/*!
 * The collapseWhitespace function is adapted from collapse-whitespace
 * by Luc Thevenard.
 *
 *  @see https://github.com/lucthev/collapse-whitespace
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { CustomNode } from "./node"

type NodeJudgeFn = (node: Node) => boolean
interface CollapseWhitespaceOptions {
  element: Node,
  isBlock: NodeJudgeFn,
  isVoid: NodeJudgeFn,
  isPre: NodeJudgeFn | null,
}

/**
 * collapseWhitespace(options) removes extraneous whitespace from an the given element.
 *
 * @param {Object} options
 */
export default function collapseWhitespace (options: CollapseWhitespaceOptions) {
  let element = options.element
  let isBlock = options.isBlock
  let isVoid = options.isVoid
  let isPre = options.isPre || function (node) {
    return node.nodeName === 'PRE'
  }

  if (!element.firstChild || isPre(element)) return

  let prevText: Text | null = null
  let keepLeadingWs: boolean = false

  let prev = null
  let node = next(prev, element, isPre)

  while (node !== element) {
    if (!node) { break }

    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) { // Node.TEXT_NODE or Node.CDATA_SECTION_NODE
      const textNode: Text = node as Text
      let text = textNode.data.replace(/[ \r\n\t]+/g, ' ')

      if ((!prevText || / $/.test(prevText.data)) &&
          !keepLeadingWs && text[0] === ' ') {
        text = text.substr(1)
      }

      // `text` might be empty at this point.
      if (!text) {
        node = remove(node)
        continue
      }

      textNode.data = text

      prevText = textNode
    } else if (node.nodeType === Node.ELEMENT_NODE) { // Node.ELEMENT_NODE
      if (isBlock(node) || node.nodeName === 'BR') {
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, '')
        }

        prevText = null
        keepLeadingWs = false
      } else if (isVoid(node) || isPre(node)) {
        // Avoid trimming space around non-block, non-BR void elements and inline PRE.
        prevText = null
        keepLeadingWs = true
      } else if (prevText) {
        // Drop protection if set previously.
        keepLeadingWs = false
      }
    } else {
      node = remove(node)
      continue
    }

    var nextNode = next(prev, node, isPre)
    prev = node
    node = nextNode
  }

  if (prevText) {
    prevText.data = prevText.data.replace(/ $/, '')
    if (!prevText.data) {
      remove(prevText)
    }
  }
}

/**
 * remove(node) removes the given node from the DOM and returns the
 * next node in the sequence.
 *
 * @param {Node} node
 * @return {Node} node
 */
function remove (node: Node) {
  var next = node.nextSibling || node.parentNode
  if (!node.parentNode) {
    console.warn('[To Developer] parentNode is not existed, so this node cannot be remove from DOM.')
    return null
  }
  node.parentNode.removeChild(node)

  return next
}

/**
 * next(prev, current, isPre) returns the next node in the sequence, given the
 * current and previous nodes.
 *
 * @param {Node} prev
 * @param {Node} current
 * @param {Function} isPre
 * @return {Node}
 */
function next(prev: Node | null, current: Node | null, isPre: NodeJudgeFn) {
  if (current === null) { return null }
  if ((prev && prev.parentNode === current) || isPre(current)) {
    return current.nextSibling || current.parentNode
  }

  return current.firstChild || current.nextSibling || current.parentNode
}


