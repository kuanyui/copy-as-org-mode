/**
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


import { CustomNode } from './node'
import { Rule } from './rules'
import { Html2OrgOptions } from './turndown'
import { judgeCodeblockLanguage, repeat, wrapInlineMarkWithSpace } from './utilities'

let rules: Record<string, Rule> = {
  paragraph: {
    filter: 'p',

    replacement: function (content: string): string {
      return '\n\n' + content + '\n\n'
    }
  },
  lineBreak: {
    filter: 'br',
    replacement: function (content: string, node: Node, options: Html2OrgOptions): string {
      return options.br + '\n'
    }
  },
  heading: {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

    replacement: function (content: string, node: Node, options: Html2OrgOptions): string {
      var hLevel = Number(node.nodeName.charAt(1))

      return '\n\n' + repeat(options.headingMarker, hLevel) + ' ' + content + '\n\n'
    }
  },
  blockquote: {
    filter: 'blockquote',

    replacement: function (content: string): string {
      // content = content.replace(/^/gm, '  ')  // indentation
      return '\n\n#+begin_quote\n' +
      content +
      '\n#+end_quote\n\n'
    }
  },
  list: {
    filter: ['ul', 'ol'],

    replacement: function (content: string, node: Node): string {
      var parent = node.parentNode
      if (!parent) { return 'ERROR' }
      if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
        return '\n' + content
      } else {
        return '\n\n' + content + '\n\n'
      }
    }
  },
  listItem: {
    filter: 'li',

    replacement: function (content: string, node: Node, options: Html2OrgOptions): string {
      const indent = Array(options.listIndentSize).fill(' ').join('')
      content = content
        .replace(/^\n+/, '') // remove leading newlines
        .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
        .replace(/\n/gm, '\n' + indent) // indent
      let prefix = options.unorderedListMarker + ' '
      const parent = node.parentNode
      if (!parent) { return 'ERROR: Why does <li> has no parentNode?' }
      if (parent.nodeName === 'OL') {
        const parentEl: HTMLElement = parent as HTMLElement
        const start = parentEl.getAttribute('start')
        const index = Array.prototype.indexOf.call(parent.children, node)
        prefix = (start ? Number(start) + index : index + 1) + options.orderedListMarker + ' '
      }
      return (
        prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
      )
    }
  },
  checkboxInList: {
    filter: function (node) {
      const el = node as unknown as HTMLInputElement
      return el.type === 'checkbox' && !!el.parentNode && el.parentNode.nodeName === 'LI'
    },
    replacement: function (content, node) {
      const el = node as unknown as HTMLInputElement
      return (el.checked ? '[X]' : '[ ]') + ' '
    }
  },
  colonCodeBlock: {
    filter: function (node: CustomNode, options: Html2OrgOptions) {
      return (
        options.codeBlockStyle === 'colon' &&
        node.nodeName === 'PRE' &&
        judgeCodeblockLanguage(node) !== ''
      )
    },

    replacement: function (content: string, node: Node, options: Html2OrgOptions): string {
      const firstChild = node.firstChild
      if (!firstChild) { return 'ERROR: colonCodeBlock: has no firstChild' }
      const textContent = firstChild.textContent
      if (!textContent) { return 'ERROR: colonCodeBlock: firstChild has no textContent' }
      return (
        '\n\n' +
        textContent.replace(/\n/g, '\n: ') +
        '\n\n'
      )
    }
  },
  beginEndCodeBlock: {
    filter: function (node: CustomNode, options: Html2OrgOptions) {
      return (
        options.codeBlockStyle === 'beginEnd' &&
        node.nodeName === 'PRE' &&
        judgeCodeblockLanguage(node) !== ''
      )
    },

    replacement: function (content, node, options): string {
      const textContent = node.innerText
      if (!textContent === null) { return 'ERROR: beginEndCodeBlock: firstChild has no textContent' }
      let langId = judgeCodeblockLanguage(node)
      if (langId) { langId = ' ' + langId }
      // FIXME: Newlines of textContent are all disappeared in this page: https://kuanyui.github.io/2017/08/16/macros-for-qproperty/
      console.log('取られたコード', textContent, node)
      return (
        '\n\n#+begin_src'  + langId + '\n' +
        textContent +
        '\n#+end_src\n\n'
      )
    }
  },
  horizontalRule: {
    filter: 'hr',

    replacement: function (content: string, node: Node, options: Html2OrgOptions): string {
      return '\n\n' + options.hr + '\n\n'
    }
  },
  inlineLink: {
    filter: function (node: HTMLElement, options: Html2OrgOptions): boolean {
      return (
        options.linkStyle === 'inlined' &&
        node.nodeName === 'A' &&
        node.hasAttribute('href')
      )
    },

    replacement: function (content: string, node: CustomNode) {
      let href = decodeURI(node.getAttribute('href') || '')   // Get rid of URL like "/%E7%B5%B6%E5%AF%BE%E7%8E%8B%E6%94%BF"
      let title = cleanAttribute(node.getAttribute('title') || '')
      if (title) {
        title = ' "' + title + '"'
      }
      return `[[${href}][${content}]]`
    }
  },
  // referenceLink: {
  //   filter: function (node, options: Html2OrgOptions): boolean {
  //     return (
  //       options.linkStyle === 'referenced' &&
  //       node.nodeName === 'A' &&
  //       node.hasAttribute('href')
  //     )
  //   },

  //   replacement: function (content: string, node, options: Html2OrgOptions): string {
  //     var href = node.getAttribute('href')
  //     var title = cleanAttribute(node.getAttribute('title'))
  //     if (title) title = ' "' + title + '"'
  //     var replacement
  //     var reference

  //     switch (options.linkReferenceStyle) {
  //       case 'collapsed':
  //         replacement = '[' + content + '][]'
  //         reference = '[' + content + ']: ' + href + title
  //         break
  //       case 'shortcut':
  //         replacement = '[' + content + ']'
  //         reference = '[' + content + ']: ' + href + title
  //         break
  //       default:
  //         var id = this.references.length + 1
  //         replacement = '[' + content + '][' + id + ']'
  //         reference = '[' + id + ']: ' + href + title
  //     }

  //     this.references.push(reference)
  //     return replacement
  //   },

  //   references: [],

  //   append: function (options: Html2OrgOptions): string {
  //     var references = ''
  //     if (this.references.length) {
  //       references = '\n\n' + this.references.join('\n') + '\n\n'
  //       this.references = [] // Reset references
  //     }
  //     return references
  //   }
  // },
  italic: {
    filter: ['em', 'i'],

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      return wrapInlineMarkWithSpace(content, node, options.italicDelimiter)
    }
  },
  bold: {
    filter: ['strong', 'b'],

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      return wrapInlineMarkWithSpace(content, node, options.boldDelimiter)
    }
  },
  strike: {
    filter: ['strike', 's', 'del'],

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      return wrapInlineMarkWithSpace(content, node, options.strikeDelimiter)
    }
  },
  underline: {
    filter: 'u',

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      return wrapInlineMarkWithSpace(content, node, options.underlineDelimiter)
    }
  },
  code: {
    filter: function (node) {
      var hasSiblings = node.previousSibling || node.nextSibling
      var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings
      return (node.nodeName === 'CODE' || node.nodeName === 'KBD') && !isCodeBlock
    },

    replacement: function (content, node, options): string {
      let ch = options.codeDelimiter
      if (content.includes('=') && content.includes('~')) {
        return `\n\n: ${content} \n\n`
      }
      else if (ch === '=' && content.includes('=')) { ch = '~' }
      else if (ch === '~' && content.includes('~')) { ch = '~' }
      if (node.closest('table')) {
        ch = '~'
        if (content.includes('~')) {
          return content  // give up...
        }
      }
      return wrapInlineMarkWithSpace(content, node, ch)
    }
  },
  image: {
    filter: 'img',

    replacement: function (content: string, node) {
      var alt = cleanAttribute(node.getAttribute('alt') || '')
      var src = node.getAttribute('src') || ''
      var title = cleanAttribute(node.getAttribute('title') || '')
      var titlePart = title ? ' "' + title + '"' : ''
      return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
    }
  }
}



function cleanAttribute (attribute: string): string {
  return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
}

export default rules
