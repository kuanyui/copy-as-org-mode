/**
 * This file is derived from copy-selection-as-markdown by 0x6b
 * https://github.com/0x6b/copy-selection-as-markdown
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

import { copyToClipboard, MyStorage, storageManager } from "./common";
import { convertSelectionToOrgMode } from "./converter/converter";

async function main() {
  try {
    console.log('main() in copy.ts')
    let options = await storageManager.getData()
    let title = document.title;
    if (options.titleBlackList !== "") {
      title = replaceTitleBlackList(title, options.titleBlackList);
    }
    const url = document.URL
    let ref = getFormattedReferenceLink(title, url, options)
    let html = `<a href="${document.URL}">${title}</a>`;
    let text = ''
    const result = await convertSelectionToOrgMode(options)
    // console.log('Selection ===>', selection)
    if (result.output !== "") {
      if (options.insertReferenceLink.enabled) {
        if (options.insertReferenceLink.pos === 'append') {
          text = result.output + '\n\n' + ref
        } else {
          text = ref + '\n\n' + result.output
        }
        html += `<br><br><blockquote>${result.html}</blockquote>`;
      } else {
        text = result.output;
        html = result.html;
      }
    }
    copyToClipboard(text, html);
  } catch (e) {
    console.error(e);
  }
}

main();

function getFormattedReferenceLink(title: string, url: string, options: MyStorage): string {
  const template = options.insertReferenceLink.format
  let s: string = template
  s = s.replaceAll('%t', title)
  s = s.replaceAll('%u', url)
  return s
}