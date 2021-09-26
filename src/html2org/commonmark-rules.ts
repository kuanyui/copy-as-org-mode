import { CustomNode } from './node'
import { Rule } from './rules'
import { Html2OrgOptions } from './turndown'
import { repeat } from './utilities'

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
      content = content.replace(/^\n+|\n+$/g, '')
      content = content.replace(/^/gm, '> ')
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
      content = content
        .replace(/^\n+/, '') // remove leading newlines
        .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
        .replace(/\n/gm, '\n    ') // indent
      let prefix = options.unorderedListMarker + '   '
      const parent = node.parentNode
      if (!parent) { return 'ERROR: Why does <li> has no parentNode?' }
      if (parent.nodeName === 'OL') {
        const parentEl: HTMLElement = parent as HTMLElement
        const start = parentEl.getAttribute('start')
        const index = Array.prototype.indexOf.call(parent.children, node)
        prefix = (start ? Number(start) + index : index + 1) + options.orderedListMarker + '  '
      }
      return (
        prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
      )
    }
  },
  colonCodeBlock: {
    filter: function (node: CustomNode, options: Html2OrgOptions) {
      return (
        options.codeBlockStyle === 'colon' &&
        node.nodeName === 'PRE' &&
        !!node.firstChild &&
        node.firstChild.nodeName === 'CODE'
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
        !!node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },

    replacement: function (content, node, options): string {
      const firstChild = node.firstChild
      if (!firstChild) { return 'ERROR: beginEndCodeBlock: has no firstChild' }
      const textContent = firstChild.textContent
      if (!textContent) { return 'ERROR: beginEndCodeBlock: firstChild has no textContent' }
      let className = (firstChild as Element).getAttribute('class') || ''
      let language = (className.match(/language-(\S+)/) || [null, ''])[1]
      if (language) { language = ' ' + language }
      let code: string = textContent

      return (
        '\n\n#+begin_src'  + language + '\n' +
        code.replace(/\n$/, '') +
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
      content = content.trim()
      if (!content) { return '' }
      return options.italicDelimiter + content + options.italicDelimiter
    }
  },
  bold: { // FIXME: extra space
    filter: ['strong', 'b'],

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      content = content.trim()
      if (!content) { return '' }
      return options.boldDelimiter + content + options.boldDelimiter
    }
  },
  code: {
    filter: function (node) {
      var hasSiblings = node.previousSibling || node.nextSibling
      var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings

      return node.nodeName === 'CODE' && !isCodeBlock
    },

    replacement: function (content: string): string {
      if (!content) return ''
      content = content.replace(/\r?\n|\r/g, ' ')

      var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : ''
      var delimiter = '`'
      var matches = content.match(/`+/gm) || []
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`'

      return delimiter + extraSpace + content + extraSpace + delimiter
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
