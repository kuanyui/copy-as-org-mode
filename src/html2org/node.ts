import { Html2OrgOptions } from './turndown'
import { isBlock, isVoid, hasVoid, isMeaningfulWhenBlank, hasMeaningfulWhenBlank } from './utilities'

export interface CustomNode extends HTMLElement {
  isBlock: boolean
  isCode: boolean
  isBlank: boolean
  flankingWhitespace: {
    leading: string,
    trailing: string
  }
  parentNode: CustomNode
}
export default function CustomNodeConstructor(node: Node, options: Html2OrgOptions): CustomNode {
  const _node: CustomNode = node as unknown as CustomNode
  _node.isBlock = isBlock(node)
  _node.isCode = node.nodeName === 'CODE' || _node.parentNode.isCode
  _node.isBlank = isBlank(node)
  _node.flankingWhitespace = flankingWhitespace(_node, options)
  return _node
}


function isBlank (node: Node) {
  return (
    !isVoid(node) &&
    !isMeaningfulWhenBlank(node) &&
    /^\s*$/i.test(node.textContent || '') &&
    !hasVoid(node) &&
    !hasMeaningfulWhenBlank(node)
  )
}

function flankingWhitespace (node: CustomNode, options: Html2OrgOptions) {
  if (node.isBlock || (options.preformattedCode && node.isCode)) {
    return { leading: '', trailing: '' }
  }

  var edges = edgeWhitespace(node.textContent || '')

  // abandon leading ASCII WS if left-flanked by ASCII WS
  if (edges.leadingAscii && isFlankedByWhitespace('left', node, options)) {
    edges.leading = edges.leadingNonAscii
  }

  // abandon trailing ASCII WS if right-flanked by ASCII WS
  if (edges.trailingAscii && isFlankedByWhitespace('right', node, options)) {
    edges.trailing = edges.trailingNonAscii
  }

  return { leading: edges.leading, trailing: edges.trailing }
}

function edgeWhitespace (str: string) {
  var m = str.match(/^(([ \t\r\n]*)(\s*))[\s\S]*?((\s*?)([ \t\r\n]*))$/)
  if (!m) {throw new Error('[To Developer] What is this?')}
  return {
    leading: m[1], // whole string for whitespace-only strings
    leadingAscii: m[2],
    leadingNonAscii: m[3],
    trailing: m[4], // empty for whitespace-only strings
    trailingNonAscii: m[5],
    trailingAscii: m[6]
  }
}

function isFlankedByWhitespace (side: 'left' | 'right', node: Node, options: Html2OrgOptions) {
  var sibling
  var regExp
  var isFlanked

  if (side === 'left') {
    sibling = node.previousSibling
    regExp = / $/
  } else {
    sibling = node.nextSibling
    regExp = /^ /
  }

  if (sibling) {
    if (sibling.nodeType === 3) {
      isFlanked = regExp.test(sibling.nodeValue || '')
    } else if (options.preformattedCode && sibling.nodeName === 'CODE') {
      isFlanked = false
    } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
      isFlanked = regExp.test(sibling.textContent || '')
    }
  }
  return isFlanked
}
