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

export function repeat (character: string, count: number) {  // REFACTOR: use padLeft
  return Array(count + 1).join(character)
}

export function trimLeadingNewlines (str: string) {
  return str.replace(/^\n*/, '')
}

export function trimTrailingNewlines (str: string) {
  // avoid match-at-end regexp bottleneck, see #370
  var indexEnd = str.length
  while (indexEnd > 0 && str[indexEnd - 1] === '\n') indexEnd--
  return str.substring(0, indexEnd)
}

export let blockElements = [
  'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS',
  'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
  'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
  'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES',
  'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD',
  'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
]

export let voidElements = [
  'AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT',
  'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
]

export function isBlock(node: Node) {
  return is(node, blockElements)
}

export function isVoid (node: Node) {
  return is(node, voidElements)
}

export function hasVoid (node: Node) {
  return has(node, voidElements)
}

var meaningfulWhenBlankElements = [
  'A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT',
  'AUDIO', 'VIDEO'
]

export function isMeaningfulWhenBlank (node: Node) {
  return is(node, meaningfulWhenBlankElements)
}

export function hasMeaningfulWhenBlank (node: Node) {
  return has(node, meaningfulWhenBlankElements)
}

function is (node: Node, tagNames: string[]) {
  return tagNames.includes(node.nodeName)
}

function has(node: Node, tagNames: string[]) {
  const el: HTMLElement = node as HTMLElement
  return (
    el.getElementsByTagName &&
    tagNames.some(function (tagName) {
      return el.getElementsByTagName(tagName).length
    })
  )
}

/**
 *
 * @param textContent
 * @param node
 * @param delimiterMark
 * @param supportMultipleLines Some tags cannot include \n in Org-mode. (ex:
 * =code=). And though *bold* supports multiple line, they still cannot contains
 * multiple \n in a row. And the single \n will be replaced with a space.
 * @returns
 */
export function wrapInlineMarkWithSpace(textContent: string, node: Node, delimiterMark: string): string {
  // if (!supportMultipleLines) {
  //   textContent = textContent.replace(/\r?\n|\r/g, ' ')
  // }
  textContent = textContent.trim()
  if (textContent === '') { return '' }
  let lSpace = ''
  let rSpace = ''
  const previous = node.previousSibling
  if (previous && !previous.textContent!.endsWith(' ')) {
    lSpace = ' '
  }
  const next = node.nextSibling
  if (next && !next.textContent!.endsWith(' ')) {
    rSpace = ' '
  }
  const ch = delimiterMark
  return  lSpace + ch + textContent + ch + rSpace
}

/**
 *
 * @param nodeOfPre: node of `<pre>`
 * @return if not a code block, return empty string.
 */
export function judgeCodeblockLanguage(nodeOfPre: Node): string {
  let langId: string = ''
  const preEl = nodeOfPre as HTMLPreElement
  langId = guessLangId(preEl.className)
  if (langId) { return langId }
  const parentEl = nodeOfPre.parentElement!
  langId = guessLangId(parentEl.className)
  if (langId) { return langId }
  const firstChildEl = nodeOfPre.firstChild as HTMLElement
  if (firstChildEl && firstChildEl.nodeType === Node.ELEMENT_NODE) {
    langId = guessLangId(firstChildEl.className)
    if (langId) { return langId }
  }
  // search parents in a paranoid way
  for (const classPatt of ['highlight', 'lang']) {
    const el = preEl.closest(`[class*=${classPatt}]`)
    if (el) {
      langId = guessLangId(el.className)
      if (langId) { return langId }
    }
  }
  return ''
}

function guessLangId(cssClassName: string): string {
  for (const id in LANGS) {
    const _patt: string = LANGS[id]
    const patt = new RegExp(`\\b${_patt}\\b`)
    if (cssClassName.match(patt)) {
      console.log('Guessed!', id, cssClassName)
      return id
    }
  }
  return ''
}

const LANGS: Record<string, string> = {
  "bash": "bash|sh|zsh|shell",
  "clojure": "clojure|clj",
  "coffee": "coffee|coffeescript|cson|iced",
  "css": "css",
  "dart": "dart",
  "erl": "erl|erlang",
  "haskell": "hs|haskell",
  "html": "html|xml|xsl|xhtml|rss|atom|xjb|xsd|plist|wsf|svg",
  "http": "http|https",
  "ini": "ini|toml",
  "java": "java|jsp",
  "js": "js|javascript|jsx|mjs|cjs",
  "json": "json",
  "kotlin": "kotlin|kt",
  "latex": "latex|tex",
  "less": "less",
  "lisp": "lisp",
  "lua": "lua",
  "makefile": "makefile|mk|mak",
  "markdown": "markdown|md|mkdown|mkd",
  "matlab": "matlab",
  "objectivec": "objectivec|mm|objc|obj-c",
  "ocaml": "ocaml|ml",
  "pascal": "pascal|delphi|dpr|dfm|pas|freepascal|lazarus|lpr|lfm",
  "pl": "pl|perl|pm",
  "php": "php",
  "protobuf": "protobuf",
  "py": "py|python|gyp|ipython",
  "r": "r",
  "rb": "rb|ruby|gemspec|podspec|thor|irb",
  "rs": "rs|rust",
  "scala": "scala",
  "scheme": "scheme",
  "scss": "scss",
  "shell": "shell|console",
  "sql": "sql",
  "swift": "swift",
  "typescript": "typescript|ts",
  "vhdl": "vhdl",
  "vbnet": "vbnet|vb",
  "yaml": "yaml|yml",
  "cs": "cs|csharp|c#",
  "c": "c|h|cpp|hpp|c[+][+]|h[+][+]|cc|hh|cxx|hxx|c-like",
  "go": "go|golang",
}