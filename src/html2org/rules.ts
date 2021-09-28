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

/**
 * Manages a collection of rules used to convert HTML to Markdown
 */

import { CustomNode } from "./node"
import { Html2OrgOptions } from "./turndown"

export interface Rule {
  filter?: RuleFilter
  replacement: RuleReplacementFn
}

export type RuleReplacementFn = (content: string, node: CustomNode, options: Html2OrgOptions) => string   // FIXME: Magic.... see commonmark-rules
// ((content: string) => string) |
// ((content: string, node: CustomNode) => string) |
// ((content: string, node: CustomNode, options: Html2OrgOptions) => string)

export type RuleFilter =
  string |
  string[] |
  ((node: CustomNode, options: Html2OrgOptions) => boolean)


export default class Rules {
  options: Html2OrgOptions
  private _keep: Rule[]
  private _remove: Rule[]
  blankRule: Rule
  keepReplacement: RuleReplacementFn
  defaultRule: Rule
  array: Rule[]
  constructor(options: Html2OrgOptions) {
    this.options = options
    this._keep = []
    this._remove = []

    this.blankRule = {
      replacement: options.blankReplacement
    }

    this.keepReplacement = options.keepReplacement

    this.defaultRule = {
      replacement: options.defaultReplacement
    }
    this.array = []
    for (var key in options.rules) {
      this.array.push(options.rules[key])
    }
  }
  add (key: string, rule: Rule) {
    this.array.unshift(rule)
  }

  keep (filter: RuleFilter) {
    this._keep.unshift({
      filter: filter,
      replacement: this.keepReplacement
    })
  }

  remove (filter: RuleFilter) {
    this._remove.unshift({
      filter: filter,
      replacement: function () {
        return ''
      }
    })
  }
  /** Get rule for Node */
  forNode (node: CustomNode): Rule {
    if (node.isBlank) { return this.blankRule }

    let rule
    if ((rule = findRule(this.array, node, this.options))) { return rule }
    if ((rule = findRule(this._keep, node, this.options))) { return rule }
    if ((rule = findRule(this._remove, node, this.options))) { return rule }

    return this.defaultRule
  }

  forEach (fn: (rule: Rule, ruleIndex: number) => any) {
    for (var i = 0;i < this.array.length;i++) {
      fn(this.array[i], i)
    }
  }
}

function findRule (rules: Rule[], node: CustomNode, options: Html2OrgOptions) {
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i]
    if (filterValue(rule, node, options)) return rule
  }
  return void 0
}

function filterValue (rule: Rule, node: CustomNode, options: Html2OrgOptions) {
  var filter = rule.filter
  if (typeof filter === 'string') {
    if (filter === node.nodeName.toLowerCase()) return true
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
  } else if (typeof filter === 'function') {
    if (filter.call(rule, node, options)) return true
  } else {
    throw new TypeError('`filter` needs to be a string, array, or function')
  }
}
