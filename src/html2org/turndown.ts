import COMMONMARK_RULES from './commonmark-rules'
import Rules, { Rule, RuleFilter, RuleReplacementFn } from './rules'
import { trimLeadingNewlines, trimTrailingNewlines } from './utilities'
import RootNode from './root-node'
import CustomNodeConstructor, { CustomNode } from './node'
import { isTable, replacementForTable } from './table'
var escapes: [RegExp, string][] = [
  [/\\/g, '\\\\'],
  [/\*/g, '\\*'],
  [/^-/g, '\\-'],
  [/^\+ /g, '\\+ '],
  [/^(=+)/g, '\\$1'],
  [/^(#{1,6}) /g, '\\$1 '],
  [/`/g, '\\`'],
  [/^~~~/g, '\\~~~'],
  [/\[/g, '\\['],
  [/\]/g, '\\]'],
  [/^>/g, '\\>'],
  [/_/g, '\\_'],
  [/^(\d+)\. /g, '$1\\. ']
]

/** -, _, or * repeated > 3 times */
type h2o_heading_marker_t = '*'
type h2o_hr_t = `-----`
type h2o_ul_marker_t = '-' | '+'
type h2o_ol_marker_t = '.' | ')'
type h2o_code_delimiter_t = '=' | '~'
type h2o_code_block_style_t = 'beginEnd' | 'colon'
type h2o_italic_delimiter_t = '/'
type h2o_bold_delimiter_t = '*'
type h2o_underline_delimiter_t = '_'
type h2o_strike_delimiter_t = '+'
type h2o_link_style_t = 'inlined' | 'referenced'  // TODO: NOT IMPLEMENTED YET
type h2o_link_ref_style_t = `full` | `collapsed` | `shortcut`  // TODO: NOT IMPLEMENTED YET
type h2o_preformatted_code_t = boolean
type h2o_list_indent_size_t = number

export interface Html2OrgOptions {
  rules: Record<string, Rule>,
  headingMarker: h2o_heading_marker_t,
  hr: h2o_hr_t,
  listIndentSize: h2o_list_indent_size_t,
  unorderedListMarker: h2o_ul_marker_t,
  orderedListMarker: h2o_ol_marker_t,
  codeBlockStyle: h2o_code_block_style_t,
  italicDelimiter: h2o_italic_delimiter_t,
  boldDelimiter: h2o_bold_delimiter_t,
  underlineDelimiter: h2o_underline_delimiter_t,
  strikeDelimiter: h2o_strike_delimiter_t,
  codeDelimiter: h2o_code_delimiter_t,
  linkStyle: h2o_link_style_t,
  linkReferenceStyle: h2o_link_ref_style_t,
  br: '  ',
  preformattedCode: false,
  blankReplacement: RuleReplacementFn
  keepReplacement: RuleReplacementFn
  defaultReplacement: RuleReplacementFn
}

const DEFAULT_OPTION: Readonly<Html2OrgOptions> = {
  rules: COMMONMARK_RULES,
  headingMarker: '*',
  hr: '-----',
  listIndentSize: 2,
  unorderedListMarker: '-',
  orderedListMarker: '.',
  codeDelimiter: '=',
  underlineDelimiter: '_',
  strikeDelimiter: '+',
  codeBlockStyle: 'beginEnd',
  italicDelimiter: '/',
  boldDelimiter: '*',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
  br: '  ',
  preformattedCode: false,
  blankReplacement: function (content, node) {
    return node.isBlock ? '\n\n' : ''
  },
  keepReplacement: function (content, node) {
    return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML
  },
  defaultReplacement: function (content, node) {
    return node.isBlock ? '\n\n' + content + '\n\n' : content
  }
} as const

export default class TurndownService {
  options: Html2OrgOptions
  rules: Rules
  constructor(options?: Partial<Html2OrgOptions>) {
    this.options = Object.assign({}, DEFAULT_OPTION, options)
    this.rules = new Rules(this.options)
  }
  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {String|HTMLElement} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type String
   */

  turndown (input: string | HTMLElement) {
    if (!canConvert(input)) {
      throw new TypeError(
        input + ' is not a string, or an element/document/fragment node.'
      )
    }

    if (input === '') { return '' }

    var output = this.processChildrenOfNode(RootNode(input, this.options))
    return this.postProcess(output)
  }
  /**
  * Reduces a DOM node down to its Markdown string equivalent
  * @param {HTMLElement} parentNode The node to convert
  * @returns A Markdown representation of the node
  * @type String
  */
  processChildrenOfNode (parentNode: Node): string {
    let output: string = ''
    for (const node of parentNode.childNodes) {
      const customNode = CustomNodeConstructor(node, this.options)
      let replacement: string = ''
      if (customNode.nodeType === Node.TEXT_NODE) {
        replacement = customNode.isCode ? customNode.nodeValue || '' : this.escape(customNode.nodeValue || '')
      } else if (customNode.nodeType === Node.ELEMENT_NODE) {
        replacement = this.replacementForNode(customNode)
      }
      output = join(output, replacement)
    }
    return output
  }
  /**
   * Converts an element node to its Markdown equivalent.
   *
   * Apply suitable rule on Node.
   *
   * @param {HTMLElement} node The node to convert
   * @returns **A Markdown representation of the node**
   * @type String
   */
  replacementForNode(node: CustomNode): string {
    if (isTable(node)) {
      return replacementForTable(this, node)
    }
    var rule = this.rules.forNode(node)
    var content = this.processChildrenOfNode(node)
    var whitespace = node.flankingWhitespace
    if (whitespace.leading || whitespace.trailing) { content = content.trim() }
    return (
      whitespace.leading +
      rule.replacement(content, node, this.options) +
      whitespace.trailing
    )
  }
  /**
 * Appends strings as each rule requires and trims the output
 * @private
 * @param {String} output The conversion output
 * @returns A trimmed version of the ouput
 * @type String
 */
  private postProcess (output: string): string {
    // this.rules.forEach((rule) => {
    //   if (typeof rule.append === 'function') {  // I didn't find any document about `Rule.append` nor find any reference to this symbol, so remove this
    //     output = join(output, rule.append(this.options))
    //   }
    // })

    return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '')
  }



  /**
   * Add one or more plugins
   *
   * Use a plugin, or an array of plugins. Example:
   * ```js
   * // Import plugins from turndown-plugin-gfm
   * var turndownPluginGfm = require('turndown-plugin-gfm')
   * var gfm = turndownPluginGfm.gfm
   * var tables = turndownPluginGfm.tables
   * var strikethrough = turndownPluginGfm.strikethrough
   *
   * // Use the gfm plugin
   * turndownService.use(gfm)
   *
   * // Use the table and strikethrough plugins only
   * turndownService.use([tables, strikethrough])
   * ```
   *
   * `use` returns the `TurndownService` instance for chaining.
   *
   * @public
   * @param {Function|Array} plugin The plugin or array of plugins to add
   * @returns The Turndown instance for chaining
   * @type Object
   */

  use<F extends (instance: TurndownService) => any> (plugin: F | F[]) {
    if (Array.isArray(plugin)) {
      for (var i = 0; i < plugin.length; i++) this.use(plugin[i])
    } else if (typeof plugin === 'function') {
      plugin(this)
    } else {
      throw new TypeError('plugin must be a Function or an Array of Functions')
    }
    return this
  }

  /**
   * Adds a rule
   *
   * The `key` parameter is a unique name for the rule for easy reference. Example:
   *
   * ```js
   * turndownService.addRule('strikethrough', {
   *   filter: ['del', 's', 'strike'],
   *   replacement: function (content) {
   *     return '~' + content + '~'
   *   }
   * })
   * ```
   *
   * `addRule` returns the `TurndownService` instance for chaining.
   *
   * See **Extending with Rules** in README
   *
   * @public
   * @param {String} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  addRule (key: string, rule: Rule) {
    this.rules.add(key, rule)
    return this
  }

  /**
   * Keep a node (as HTML) that matches the filter
   *
   * Determines which elements are to be kept and rendered as HTML. By default,
   * Turndown does not keep any elements. The filter parameter works like a rule
   * filter (see section on filters belows). Example:
   *
   * ```js
   * turndownService.keep(['del', 'ins'])
   * turndownService.turndown('<p>Hello <del>world</del><ins>World</ins></p>') // 'Hello <del>world</del><ins>World</ins>'
   * ```
   *
   * This will render `<del>` and `<ins>` elements as HTML when converted.
   *
   * `keep` can be called multiple times, with the newly added keep filters
   * taking precedence over older ones. Keep filters will be overridden by the
   * standard CommonMark rules and any added rules. To keep elements that are
   * normally handled by those rules, add a rule with the desired behaviour.
   *
   * `keep` returns the `TurndownService` instance for chaining.
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  keep (filter: RuleFilter) {
    this.rules.keep(filter)
    return this
  }

  /**
   * Remove a node that matches the filter Determines which elements are to be
   * removed altogether i.e. converted to an empty string. By default, Turndown
   * does not remove any elements. The filter parameter works like a rule filter
   * (see section on filters belows). Example:
   *
   * ```js
   * turndownService.remove('del')
   * turndownService.turndown('<p>Hello <del>world</del><ins>World</ins></p>') // 'Hello World'
   * ```
   *
   * This will remove `<del>` elements (and contents).
   *
   * `remove` can be called multiple times, with the newly added remove filters
   * taking precedence over older ones. Remove filters will be overridden by the
   * keep filters,  standard CommonMark rules, and any added rules. To remove
   * elements that are normally handled by those rules, add a rule with the
   * desired behaviour.
   *
   * `remove` returns the `TurndownService` instance for chaining.
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  remove (filter: RuleFilter) {
    this.rules.remove(filter)
    return this
  }

  /**
   * Escapes Markdown syntax
   * @public
   * @param {String} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type String
   */

  escape (str: string) {
    return escapes.reduce(function (accumulator: string, escape) {
      return accumulator.replace(escape[0], escape[1])
    }, str)
  }
}


/**
 * Joins replacement to the current output with appropriate number of new lines
 * @private
 * @param {String} output The current conversion output
 * @param {String} replacement The string to append to the output
 * @returns Joined output
 * @type String
 */

function join (output: string, replacement: string) {
  var s1 = trimTrailingNewlines(output)
  var s2 = trimLeadingNewlines(replacement)
  var nls = Math.max(output.length - s1.length, replacement.length - s2.length)
  var separator = '\n\n'.substring(0, nls)

  return s1 + separator + s2
}

/**
 * Determines whether an input can be converted
 * @private
 * @param {String|HTMLElement} input Describe this parameter
 * @returns Describe what it returns
 * @type String|Object|Array|Boolean|Number
 */

function canConvert (input: string | HTMLElement): String|Object|Array<any>|Boolean|Number {
  return (
    input !== null && (
      typeof input === 'string' ||
      (input.nodeType && (
        input.nodeType === Node.ELEMENT_NODE ||
        input.nodeType === Node.DOCUMENT_NODE ||
        input.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ))
    )
  )
}
