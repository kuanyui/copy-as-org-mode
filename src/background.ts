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

import { MyMsg, msgManager } from "./common";
import { safeDecodeURI } from "./html2org/utilities";
import { CopyAsOrgModeOptions, objectAssignPerfectly, storageManager } from "./options";


/** This can be modify */
const STORAGE: CopyAsOrgModeOptions = storageManager.getDefaultData()

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
let lastTriggerMenuTimeStamp: number = Date.now()
browser.menus.onClicked.addListener((info, tab) => {
  // console.warn('menus.onClicked ===> time delta = ', Date.now() - lastTriggerMenuTimeStamp)
  // FIXME: FUCK. I donno why Firefox even execute copy.ts in   options_ui. This is totally nonsense. Lots of shitty internal error messages but cannot be tracked in background's console. What is the worse, it sometime send multiple duplicated events without any reason out of control. And the worst is, this Date.now() are wrong between event emitted. FUCK YOU FIREFOX.
  if (Date.now() - lastTriggerMenuTimeStamp < 400) {
    console.log(`[background] workaround for firefox's   bizarre behaviour.`)
    return false
  }
  lastTriggerMenuTimeStamp = Date.now()
  const tabId = tab.id
  if (tabId === undefined) { console.error('[To Developer] tab.id is undefined???'); return }
  if ( info.menuItemId === "copy-selection-as-org-mode" || info.menuItemId === "copy-current-page-url-as-org-mode" ) {
    browser.tabs.executeScript(tabId, { file: "dist/copy.js" })
  } else if (info.menuItemId === "copy-link-as-org-mode") {
    browser.tabs.executeScript(tabId, { file: "dist/copy-link.js" }).then(() => {
      if (!info.linkText) { throw new TypeError('[To Developer] info.linkText is undefined') }
      if (!info.linkUrl) { throw new TypeError('[To Developer] info.linkUrl is undefined') }
      const linkText = info.linkText.replace(/([\\`*_[\]<>])/g, "\\$1")
      // const linkUrl = info.linkUrl.replace( /[\\!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}` )
      let linkUrl = info.linkUrl
      console.log('Options ===>', STORAGE)
      if (STORAGE.decodeUri) {
        linkUrl = safeDecodeURI(linkUrl)
      }
      bgCopyToClipboard( `[[${linkUrl}][${linkText}]]`, `<a href="${linkUrl}">${linkText}</a>` )
    })
  }
})

browser.browserAction.onClicked.addListener((tab) => {
  console.log('[DEBUG] browserAction.onclicked', tab)
  browser.tabs.executeScript(undefined, { file: "dist/copy.js" })
})


browser.runtime.onMessage.addListener((_msg: any) => {
  const msg = _msg as MyMsg
  switch (msg.type) {
    case 'showBgNotification': {
      showBgNotification(msg.title, msg.message)
      break
    }
    case 'copyStringToClipboard': {
      console.log('listener: copy request', Date.now())
      bgCopyToClipboard(msg.org, msg.html)
      break
    }
  }
})

function getDigest(str: string, maxLen: number): string {
  let final = str.substr(0, maxLen)
  if (str.length > maxLen) {
    final += '...'
  }
  return final
}
function showBgNotification(title: string, message: string) {
  console.log('showBgNotification(), method =', STORAGE.notificationMethod, Date.now(), title, message)
  if (STORAGE.notificationMethod === 'inPagePopup') {
    const safeTitle = title.replace(/[\n\r<>\\]/gi, '').replace(/["'`]/gi, "'")
    const safeMsg = message.replace(/[\n\r<>\\]/gi, '').replace(/["'`]/gi, "'")
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      for (const tab of tabs) {
        if (tab.id === undefined) { return }
        msgManager.sendToTab(tab.id, {
          type: 'showInPageNotification',
          title: title,
          message: getDigest(message, 800),
        })
      }
    })
    return
  }
  if (STORAGE.notificationMethod === 'notificationApi') {
    console.log('showBgNotification...')
    browser.notifications.create('default', {
      title: title,
      type: 'image' as any,
      iconUrl: browser.runtime.getURL("img/icon.png"),
      message: getDigest(message, 140),
    })
    console.log('showBgNotification finished.')
  }
}

/** This function is for background script only */
function bgCopyToClipboard(text: string, html?: string): boolean {
  console.log('bgCopyToClipboard()', Date.now(), 'text ===', text)
  // if (window.location.protocol.startsWith('moz')) {
  //   console.warn('in moz pages, skip.', text)
  //   // FIXME: This really confuse me... I don't know why this could happen every time opening the options_ui
  //   return false
  // }
  if (!text) {
    console.warn('text is empty, skip.', text)   // FIXME: Bug of Firefox? Shit...
    // showBgNotification('Huh?', 'Got nothing to copy... ')
    return false
  }
  if (text === 'ERROR') {
    console.warn('[bgCopyToClipboard()] text has something wrong, skip.', text)
    showBgNotification('Oops...', 'Found something cannot be processed correctly, please consider to send a bug report on GitHub.')
    return false
  }

  console.warn('[bgCopyToClipboard()] run navigator.clipboard.writeText()...')
  navigator.clipboard.writeText(text)
  showBgNotification('Org-Mode Text Copied Successfully!', text)
  return true
}



function createDebounceFn(fn: () => any, debounceDurationMs: number): () => void {
  let timeoutId: number
  return () => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      fn()
    }, debounceDurationMs)
  }
}

