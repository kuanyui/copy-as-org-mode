export type list_bullet_char_t = '-' | '*' | '+'
export type code_char_t = '=' | '~'
export type source_link_insert_pos_t = 'prepend' | 'append'
export type source_link_text_fmt_t =
    `${string}%t${string}%u${string}` |
    `${string}%u${string}%t${string}` |
    `${string}%t${string}` |
    `${string}%u${string}`

export interface MyStorage {
    /** The character of `ul > li` in Org-mode */
    listBulletChar: list_bullet_char_t
    /** The character to mark `<code>`in Org-mode */
    codeChar: code_char_t
    /** Replace angle brackets (`<>`) with HTML entities< */
    escapeHtmlEntities: boolean
    /** When copy selection, insert the link of current page as source reference. */
    insertReferenceLink: {
        enabled: boolean,
        pos: source_link_insert_pos_t,
        format: source_link_text_fmt_t
    }
    /** Remove matched string or RegExp in the title */
    titleBlackList: string
    convertImageAsDataUrl: boolean
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
            listBulletChar: '-',
            codeChar: '=',
            escapeHtmlEntities: false,
            insertReferenceLink: {
                enabled: false,
                pos: 'append',
                format: `Source Link: [[%t][%u]]`
            },
            titleBlackList: '',
            convertImageAsDataUrl: false,
        }
    }
    /** Set data object (can be partial) into LocalStorage. */
    setData(d: Partial<MyStorage>): void {
        this.area.set(deepCopy(d))
    }
    /** Get data object from LocalStorage */
    getData (): Promise<MyStorage> {
        return this.area.get().then((_d) => {
            const d = _d as unknown as MyStorage
            // Too lazy to do migration ....
            if (
                !d ||
                d.listBulletChar === undefined
            ) {
                const defaultValue = storageManager.getDefaultData()
                storageManager.setData(defaultValue)
                return defaultValue
            }
            return d
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


export function copyToClipboard (text: string, html: string) {
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
    navigator.clipboard.writeText(text)
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