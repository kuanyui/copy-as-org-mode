/*!
 * Copyright (c) 2021 ono ono (kuanyui) All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0 (MPL-2.0). If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * You may not remove or alter the substance of any license notices (including
 * copyright notices, patent notices, disclaimers of warranty, or limitations of
 * liability) contained within the Source Code Form of the Covered Software,
 * except that You may alter any license notices to the extent required to
 * remedy known factual inaccuracies. (Cited from MPL - 2.0, chapter 3.3)
 */

export type my_msg_t = 'showBgNotification' | 'showInPageNotification' | 'copyStringToClipboard'
export interface MyMsg_ShowNotification {
    type: 'showBgNotification' | 'showInPageNotification',
    title: string
    message: string
}
export interface MyMsg_CopyStringToClipboard {
    type: 'copyStringToClipboard',
    org: string
    html?: string
}
export type MyMsg =
    MyMsg_ShowNotification |
    MyMsg_CopyStringToClipboard
export class msgManager {
    static sendToTab <T extends MyMsg> (tabId: number, msg: T) {
        return browser.tabs.sendMessage(tabId , msg) as Promise<T | void>
    }
    static sendToBg <T extends MyMsg> (msg: T) {
        return browser.runtime.sendMessage(msg)
    }
}



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