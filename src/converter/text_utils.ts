/**
 * This file is derived from copy-selection-as-markdown by 0x6b
 * @see https://github.com/0x6b/copy-selection-as-markdown
 *
 * MIT License
 *
 * Copyright (c) 2021 ono ono (kuanyui)
 * Copyright (c) 2017-2019 0x6b
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


function replaceTitleBlackList(title: string, blackList: string): string {
    let newTitle: string = title
    for (const line of blackList.split('\n')) {
      const isRegExp = line.match(/^\/(.+)\/([ig]*)$/)
      if (isRegExp) {
        const exp = isRegExp[1]
        const flag = isRegExp[2]
        newTitle = newTitle.replace(new RegExp(exp, flag), '')
      } else {
        newTitle = newTitle.replace(new RegExp(line, 'g'), '')
      }
    }
    return newTitle
  }

  function escapeHtmlEntities (str: string) {
    return (
      str
        // Escape backslash escapes!
        .replace(/\\(\S)/g, "\\\\$1")

        // Escape headings
        .replace(/^(#{1,6} )/gm, "\\$1")

        // Escape hr
        .replace(/^([-*_] *){3,}$/gm, function (match, character) {
          return match.split(character).join("\\" + character);
        })

        // Escape ol bullet points
        .replace(/^(\W* {0,3})(\d+)\. /gm, "$1$2\\. ")

        // Escape ul bullet points
        .replace(/^([^\\\w]*)[*+-] /gm, function (match) {
          return match.replace(/([*+-])/g, "\\$1");
        })

        // Escape blockquote indents
        .replace(/^(\W* {0,3})> /gm, "$1\\> ")

        // Escape em/strong *
        .replace(/\*+(?![*\s\W]).+?\*+/g, function (match) {
          return match.replace(/\*/g, "\\*");
        })

        // Escape em/strong _
        .replace(/_+(?![_\s\W]).+?_+/g, function (match) {
          return match.replace(/_/g, "\\_");
        })

        // Escape code _
        .replace(/`+(?![`\s\W]).+?`+/g, function (match) {
          return match.replace(/`/g, "\\`");
        })

        // Escape link brackets
        .replace(/[\[\]]/g, "\\$&")

        // Replace angle brackets
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    );
  };