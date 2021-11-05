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


import { CustomNode } from './node'
import { Rule } from './rules'
import { Html2OrgOptions } from './turndown'
import { judgeCodeblockLanguage, repeat, safeDecodeURI, wrapInlineMarkWithSpace } from './utilities'

// https://stackoverflow.com/questions/49538199/is-it-possible-to-infer-the-keys-of-a-record-in-typescript
function createRulesObject<T extends { [ruleName: string]: Rule }>(rulesObject: T): T {
  return rulesObject
}
type RulesKeys<Obj, K = keyof Obj> = Obj extends Record<infer K, any> ? K : never
type rule_name_t = RulesKeys<typeof rules>

let rules = createRulesObject({
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
      if (content === '') { return '' }
      var hLevel = Number(node.nodeName.charAt(1))
      console.log('[DEBUG] <h>', content)
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
        node.nodeName === 'PRE'
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
        node.nodeName === 'PRE'
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
        // options.linkStyle === 'inlined' &&
        node.nodeName === 'A' &&
        node.hasAttribute('href')
      )
    },

    /**
     * NOTE: The reason of remove empty <a>
     * In Github, Node.childNodes may return an array contains duplicated <h2>
     * (They are actually the same <h2> in DOM...):
     * ```js
     * [ "<h1></h1>", "<h2><a id=\"user-content-prepare\" class=\"anchor\" aria-hidden=\"true\" href=\"https://github.com/kuanyui/copy-as-org-mode#prepare\"><svg class=\"octicon octicon-link\" viewBox=\"0 0 16 16\" version=\"1.1\" width=\"16\" height=\"16\" aria-hidden=\"true\"></svg></a></h2>", "<h2>Prepare</h2>", "<div class=\"highlight highlight-source-shell position-relative overflow-auto\"><pre></pre></div>" ]
     * ```
     * So remove it directly.
     */
    replacement: function (content: string, node: CustomNode, options: Html2OrgOptions) {

      if (content === '') { return '' } // For example, Github's H1/H2/H3... has invisible # link
      let href = node.getAttribute('href') || ''
      if (options.decodeUri) {
        href = safeDecodeURI(href)
      }
      let title = cleanAttribute(node.getAttribute('title') || '')
      if (title) {
        title = ' "' + title + '"'
      }
      // When <a> contains exactly only one Node and it's <img>
      if (node.childNodes.length === 1) {
        const child = node.firstChild!
        if (child.nodeName === 'IMG') {
          const img = child as HTMLImageElement
          if (href === img.src) {
            return `[[${href}]]`
          }
          const imgSrc = options.decodeUri ? safeDecodeURI(img.src) :img.src
          return `[[${href}][${imgSrc}]]`  // Org-mode's canonical syntax for Image + Link
        }
      }
      return `[[${href}][${content}]]`
    }
  },
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
  sup: {
    filter: 'sup',

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      return '^{' + content + '}'
    }
  },
  sub: {
    filter: 'sub',

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      return '_{' + content + '}'
    }
  },
  code: {
    filter: function (node) {
      var hasSiblings = node.previousSibling || node.nextSibling
      var isInCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings
      return (node.nodeName === 'CODE' || node.nodeName === 'KBD') && !isInCodeBlock
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
  rp: {
    filter: 'rp',
    replacement: function (content, node, options): string {
      switch (options.ruby) {
        case 'removeRuby': return ''
        case 'forceAddParenthesis': return ''
        case 'keepIfWrappedByRp': return content
      }
    }
  },
  rt: {
    filter: 'rt',
    replacement: function (content, node, options): string {
      switch (options.ruby) {
        case 'removeRuby': return ''
        case 'forceAddParenthesis': return '（' + content + '）'
        case 'keepIfWrappedByRp': {
          const prev = node.previousElementSibling
          if (!prev) { return '' }
          const next = node.nextElementSibling
          if (!next) { return '' }
          if (prev.nodeName === 'RP' && next.nodeName === 'RP') {
            return content
          }
          return ''
        }
      }
    }
  },
  image: {
    filter: 'img',
    // TODO: alt & title
    replacement: function (content: string, node, options) {
      var alt = cleanAttribute(node.getAttribute('alt') || '')
      var src = node.getAttribute('src') || ''
      if (options.decodeUri) {
        src = safeDecodeURI(src)
      }
      var title = cleanAttribute(node.getAttribute('title') || '')
      return '[[' + src + ']]'
    }
  }
})


function cleanAttribute (attribute: string): string {
  return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
}

export default rules
