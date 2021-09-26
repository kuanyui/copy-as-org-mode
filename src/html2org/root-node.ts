import collapseWhitespace from './collapse-whitespace'
import { Html2OrgOptions } from './turndown'
import { isBlock, isVoid } from './utilities'

export default function RootNode (input: string | Node, options: Html2OrgOptions): Node {
  var root
  if (typeof input === 'string') {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + input + '</x-turndown>',
      'text/html'
    )
    root = doc.getElementById('turndown-root')
  } else {
    root = input.cloneNode(true)
  }
  if (!root) { throw new Error('ERROR: Why root node is not existed?') }
  collapseWhitespace({
    element: root,
    isBlock: isBlock,
    isVoid: isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  })

  return root
}
let _htmlParser: DOMParser
function htmlParser () {
  _htmlParser = _htmlParser || new window.DOMParser()
  return _htmlParser
}

function isPreOrCode (node: Node) {
  return node.nodeName === 'PRE' || node.nodeName === 'CODE'
}
