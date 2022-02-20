/*!
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

import { msgManager, MyMsg } from "./common";
import { getSelectionAndConvertToOrgMode } from "./converter/selection";
import { exceptionSafeDecodeURI } from "./html2org/utilities";
import { inPageNotify } from "./inpage-notify";
import { source_link_text_fmt_t, storageManager } from "./options";

browser.runtime.onMessage.addListener((_msg: any) => {
  const msg: MyMsg = _msg
  if (msg.type === 'showInPageNotification') {
    inPageNotify(msg.title, msg.message)
  }
})

console.warn('copy.ts executed')
async function main() {
  try {
    console.log('main() in copy.ts')
    let options = await storageManager.getData()
    let title = document.title;
    if (options.titleBlackList !== "") {
      title = replaceTitleBlackList(title, options.titleBlackList);
    }
    let url = document.URL
    if (options.decodeUri) {
      url = exceptionSafeDecodeURI(url)
    }
    /** Unused currently, actually */
    let htmlLink = `<a href="${url}">${title}</a>`;
    let text = ''
    const result = await getSelectionAndConvertToOrgMode(options)
    // console.log('selection result', result)
    // If no selection found, copy the link of current page
    if (result.output === "") {
      const orgLink = getFormattedLink(title, url, '[[%url%][%title%]]')
      msgManager.sendToBg({
        type: 'copyStringToClipboard',
        org: orgLink,
        html: htmlLink
      })
      return
    } else {
      const ref = getFormattedLink(title, url, options.insertReferenceLink.format)
      if (options.insertReferenceLink.enabled) {
        if (options.insertReferenceLink.pos === 'append') {
          text = result.output + '\n\n' + ref
        } else {
          text = ref + '\n\n' + result.output
        }
        htmlLink += `<br><br><blockquote>${result.html}</blockquote>`;
      } else {
        text = result.output;
        htmlLink = result.html;
      }
      msgManager.sendToBg({
        type: 'copyStringToClipboard',
        org: text,
        html: htmlLink
      })
      return
    }

  } catch (e) {
    console.error(e);
  }
}

main();

function getFormattedLink(title: string, url: string, template: source_link_text_fmt_t): string {
  let weekdayFmt: Intl.DateTimeFormatOptions['weekday'] = 'short'  // 'Sat'
  if (navigator.language.match(/^(ja|zh)/)) {
    weekdayFmt = 'narrow'  // '土'
  }
  const d = new Date()
  const YYYY = d.getFullYear() // YYYY
  const MM = (d.getMonth() + 1).toString().padStart(2, '0') // 0-11
  const DD = d.getDate().toString().padStart(2, '0')        // 1-31
  const HH = d.getHours().toString().padStart(2, '0')       // 0-23
  const mm = d.getSeconds().toString().padStart(2, '0')     // 0-59
  const ss = d.getSeconds().toString().padStart(2, '0')     // 0-59
  const dd = d.toLocaleString("default", { weekday: weekdayFmt })
  const fmttedDate = `${YYYY}-${MM}-${DD} ${dd}`
  const fmttedTime = `${HH}:${mm}`
  const fmttedDatTime = fmttedDate + ' ' + fmttedTime
  let s: string = template
  s = s.replaceAll('%title%', title)
  s = s.replaceAll('%url%', url)
  s = s.replaceAll('%date%', fmttedDate)
  s = s.replaceAll('%datetime%', fmttedDatTime)
  return s
}

