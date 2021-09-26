
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
  return tagNames.indexOf(node.nodeName) >= 0
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
