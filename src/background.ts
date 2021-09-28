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

import { MyStorage, storageManager, objectAssignPerfectly, MyMsg } from "./common";


/** This can be modify */
const STORAGE: MyStorage = storageManager.getDefaultData()

// Storage
console.log('[background] first time to get config from storage')
storageManager.getData().then((obj) => {
    objectAssignPerfectly(STORAGE, obj)
  })

  storageManager.onDataChanged(async (changes) => {
    console.log('[background] storage changed!', changes)
    objectAssignPerfectly(STORAGE, await storageManager.getData())
})
browser.menus.create(
  {
    id: "copy-current-page-url-as-org-mode",
    title: "Copy Current Page's Title and URL as Org-Mode",
    contexts: ["page", "frame"],
    documentUrlPatterns: ["<all_urls>"],
  },
  () => {
    if (browser.runtime.lastError)
      console.log(`Error: ${browser.runtime.lastError}`)
  }
)

browser.menus.create(
  {
    id: "copy-selection-as-org-mode",
    title: "Copy Selection as Org-Mode",
    contexts: ["selection"],
    documentUrlPatterns: ["<all_urls>"],  // "https://*" not works...
  },
  () => {
    if (browser.runtime.lastError)
      console.log(`Error: ${browser.runtime.lastError}`)
  }
)

browser.menus.create(
  {
    id: "copy-link-as-org-mode",
    title: "Copy This Link as Org-Mode",
    contexts: ["link"],
    documentUrlPatterns: ["<all_urls>"],
  },
  () => {
    if (browser.runtime.lastError)
      console.log(`Error: ${browser.runtime.lastError}`)
  }
)

browser.menus.onClicked.addListener((info, tab) => {
  const tabId = tab.id
  if (tabId === undefined) { console.error('[To Developer] tab.id is undefined??? What the fuck?'); return }
  if ( info.menuItemId === "copy-selection-as-org-mode" || info.menuItemId === "copy-current-page-url-as-org-mode" ) {
    browser.tabs.executeScript(tabId, { file: "dist/copy.js" })
  } else if (info.menuItemId === "copy-link-as-org-mode") {
    browser.tabs.executeScript(tabId, { file: "dist/copy-link.js" }).then(() => {
      if (!info.linkText) { throw new TypeError('[To Developer] info.linkText is undefined') }
      if (!info.linkUrl) { throw new TypeError('[To Developer] info.linkUrl is undefined') }
      const linkText = info.linkText.replace(/([\\`*_[\]<>])/g, "\\$1")
      const linkUrl = info.linkUrl.replace(
        /[\\!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16)}`
      )
      browser.tabs.sendMessage(tabId, {
        text: `[[${linkUrl}][${linkText}]]`,  /// TODO: Rename: orgText
        html: `<a href="${linkUrl}">${linkText}</a>`,
      })
    })
  }
})

browser.browserAction.onClicked.addListener(() =>
  browser.tabs.executeScript(undefined, { file: "dist/copy.js" })
)


browser.runtime.onMessage.addListener((_msg: any) => {
  const msg = _msg as MyMsg
  if (msg.type === 'showNotification') {
    showNotification(msg.title, msg.message)
  }
})

function showNotification(title: string, message: string) {
  console.log('showNotification...')
  if (!STORAGE.showNotificationWhenCopy) {
    return
  }
  browser.notifications.create('default', {
    title: title,
    type: 'image' as any,
    iconUrl: browser.runtime.getURL("img/icon.png"),
    message: message,
  })
  console.log('showNotification finished.')
}