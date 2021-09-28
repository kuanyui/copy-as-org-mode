/**
 * MIT License
 *
 * Copyright (c) 2021 ono ono (kuanyui)
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

export type my_msg_t = 'showNotification'
export interface MyMsg_ShowNotification {
    type: 'showNotification',
    title: string
    message: string
}
export type MyMsg = MyMsg_ShowNotification

export class msgManager {
    static sendToTab <T extends MyMsg> (tabId: number, msg: T) {
        return browser.tabs.sendMessage(tabId, msg) as Promise<T | void>
    }
    static sendToBg <T extends MyMsg> (msg: T) {
        return browser.runtime.sendMessage(msg)
    }
}


export type list_indent_t = number
export type ul_mark_t = '-' | '+'
export type ol_mark_t = '.' | ')'
export type code_mark_t = '=' | '~'
export type codeblock_style_t = 'colon' | 'beginEnd'
export type source_link_insert_pos_t = 'prepend' | 'append'
export type source_link_text_fmt_t =
    `${string}%t${string}%u${string}` |
    `${string}%u${string}%t${string}` |
    `${string}%t${string}` |
    `${string}%u${string}`

export interface MyStorage {
    /** Indent size for nested list item */
    listIndentSize: list_indent_t,
    /** The character of `ul > li` in Org-mode */
    ulBulletChar: ul_mark_t
    /** The character of `ul > li` in Org-mode */
    olBulletChar: ol_mark_t
    /** The character to mark `<code>`in Org-mode */
    codeChar: code_mark_t
    /** #+begin_src or : colon */
    codeBlockStyle: codeblock_style_t
    /** Replace angle brackets (`<>`) with HTML entities< */
    escapeHtmlEntities: boolean
    /** When copy selection, insert the link of current page as source reference. */
    insertReferenceLink: {
        enabled: boolean,
        pos: source_link_insert_pos_t,
        format: source_link_text_fmt_t
    }
    /** Remove matched string or RegExp pattern in the title */
    titleBlackList: string
    convertImageAsDataUrl: boolean,
    /** NOTE: Add this option because it seems browser.notifications may freezed browser... Donno why... */
    showNotificationWhenCopy: boolean
}


type TypedStorageChange<T> = {
    oldValue: T
    newValue: T
}
/** Strong typed version ChangeDict for WebExtension (e.g. browser.storage.onChanged).
 * T is the custom storage interface
 */
type TypedChangeDict<T> = { [K in keyof T]: TypedStorageChange<T[K]> }


export function objectAssignPerfectly<T>(target: T, newValue: T) {
    return Object.assign(target, newValue)
}
export function deepCopy<T>(x: T): T {
    return JSON.parse(JSON.stringify(x))
}

export function storageSetSync (d: Partial<MyStorage>): void {
    browser.storage.sync.set(d)
}

class StorageManager {
    area: browser.storage.StorageArea
    constructor() {
        // Firefox for Android (90) doesn't support `sync` area yet,
        // so write a fallback for it.
        if (browser.storage.sync) {
            this.area = browser.storage.sync
        } else {
            this.area = browser.storage.local
        }
    }
    getDefaultData(): MyStorage {
        return {
            listIndentSize: 2,
            ulBulletChar: '-',
            olBulletChar: '.',
            codeChar: '=',
            codeBlockStyle: 'beginEnd',
            escapeHtmlEntities: false,
            insertReferenceLink: {
                enabled: false,
                pos: 'append',
                format: `-----\nReference: [[%t][%u]]`
            },
            titleBlackList: '',
            convertImageAsDataUrl: false,
            showNotificationWhenCopy: false,
        }
    }
    /** Set data object (can be partial) into LocalStorage. */
    setData(d: Partial<MyStorage>): void {
        this.area.set(deepCopy(d))
    }
    /** Get data object from LocalStorage */
    getData(): Promise<MyStorage> {
        return this.area.get().then((_d) => {
            const d = _d as unknown as MyStorage
            if (!d) {
                const defaultValue = storageManager.getDefaultData()
                storageManager.setData(defaultValue)
                return defaultValue
            }
            return Object.assign(storageManager.getDefaultData(), d)
        }).catch((err) => {
            console.error('Error when getting settings from browser.storage:', err)
            return storageManager.getDefaultData()
        })
    }
    onDataChanged(cb: (changes: TypedChangeDict<MyStorage>) => void) {
        browser.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync' || areaName === 'local') {
                cb(changes as TypedChangeDict<MyStorage>)
            }
        })
    }
}
export const storageManager = new StorageManager()


export function copyToClipboard(text: string, html: string): boolean {
    if (window.location) {
        if (window.location.protocol.startsWith('moz')) {  // FIXME: Donno why this is possible...
            return false
        }
        if (window.location.protocol === 'http:') {
            window.alert('Cannot Copy: Due to the limitation of WebExtension & Firefox, only HTTPS page supports clipboard. Sorry.')
            msgManager.sendToBg({
                type: "showNotification",
                title: 'Cannot Copy',
                message: 'Due to the limitation of WebExtension & Firefox, only HTTPS page supports clipboard. Sorry.',
            })
            return false
        }
    }
    if (text === 'ERROR') {
        msgManager.sendToBg({
            type: "showNotification",
            title: 'Oops...',
            message: 'Found something cannot be processed correctly, please consider to send a bug report on GitHub.',
        })
        return false
    }
    // var textBlob = new Blob([text], { type: 'text/plain' });
    // var htmlBlob = new Blob([html], { type: 'text/html' });
    // var data = [
    //     new ClipboardItem({ 'text/plain': Promise.resolve(textBlob) }),
    //     new ClipboardItem({ 'text/html': Promise.resolve(htmlBlob) })
    // ];
//
    // navigator.clipboard.write(data).then(
    //     function () {
    //     /* success */
    //     },
    //     function () {
    //     /* failure */
    //     }
    // );
    msgManager.sendToBg({
        type: "showNotification",
        title: 'Success!',
        message: 'Org-Mode Text Copied!',
    })
    navigator.clipboard.writeText(text)
    return true
  };

export function imgToCanvasToDataUrl (imgEl: HTMLImageElement): Promise<string> {
    return new Promise((resolve) => {
      let img = new Image();
      img.setAttribute("crossorigin", "anonymous") // TODO: What is this?
      img.onload = function () {
        let canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        imgEl.setAttribute("src", canvas.toDataURL("image/png"));
        resolve(imgEl.src)
      }
    })
  }
export function sleep(ms: number): Promise<boolean> {
    return new Promise((resolve) => {
        window.setTimeout(() => resolve(true), ms)
    })
}

function safeFetch(url: string, opts?: RequestInit): Promise<Response> {
    const abortCtrl = new AbortController()
    if (!opts) { opts = {} }
    opts.signal = abortCtrl.signal
    return Promise.race([
        fetch(url, opts).then(r => r).catch(err => {
            if (err && err.type === 'aborted') {  // aborted by AbortController
                return undefined as unknown as Response
            }
            console.log('[safeFetch] error, retry.', err)
            return safeFetch(url, opts)
        }),
        sleep(8000).then(_ => null)
    ]).then(r => {
        if (r === null) {
            console.log('[safeFetch] timeout (8s), abort the previous request and retry.')
            abortCtrl.abort()
            return safeFetch(url, opts)
        } else {
            return r
        }
    })
}

export async function fetchResourceAsDataUrl(url: string): Promise<string> {
    console.log(`fetching image ${url}`)
    const res = await safeFetch(url)
    const arrBuf = await res.arrayBuffer()
    const contentType = await res.headers.get('content-type');
    const base64 = arrayBufferToBase64(arrBuf)
    const dataUrl = `data:${contentType};base64,` + base64
    return dataUrl
}

function arrayBufferToBase64(arrBuf: ArrayBuffer) {
    var binary = '';
    var bytes = new Uint8Array(arrBuf)
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}