import { Html2OrgOptions } from './turndown'
import { repeat } from './utilities'

let rules = {
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

      if (options.headingStyle === 'setext' && hLevel < 3) {
        var underline = repeat((hLevel === 1 ? '=' : '-'), content.length)
        return (
          '\n\n' + content + '\n' + underline + '\n\n'
        )
      } else {
        return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n'
      }
    }
  },
  blockquote: {
    filter: 'blockquote',

    replacement: function (content: string): string {
      content = content.replace(/^\n+|\n+$/g, '')
      content = content.replace(/^/gm, '> ')
      return '\n\n' + content + '\n\n'
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
      var prefix = options.bulletListMarker + '   '
      var parent = node.parentNode
      if (parent.nodeName === 'OL') {
        var start = parent.getAttribute('start')
        var index = Array.prototype.indexOf.call(parent.children, node)
        prefix = (start ? Number(start) + index : index + 1) + '.  '
      }
      return (
        prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
      )
    }
  },
  indentedCodeBlock: {
    filter: function (node: Node, options: Html2OrgOptions): string {
      return (
        options.codeBlockStyle === 'indented' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },

    replacement: function (content: string, node: Node, options: Html2OrgOptions): string {
      return (
        '\n\n    ' +
        node.firstChild.textContent.replace(/\n/g, '\n    ') +
        '\n\n'
      )
    }
  },
  fencedCodeBlock: {
    filter: function (node: CustomNode, options: Html2OrgOptions): string {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      var className = node.firstChild.getAttribute('class') || ''
      var language = (className.match(/language-(\S+)/) || [null, ''])[1]
      var code = node.firstChild.textContent

      var fenceChar = options.fence.charAt(0)
      var fenceSize = 3
      var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm')

      var match
      while ((match = fenceInCodeRegex.exec(code))) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1
        }
      }

      var fence = repeat(fenceChar, fenceSize)

      return (
        '\n\n' + fence + language + '\n' +
        code.replace(/\n$/, '') +
        '\n' + fence + '\n\n'
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
        node.getAttribute('href')
      )
    },

    replacement: function (content: string, node) {
      var href = node.getAttribute('href')
      var title = cleanAttribute(node.getAttribute('title'))
      if (title) title = ' "' + title + '"'
      return '[' + content + '](' + href + title + ')'
    }
  },
  referenceLink: {
    filter: function (node, options: Html2OrgOptions): string {
      return (
        options.linkStyle === 'referenced' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
      )
    },

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      var href = node.getAttribute('href')
      var title = cleanAttribute(node.getAttribute('title'))
      if (title) title = ' "' + title + '"'
      var replacement
      var reference

      switch (options.linkReferenceStyle) {
        case 'collapsed':
          replacement = '[' + content + '][]'
          reference = '[' + content + ']: ' + href + title
          break
        case 'shortcut':
          replacement = '[' + content + ']'
          reference = '[' + content + ']: ' + href + title
          break
        default:
          var id = this.references.length + 1
          replacement = '[' + content + '][' + id + ']'
          reference = '[' + id + ']: ' + href + title
      }

      this.references.push(reference)
      return replacement
    },

    references: [],

    append: function (options: Html2OrgOptions): string {
      var references = ''
      if (this.references.length) {
        references = '\n\n' + this.references.join('\n') + '\n\n'
        this.references = [] // Reset references
      }
      return references
    }
  },
  emphasis: {
    filter: ['em', 'i'],

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      if (!content.trim()) return ''
      return options.emDelimiter + content + options.emDelimiter
    }
  },
  strong: {
    filter: ['strong', 'b'],

    replacement: function (content: string, node, options: Html2OrgOptions): string {
      if (!content.trim()) return ''
      return options.strongDelimiter + content + options.strongDelimiter
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
      var alt = cleanAttribute(node.getAttribute('alt'))
      var src = node.getAttribute('src') || ''
      var title = cleanAttribute(node.getAttribute('title'))
      var titlePart = title ? ' "' + title + '"' : ''
      return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
    }
  }
}



function cleanAttribute (attribute) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
}

export default rules
