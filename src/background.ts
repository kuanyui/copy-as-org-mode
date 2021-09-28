import { MyStorage, storageManager, objectAssignPerfectly, MyMsg } from "./common";


/** This can be modify */
const STORAGE: MyStorage = storageManager.getDefaultData()

// Storage
console.log('[background] first time to get config from storage')
storageManager.getData().then((obj) => {
    objectAssignPerfectly(STORAGE, obj)
})

storageManager.onDataChanged((changes) => {
    console.log('[background] storage changed!', changes)
    STORAGE.ulBulletChar = changes.ulBulletChar.newValue
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
    documentUrlPatterns: ["<all_urls>"],
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
    if (
      info.menuItemId === "copy-selection-as-org-mode" ||
      info.menuItemId === "copy-current-page-url-as-org-mode"
    ) {
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
  }
)

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
  browser.notifications.create('default', {
    title: title,
    type: 'image' as any,
    iconUrl: browser.extension.getURL("img/icon.png"),
    message: message,
})
}